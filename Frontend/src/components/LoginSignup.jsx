import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth for Supabase

const LoginSignup = ({ onClose }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isOtpView, setIsOtpView] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { signIn, signUp, signInWithOtp, verifyOtp, otpSent, setOtpSent } = useAuth();

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setIsOtpView(false);
    setOtpSent(false);
    setError('');
    setMessage('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setOtp('');
  };

  const toggleOtpView = () => {
    setIsOtpView(!isOtpView);
    setError('');
    setMessage('');
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!isLoginView) { // Sign Up
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }      try {
        // For signup with Supabase, include user metadata with full_name
        const { data, error: signUpError } = await signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName
            },
            emailRedirectTo: 'https://skillboard-nit5.onrender.com'
          }
        });

        if (signUpError) {
          setError(signUpError.message);
        } else if (data) {
          setMessage("Check your email for a confirmation link to complete your registration.");
        } else {
          setMessage("Signup initiated. Please check your email for a confirmation link.");
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred during sign up.');
      }
    } else if (isOtpView && otpSent) { // Verify OTP
      try {
        const { error: verifyError } = await verifyOtp(email, otp);
        if (verifyError) {
          setError(verifyError.message);
        } else {
          onClose(); // Close the modal on successful login
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred during OTP verification.');
      }
    } else if (isOtpView) { // Send OTP
      try {
        const { error: otpError } = await signInWithOtp(email);
        if (otpError) {
          setError(otpError.message);
        } else {
          setMessage("Check your email for the login code.");
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred while sending OTP.');
      }
    } else { // Regular Login
      try {
        const { data, error: signInError } = await signIn({ email, password });
        if (signInError) {
          setError(signInError.message);
        } else {
          onClose(); // Close the modal on successful login
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred during login.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md relative border border-slate-700/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-3xl disabled:opacity-50"
          disabled={loading}
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold mb-8 text-center text-white">
          {!isLoginView 
            ? 'Create Your Account' 
            : isOtpView 
              ? (otpSent ? 'Enter OTP Code' : 'Login with OTP') 
              : 'Welcome Back!'}
        </h2>
        
        {error && <p className="mb-4 text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
        {message && (
          <p className="mb-4 text-center text-green-400 bg-green-900/50 p-3 rounded-md">
            {message}
          </p>
        )}

        <form onSubmit={handleAuthAction} className="space-y-6">
          {!isLoginView && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white placeholder-slate-400"
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white placeholder-slate-400"
              placeholder="you@example.com"
              disabled={loading || (isOtpView && otpSent)}
            />
          </div>
          
          {isOtpView && otpSent ? (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">OTP Code</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white placeholder-slate-400"
                placeholder="Enter the code sent to your email"
                disabled={loading}
              />
            </div>
          ) : !isOtpView && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white placeholder-slate-400"
                  placeholder={isLoginView ? "Enter your password" : "Create a password (min. 6 characters)"}
                  disabled={loading}
                />
              </div>
              {!isLoginView && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white placeholder-slate-400"
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                </div>
              )}
            </>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-md font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading 
              ? (isLoginView 
                  ? (isOtpView 
                    ? (otpSent ? 'Verifying Code...' : 'Sending Code...') 
                    : 'Logging in...') 
                  : 'Creating Account...') 
              : (isLoginView 
                  ? (isOtpView 
                    ? (otpSent ? 'Verify Code' : 'Send Login Code') 
                    : 'Login with Password') 
                  : 'Create Account')}
          </button>
        </form>

        {isLoginView && (
          <div className="mt-4 text-center">
            <button
              onClick={toggleOtpView}
              disabled={loading}
              className="font-medium text-purple-400 hover:text-purple-300 focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isOtpView ? 'Login with Password Instead' : 'Login with Email OTP Instead'}
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-400">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={toggleView}
            disabled={loading}
            className="font-medium text-purple-400 hover:text-purple-300 focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoginView ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginSignup;