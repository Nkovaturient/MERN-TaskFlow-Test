/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Implements JWT-based authentication with secure storage and proper state management.
 * 
 * Features:
 * - User authentication state management
 * - Login/logout functionality
 * - Token persistence
 * - Role-based access control support
 * 
 * @author Senior Full-Stack Engineer
 * @version 1.0.0
 */

import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

// Create the authentication context
const AuthContext = createContext();

/**
 * Custom hook to use the authentication context
 * @returns {Object} Authentication context values and methods
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Authentication Provider Component
 * Manages authentication state and provides methods to login, logout, etc.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
const AuthProvider = ({ children }) => {
  /**
   * Initialize user state from localStorage if available
   * This ensures authentication persists across page refreshes
   */
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    
    return token && email ? { email } : null;
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BACKEND_URL = "http://localhost:5000";

  /**
   * Effect to check token validity on mount
   * In a production app, this would verify the token with the backend
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (token) {
          // In a real app, we would validate the token with the server
          // For this demo, we'll just check if it exists
          const email = localStorage.getItem("email");
          
          if (email) {
            setUser({ email });
          } else {
            // If email is missing but token exists, something is wrong
            // Clear authentication data
            handleLogout();
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  /**
   * Handles user login
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} User data
   */
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: email,
        password: password,
      });

      if (response.data.token) {
        // Generate a unique userId if not provided
        const userId = response.data.userId || `user-${Date.now()}`;
        
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("email", email);
        localStorage.setItem("userRole", response.data.role);
        localStorage.setItem("userId", userId);
        setUser({ email });
        return { email };
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to login. Please check your credentials.");
      throw error;
    }
  };

  /**
   * Handles user signup
   * @param {string} fullName - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User's role
   * @returns {Promise<Object>} User data
   */
  const signup = async (fullName, email, password, role) => {
    try {
      setError(null);
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        fullName: fullName,
        email: email,
        password: password,
        role: role,
      });

      if (response.data.token) {
        // Generate a unique userId if not provided
        const userId = response.data.userId || `user-${Date.now()}`;
        
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("email", email);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userId", userId);
        setUser({ email });
        return { email };
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Failed to create an account. Please try again.");
      throw error;
    }
  };

  /**
   * Handles user logout
   * Clears authentication data but keeps userRole for dashboard panel display
   */
  const handleLogout = () => {
    // Get user info before clearing
    const email = localStorage.getItem("email");
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    // Create logout log entry
    if (email && userRole) {
      const logData = {
        id: `logout-${Date.now()}`,
        userId: userId || "unknown",
        username: email,
        role: userRole,
        action: "logout",
        loginTime: null,
        logoutTime: new Date().toISOString(),
        ipAddress: "127.0.0.1", // In production, this would be captured from the request
        tokenName: token ? token.substring(0, 10) + "..." : "unknown"
      };
      
      // Store logout logs in localStorage for admin view
      const existingLogs = JSON.parse(localStorage.getItem('userLogs') || '[]');
      existingLogs.push(logData);
      localStorage.setItem('userLogs', JSON.stringify(existingLogs));
      
      console.log("User logout logged:", logData);
    }
    
    // Clear authentication data from localStorage but keep userRole
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    // Note: userRole is kept for dashboard panel display
    
    // Reset user state
    setUser(null);
    setError(null);
    
    // In a real app, we might also invalidate the token on the server
    console.log("User logged out - dashboard panel mode activated");
  };

  /**
   * Handles password reset request
   * @param {string} email - User's email
   * @returns {Promise<void>}
   */
  const resetPassword = async (email) => {
    // In a real app, this would make an API call
    console.log("Password reset requested for:", email);
    return Promise.resolve();
  };

  /**
   * Checks if the current user has a specific role
   * @param {string} requiredRole - Role to check for
   * @returns {boolean} Whether user has the required role
   */
  const hasRole = (requiredRole) => {
    const userRole = localStorage.getItem("userRole");
    return userRole === requiredRole;
  };

  /**
   * Context value with authentication state and methods
   */
  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout: handleLogout,
    resetPassword,
    hasRole,
    isAdmin: () => hasRole("admin"),
    isAuthenticated: !!user || !!localStorage.getItem("token"),
    // Check if user is in dashboard panel mode (logged out but has role)
    isDashboardPanelMode: !!(localStorage.getItem("userRole") && !localStorage.getItem("token")),
    // Get current user role for dashboard panel
    currentUserRole: localStorage.getItem("userRole") || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
