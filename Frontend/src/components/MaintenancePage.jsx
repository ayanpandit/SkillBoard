import { Wrench, Clock, Coffee } from 'lucide-react';

const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Main Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="bg-purple-600/20 p-4 rounded-full">
                                <Wrench className="w-12 h-12 text-purple-400" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                            Down for Maintenance
                        </h1>
                        <p className="text-slate-400 text-base">
                            We're currently performing scheduled maintenance to improve your CodeChef Profile Analyzer experience.
                        </p>
                    </div>

                    {/* Status Info */}
                    <div className="space-y-4 mb-8">
                        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                            <div className="flex items-center space-x-3">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <div>
                                    <p className="text-slate-300 font-medium">Estimated Duration</p>
                                    <p className="text-slate-400 text-sm">3-4 hours</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                            <div className="flex items-center space-x-3">
                                <Coffee className="w-5 h-5 text-amber-400" />
                                <div>
                                    <p className="text-slate-300 font-medium">What's Being Updated</p>
                                    <p className="text-slate-400 text-sm">Server optimization</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar 
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-slate-400 mb-2">
                            <span>Maintenance Progress</span>
                            <span>65%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300" style={{ width: '65%' }}></div>
                        </div>
                    </div>*/}


                </div>
                {/* Footer */}
                <footer className="mt-12 border-t border-slate-700 pt-8">
                    <div className="text-center space-y-6">
                        {/* Social Media Icons */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-slate-300">Connect With Us</h3>
                            <div className="flex justify-center space-x-6">
                                <a href="https://www.linkedin.com/in/ayan-pandey-b66067296/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                                <a href="https://www.instagram.com/ayanpandit_31?igsh=NWkyMzFrYTkxbTN5"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-700 hover:bg-pink-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.986 11.988 11.986s11.987-5.368 11.987-11.986C24.014 5.367 18.635.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.197-1.559-.748-.948-1.186-2.25-1.186-3.729 0-1.297.315-2.472.942-3.355.627-.882 1.51-1.559 2.441-1.933v1.297c-.627.374-1.186 1.049-1.49 1.933-.305.883-.441 1.933-.441 3.058 0 1.125.136 2.175.441 3.058.304.884.863 1.559 1.49 1.933v1.297zm7.098 0v-1.297c.627-.374 1.186-1.049 1.49-1.933.305-.883.441-1.933.441-3.058 0-1.125-.136-2.175-.441-3.058-.304-.884-.863-1.559-1.49-1.933V5.412c.931.374 1.814 1.051 2.441 1.933.627.883.942 2.058.942 3.355 0 1.479-.438 2.781-1.186 3.729-.749.948-1.9 1.559-3.197 1.559z" />
                                    </svg>
                                </a>
                                <a href="https://github.com/ayanpandit"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-700 hover:bg-gray-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Suggestion Box */}
                        <div>
                            <button
                                onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLScSyPv2Nc5gyqDu7wQ1JLNGLeLEdDzjhsYD9VfCaduIIEYZtg/viewform?usp=dialog', '_blank')}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send Suggestions
                            </button>
                        </div>

                        {/* Copyright */}
                        <div className="text-sm text-slate-500 border-t border-slate-700 pt-4">
                            <p>🌟 Built with passion and a pinch of late-night coffee — by Ayan Pandey 2023-27 </p>
                            <p>© 2025 CodeChef Profile Analyzer. </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MaintenancePage;