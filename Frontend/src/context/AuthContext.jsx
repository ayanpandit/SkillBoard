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

  useEffect(() => {
    // Check for an existing session
    const checkSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setCurrentUser(currentSession?.user ?? null);
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
        emailRedirectTo: 'https://skillboard-nit5.onrender.com'
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
        emailRedirectTo: 'https://skillboard-nit5.onrender.com'
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

  // Expose Supabase auth functions and user/session state
  const value = {
    signUp,
    signIn: signInWithPassword,
    signInWithOtp,
    verifyOtp,
    signOut: () => supabase.auth.signOut(),
    currentUser,
    session,
    loading,
    otpSent,
    setOtpSent
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};