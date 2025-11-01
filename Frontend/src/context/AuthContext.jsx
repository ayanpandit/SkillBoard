import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null); // Supabase uses sessions
  const [loading, setLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false); // Track if OTP has been sent
  const [isAdmin, setIsAdmin] = useState(false); // Track if user is admin

  useEffect(() => {
    // Check for an existing session
    const checkSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setCurrentUser(currentSession?.user ?? null);
      
      // Check if admin is logged in from localStorage
      const adminLoggedIn = localStorage.getItem('isAdmin') === 'true';
      if (adminLoggedIn) {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setIsAdmin(true);
        setCurrentUser(adminUser);
      }
      
      setLoading(false);
    };

    checkSession();

    // Listen for changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  // Regular email/password signup
  const signUp = async (data) => {
    return supabase.auth.signUp({
      ...data,
      options: {
        ...data.options,
        emailRedirectTo: import.meta.env.VITE_SUPABASE_SITE_URL || window.location.origin
      }
    });
  };

  // Regular email/password signin
  const signInWithPassword = async (data) => {
    return supabase.auth.signInWithPassword(data);
  };

  // Send OTP to email
  const signInWithOtp = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: import.meta.env.VITE_SUPABASE_SITE_URL || window.location.origin
      }
    });
    
    if (!error) {
      setOtpSent(true);
    }
    
    return { data, error };
  };

  // Verify OTP
  const verifyOtp = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    
    if (!error) {
      setOtpSent(false);
    }
    
    return { data, error };
  };

  // Admin login function
  const adminSignIn = async (username, password) => {
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (username === adminUsername && password === adminPassword) {
      // Create a mock admin user object
      const adminUser = {
        id: 'admin-user',
        email: 'admin@skillboard.com',
        user_metadata: {
          full_name: 'Admin User',
          role: 'admin'
        },
        role: 'admin'
      };

      // Store admin session in localStorage
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      
      setIsAdmin(true);
      setCurrentUser(adminUser);
      
      return true;
    }
    
    return false;
  };

  // Custom sign out that handles both Supabase and admin logout
  const customSignOut = async () => {
    if (isAdmin) {
      // Admin logout
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminUser');
      setIsAdmin(false);
      setCurrentUser(null);
      return { error: null };
    } else {
      // Regular Supabase logout
      return supabase.auth.signOut();
    }
  };

  // Expose Supabase auth functions and user/session state
  const value = {
    signUp,
    signIn: signInWithPassword,
    signInWithOtp,
    verifyOtp,
    adminSignIn,
    signOut: customSignOut,
    currentUser,
    session,
    loading,
    otpSent,
    setOtpSent,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};