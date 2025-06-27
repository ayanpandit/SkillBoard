import bgImage from '../assets/bg.webp';
import { useNavigate } from 'react-router-dom';
import { Code2, Trophy, Users, Star, ExternalLink, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import LoginSignup from './LoginSignup';
import { useToast } from '../context/ToastContext';

const HomePage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [showLoginSignup, setShowLoginSignup] = useState(false);
    const { showToast } = useToast();

    const scrollToCards = () => {
        const cardsSection = document.getElementById('platforms-section');
        cardsSection?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const platforms = [
        {
            id: 'codechef',
            name: 'CodeChef',
            description: 'Competitive programming platform with monthly contests and practice problems',
            logo: '👨‍🍳',
            color: 'from-amber-500 to-orange-600',
            bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
            borderColor: 'border-amber-200',
            features: [
                { icon: Trophy, text: 'Heatmap' },
                { icon: Users, text: 'Userifo' },
                { icon: Star, text: 'Stars' },
                { icon: Code2, text: 'Manymore'}
            ],
            stats: {
                contests: '150+',
                problems: '3000+',
                users: '500K+',
                difficulty: 'Beginner to Expert'
            }
        },
        {
            id: 'leetcode',
            name: 'LeetCode',
            description: 'Premium coding interview preparation platform with algorithmic challenges',
            logo: '🔥',
            color: 'from-orange-500 to-red-600',
            bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
            borderColor: 'border-orange-200',
            features: [
                { icon: Trophy, text: 'Heatmap' },
                { icon: Users, text: 'Userifo' },
                { icon: Star, text: 'Stars' },
                { icon: Code2, text: 'Manymore'}
            ],
            stats: {
                contests: '300+',
                problems: '2500+',
                users: '1M+',
                difficulty: 'Easy to Hard'
            }
        },
        {
            id: 'CodeForces',
            name: 'CodeFoces',
            description: 'competative coding interview preparation platform with algorithmic challenges',
            logo: '🧠',
            color: 'from-orange-500 to-red-600',
            bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
            borderColor: 'border-orange-200',
            features: [
                { icon: Trophy, text: 'Heatmap' },
                { icon: Users, text: 'Userifo' },
                { icon: Star, text: 'Stars' },
                { icon: Code2, text: 'Manymore'}
            ],
            stats: {
                contests: '300+',
                problems: '2500+',
                users: '1M+',
                difficulty: 'Easy to Hard'
            }
        }
    ];

    const handleAnalyzerNavigation = (platformId) => {
        if (!currentUser) {
            showToast('Please sign in to access the analyzer', 'info');
            setShowLoginSignup(true);
            return;
        }

        if (platformId === 'codechef') {
            navigate('/codechefloder');
        } else if (platformId === 'leetcode') {
            navigate('/LeetCodeProfileAnalyze');
        }
        else if (platformId === 'CodeForces') {
            navigate('/codeforcesloder');
        }
    };

    return (
        <div className="min-h-screen relative">
            {/* Login/Signup Modal */}
            {showLoginSignup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <LoginSignup onClose={() => setShowLoginSignup(false)} />
                </div>
            )}

            {/* Static Background */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
            ></div>            {/* Scrollable Content */}
            <div className="relative z-10 min-h-screen">                {/* Hero Section */}
                <section className="min-h-screen flex items-center justify-center px-4 py-20 pt-48" itemScope itemType="https://schema.org/WebPage">
                    <div className="max-w-7xl mx-auto text-center">                        {/* Main Heading */}
                        <div className="mb-12">
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-8 leading-tight" itemProp="headline">
                                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                                    Skill
                                </span>
                                <span className="text-white drop-shadow-2xl">Board</span>
                            </h1>                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-200 mb-6" itemProp="alternativeHeadline">
                                Intelligent Coding Profile Analysis for Candidate Evaluation
                            </h2>
                            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed mb-12 px-4" itemProp="description">
                                SkillBoard empowers recruiters by providing a comprehensive platform to analyze candidates' coding profiles 
                                from multiple competitive programming platforms like CodeChef and LeetCode. Simplify hiring with data-driven 
                                insights, performance metrics, and bulk profile search capabilities.
                            </p>
                        </div>

                        {/* Enhanced CTA Button */}
                        <div className="flex flex-col items-center space-y-8">
                            <button
                                onClick={scrollToCards}
                                className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-xl rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transform hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-purple-500/25 border border-white/20"
                            >
                                <span className="relative z-10">Start Comparing</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                            </button>

                            {/* Animated Scroll Indicator */}
                            <div className="flex flex-col items-center space-y-4 animate-bounce">
                                <p className="text-white/70 text-sm">Scroll down to explore</p>
                                <ChevronDown className="w-6 h-6 text-white/70" />
                            </div>
                        </div>
                    </div>
                </section>                {/* Platform Cards Section */}
                <section id="platforms-section" className="py-16 px-4" itemScope itemType="https://schema.org/ItemList">
                    <div className="max-w-5xl mx-auto">
                        {/* Section Header */}
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6" itemProp="name">
                                Supported Platforms
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4" itemProp="description">
                                Currently supporting the most popular competitive programming platforms with more coming soon
                            </p>
                        </div>                        {/* Platform Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                            {platforms.map((platform, index) => (
                                <div
                                    key={platform.id}
                                    className={`${platform.bgColor} rounded-2xl p-6 border-2 ${platform.borderColor} transform hover:scale-105 transition-all duration-500 hover:shadow-2xl backdrop-blur-lg bg-opacity-90`}
                                    itemScope 
                                    itemType="https://schema.org/SoftwareApplication"
                                    itemProp="itemListElement"
                                >
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-3xl">{platform.logo}</div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800" itemProp="name">{platform.name}</h3>
                                                <p className="text-sm text-gray-600 max-w-xs" itemProp="description">{platform.description}</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors" />
                                    </div>

                                    {/* Features Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {platform.features.map((feature, index) => (
                                            <div key={index} className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg">
                                                <feature.icon className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                                <span className="text-xs font-medium text-gray-700">{feature.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handleAnalyzerNavigation(platform.id)}
                                        className={`w-full py-3 bg-gradient-to-r ${platform.color} text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2`}
                                    >
                                        {currentUser ? (
                                            <>
                                                <span>Analyze {platform.name} Profile</span>
                                                <Code2 className="w-5 h-5" />
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign in to Analyze {platform.name}</span>
                                                <Users className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Coming Soon */}
                        <div className="text-center mt-12">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 max-w-2xl mx-auto">
                                <h3 className="text-xl font-bold text-white mb-4">More Platforms Coming Soon</h3>
                                <p className="text-gray-300 mb-4 text-sm">
                                    We're working on adding support for Codeforces, HackerRank, AtCoder, and more!
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['Codeforces', 'HackerRank', 'AtCoder', 'TopCoder'].map((platform) => (
                                        <span key={platform} className="px-3 py-1 bg-white/20 text-white rounded-full text-xs">
                                            {platform}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>                {/* Footer */}
                <footer id="contact-section" className="mt-12 border-t border-slate-700 pt-8" itemScope itemType="https://schema.org/WPFooter">
                    <div className="text-center space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-slate-300">Connect With Me</h3>
                            <div className="flex justify-center space-x-6">
                                <a href="https://www.linkedin.com/in/ayan-pandey-b66067296/" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" aria-label="LinkedIn Profile" itemProp="sameAs">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                                <a href="https://github.com/ayanpandit" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-700 hover:bg-gray-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" aria-label="GitHub Profile">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                                <a href="https://www.instagram.com/ayanpandit_31?igsh=NWkyMzFrYTkxbTN5" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-700 hover:bg-pink-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" aria-label="Instagram Profile">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <button onClick={() => window.open('https://forms.gle/xcraRbXbaAyiqhpj7', '_blank')} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send Suggestions
                            </button>
                        </div>                        <div className="text-sm text-slate-500 border-t border-slate-700 pt-4">
                            <p>🌟 Built with passion and a pinch of late-night coffee — by Ayan Pandey 2023-27</p>
                            <p itemProp="copyrightNotice">© 2025 SkillBoard.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default HomePage;
