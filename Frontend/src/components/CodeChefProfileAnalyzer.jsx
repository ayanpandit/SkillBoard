// src/components/CodeChefProfileAnalyzer.jsx
import React, { useState } from 'react';
import {
    Search, UserCircle, Star, Award, Trophy, Map, BarChart, Activity,
    AlertCircle, CheckCircle, Loader2, ExternalLink
} from 'lucide-react';

// Backend API URL with environment variable support
const API_BASE_URL = import.meta.env.DEV 
    ? import.meta.env.VITE_CODECHEF_API_URL_DEV || 'http://127.0.0.1:5000'
    : import.meta.env.VITE_CODECHEF_API_URL_PROD || 'https://codechefprofileanalyzerbackendnode.onrender.com';

// Star component for rating display
const StarIcon = ({ className }) => (
    <Star className={className} />
);

// Loading component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-slate-300">Fetching profile data...</span>
    </div>
);

// Error component
const ErrorMessage = ({ message }) => (
    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
        <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-300">{message}</span>
        </div>
    </div>
);

// Success message component
const SuccessMessage = ({ message }) => (
    <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
        <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-300">{message}</span>
        </div>
    </div>
);

// Profile card component
const ProfileCard = ({ profile }) => {
    const getStarColor = (star) => {
        if (!star || star === "N/A") return "text-slate-400";
        const starCount = parseInt(star);
        if (starCount >= 6) return "text-red-400";
        if (starCount >= 5) return "text-orange-400";
        if (starCount >= 4) return "text-yellow-400";
        if (starCount >= 3) return "text-green-400";
        if (starCount >= 2) return "text-blue-400";
        return "text-purple-400";
    };

    return (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div className="flex items-center mb-4 md:mb-0">
                    <UserCircle className="h-16 w-16 text-orange-500 mr-4" />
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">{profile.name}</h2>
                        <div className="flex items-center mt-1">
                            <span className="text-slate-400">@{profile.username}</span>
                            {profile.star && profile.star !== "N/A" && (
                                <div className={`flex items-center ml-3 ${getStarColor(profile.star)}`}>
                                    <StarIcon className="h-4 w-4 mr-1" />
                                    <span className="font-semibold">{profile.star}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <a
                    href={`https://www.codechef.com/users/${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on CodeChef
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Current Rating */}
                <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <BarChart className="h-5 w-5 text-blue-400 mr-2" />
                        <span className="text-slate-300 font-medium">Current Rating</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                        {profile.current_rating || "N/A"}
                    </div>
                </div>

                {/* Highest Rating */}
                <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                        <span className="text-slate-300 font-medium">Highest Rating</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                        {profile.highest_rating || "N/A"}
                    </div>
                </div>

                {/* Global Rank */}
                <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <Award className="h-5 w-5 text-purple-400 mr-2" />
                        <span className="text-slate-300 font-medium">Global Rank</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                        {profile.global_rank || "N/A"}
                    </div>
                </div>

                {/* Country */}
                <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <Map className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-slate-300 font-medium">Country</span>
                    </div>
                    <div className="text-xl font-semibold text-green-400">
                        {profile.country || "N/A"}
                    </div>
                </div>

                {/* Country Rank */}
                <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <Award className="h-5 w-5 text-indigo-400 mr-2" />
                        <span className="text-slate-300 font-medium">Country Rank</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-400">
                        {profile.country_rank || "N/A"}
                    </div>
                </div>

                {/* Contests Participated */}
                <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-orange-400 mr-2" />
                        <span className="text-slate-300 font-medium">Contests</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-400">
                        {profile.contests_participated || "N/A"}
                    </div>
                </div>

                {/* Problems Solved */}
                <div className="bg-slate-700 rounded-lg p-4 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                        <span className="text-slate-300 font-medium">Problems Solved</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">
                        {profile.problems_solved || "N/A"}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main component
const CodeChefProfileAnalyzer = () => {
    const [username, setUsername] = useState('');
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch profile data
    const fetchProfile = async () => {
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        setProfile(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/${username.trim()}`);
            const data = await response.json();

            if (data.success) {
                setProfile(data);
                setSuccessMessage('Profile fetched successfully!');
            } else {
                setError(data.error || 'Failed to fetch profile');
            }
        } catch (err) {
            setError('Network error: Unable to connect to the server');
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        fetchProfile();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-4">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center mb-4">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full mr-4">
                            <Trophy className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                            CodeChef Profile Analyzer
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Analyze CodeChef profiles to get comprehensive insights into coding performance, 
                        ratings, rankings, and competitive programming achievements.
                    </p>
                </div>

                {/* Search Form */}
                <div className="bg-slate-800 rounded-lg p-6 mb-8 shadow-xl border border-slate-700">
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Enter CodeChef username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !username.trim()}
                            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Analyzing...
                                </div>
                            ) : (
                                'Analyze Profile'
                            )}
                        </button>
                    </form>
                </div>

                {/* Messages */}
                {error && <ErrorMessage message={error} />}
                {successMessage && <SuccessMessage message={successMessage} />}

                {/* Loading State */}
                {isLoading && <LoadingSpinner />}

                {/* Profile Display */}
                {profile && !isLoading && <ProfileCard profile={profile} />}

                {/* Instructions */}
                {!profile && !isLoading && (
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center">
                            <UserCircle className="h-6 w-6 text-orange-400 mr-2" />
                            How to Use
                        </h2>
                        <div className="space-y-3 text-slate-300">
                            <div className="flex items-start">
                                <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
                                <p>Enter a valid CodeChef username in the search box above</p>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
                                <p>Click "Analyze Profile" to fetch comprehensive profile data</p>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
                                <p>View detailed statistics including ratings, ranks, contests, and problems solved</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <footer id="contact-section" className="mt-12 border-t border-slate-700 pt-8">
                    <div className="text-center space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-slate-300">Connect With Me</h3>
                            <div className="flex justify-center space-x-6">
                                <a 
                                    href="https://www.linkedin.com/in/ayan-pandey-b66067296/" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="p-3 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" 
                                    aria-label="LinkedIn Profile"
                                >
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                                <a 
                                    href="https://github.com/ayanpandit" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="p-3 bg-slate-700 hover:bg-gray-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" 
                                    aria-label="GitHub Profile"
                                >
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                                <a 
                                    href="https://www.instagram.com/ayanpandit_31?igsh=NWkyMzFrYTkxbTN5" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="p-3 bg-slate-700 hover:bg-pink-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" 
                                    aria-label="Instagram Profile"
                                >
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <button 
                                onClick={() => window.open('https://forms.gle/xcraRbXbaAyiqhpj7', '_blank')} 
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send Suggestions
                            </button>
                        </div>
                        <div className="text-sm text-slate-500 border-t border-slate-700 pt-4">
                            <p>🌟 Built with passion and a pinch of late-night coffee — by Ayan Pandey 2023-27</p>
                            <p>© 2025 SkillBoard.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CodeChefProfileAnalyzer;
