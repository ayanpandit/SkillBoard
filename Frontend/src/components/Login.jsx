// src/components/Login.jsx
import React, { useState, useEffect } from "react";

// Pulsating Loader Component (can take a text prop)
const PulsatingLoader = ({ text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center h-full">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-400 text-xs font-semibold">
                CodeChef
            </div>
        </div>
        <p className="mt-6 text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse">
            {text}
        </p>
    </div>
);


export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false); // For API call loading state
    const [showPageLoader, setShowPageLoader] = useState(true); // For initial 2-sec loader
    const [isRedirecting, setIsRedirecting] = useState(false); // For loader after successful login

    useEffect(() => {
        // Initial page loader
        const timer = setTimeout(() => {
            setShowPageLoader(false);
        }, 2000); // 2-second loader
        return () => clearTimeout(timer);
    }, []);

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setMessage(""); // Clear previous messages

        try {
            // *** CRITICAL CHANGE HERE: Added /login to the endpoint ***
            const response = await fetch("https://authorization-wig7.onrender.com", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                setMessage(responseData.message || `Login failed. Status: ${response.status}`);
                // setLoading(false); // Will be handled in finally if not redirecting
                return; // Return early on error
            }

            if (responseData.success) {
                setIsRedirecting(true); // Trigger the redirect loader
                setTimeout(() => {
                    if (onLoginSuccess) {
                        onLoginSuccess();
                    }
                    // Component will likely unmount, so no need to setIsRedirecting(false)
                }, 2000); // 2-second delay for redirect loader
            } else {
                setMessage(responseData.message || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            setMessage("Network error, backend issue, or incorrect endpoint. Please try again.");
            console.error("Login error:", error);
        } finally {
            // Only set loading to false if we are not in the process of redirecting
            // because the redirecting state itself implies a loading/transition phase.
            if (!isRedirecting) {
                setLoading(false);
            }
        }
    }

    if (showPageLoader) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col justify-center items-center">
                <PulsatingLoader text="Initializing Analyzer..." />
            </div>
        );
    }

    if (isRedirecting) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col justify-center items-center">
                <PulsatingLoader text="Login Successful! Redirecting..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col">
            <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                            Analyzer Login
                        </h1>
                        <p className="text-slate-400 text-sm mt-2">
                            Access your CodeChef Profile Analyzer account.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-slate-400 mb-1"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="block w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-400 mb-1"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="block w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Enter your password"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading && !isRedirecting} // Disable only if API loading, not during redirect phase
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                            >
                                {(loading && !isRedirecting) ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </div>
                    </form>

                    {message && !isRedirecting && ( // Only show message if not redirecting
                        <p className={`mt-6 text-center text-sm ${message.toLowerCase().includes("successful") ? "text-green-400" : "text-red-400"
                            }`}>
                            {message}
                        </p>
                    )}
                    <p className="mt-8 text-center text-xs text-slate-500">
                        Don't have Credentials? Contact the Developer.
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-700 pt-8 pb-8">
                <div className="container mx-auto px-4">
                    <div className="text-center space-y-6">
                        {/* Social Media Icons */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-slate-300">Connect With The Creator</h3>
                            <div className="flex justify-center space-x-4 sm:space-x-6">
                                <a href="https://www.linkedin.com/in/ayan-pandey-b66067296/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110"
                                    aria-label="LinkedIn">
                                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                                <a href="https://www.instagram.com/ayanpandit_31?igsh=NWkyMzFrYTkxbTN5"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-700 hover:bg-pink-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110"
                                    aria-label="Instagram">
                                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218 1.791.465 2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.634 4.02c.636-.247 1.363-.416 2.427-.465C10.13 2.013 10.484 2 12.315 2zm0 1.624c-2.363 0-2.694.01-3.643.056-.944.045-1.505.208-1.96.386a3.283 3.283 0 00-1.188.784 3.284 3.284 0 00-.784 1.188c-.178.455-.341 1.016-.386 1.96-.046.949-.056 1.28-.056 3.643s.01 2.694.056 3.643c.045.944.208 1.505.386 1.96a3.284 3.284 0 00.784 1.188 3.283 3.283 0 001.188.784c.455.178 1.016.341 1.96.386.949.046 1.28.056 3.643.056s2.694-.01 3.643-.056c.944-.045 1.505-.208 1.96-.386a3.283 3.283 0 001.188-.784 3.284 3.284 0 00.784-1.188c.178-.455.341 1.016-.386 1.96.046-.949.056-1.28.056-3.643s-.01-2.694-.056-3.643c-.045-.944-.208-1.505-.386-1.96a3.284 3.284 0 00-.784-1.188 3.283 3.283 0 00-1.188-.784c-.455-.178-1.016-.341-1.96-.386-.949-.046-1.28-.056-3.643-.056zM12 6.865a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 1.624a3.51 3.51 0 110 7.02 3.51 3.51 0 010-7.02zM16.95 6.32a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" fillRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="https://github.com/ayanpandit"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-700 hover:bg-gray-500 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110"
                                    aria-label="GitHub">
                                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Copyright */}
                        <div className="text-sm text-slate-500 border-t border-slate-700 pt-6 mt-6">
                           <p>🌟 Built with passion and a pinch of late-night coffee — by Ayan Pandey 2023-27 </p>
                        <p>© 2025 CodeChef Profile Analyzer. </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}