import React from 'react';
import bgImage from '../assets/bg.jpg';
import { useNavigate } from 'react-router-dom';

import { Code2, Trophy, Users, Calendar, Star, ExternalLink, TrendingUp, ChevronDown } from 'lucide-react';

const HomePage = () => {
    const scrollToCards = () => {
        const cardsSection = document.getElementById('platforms-section');
        cardsSection?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };
    const navigate = useNavigate();

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
                { icon: Trophy, text: 'Monthly Long Challenge' },
                { icon: Users, text: '500K+ Active Users' },
                { icon: Code2, text: '3000+ Problems' },
                { icon: Star, text: 'Global Rankings' }
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
                { icon: TrendingUp, text: 'Interview Prep' },
                { icon: Users, text: '1M+ Developers' },
                { icon: Code2, text: '2500+ Problems' },
                { icon: Calendar, text: 'Weekly Contests' }
            ],
            stats: {
                contests: '300+',
                problems: '2500+',
                users: '1M+',
                difficulty: 'Easy to Hard'
            }
        }
    ];

    return (
        <div className="min-h-screen relative">
            {/* Static Background */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}

            >

            </div>

            {/* Scrollable Content */}
            <div className="relative z-10 min-h-screen">
                {/* Hero Section */}
                <section className="min-h-screen flex items-center justify-center px-4 py-20">
                    <div className="max-w-7xl mx-auto text-center">
                        {/* Main Heading */}
                        <div className="mb-12">
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-8 leading-tight">
                                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                                    Code
                                </span>
                                <span className="text-white drop-shadow-2xl">Compare</span>
                            </h1>
                            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 max-w-4xl mx-auto leading-relaxed mb-12 px-4">
                                Compare your coding profiles across multiple platforms. Track progress, analyze performance, and level up your competitive programming journey.
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

                        {/* Floating Elements for Beauty */}
                        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse hidden lg:block"></div>
                        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000 hidden lg:block"></div>
                        <div className="absolute bottom-40 left-1/4 w-16 h-16 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-2000 hidden lg:block"></div>
                    </div>
                </section>

                {/* Platform Cards Section */}
                <section id="platforms-section" className="py-16 px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* Section Header */}
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                                Supported Platforms
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
                                Currently supporting the most popular competitive programming platforms with more coming soon
                            </p>
                        </div>

                        {/* Platform Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                            {platforms.map((platform) => (
                                <div
                                    key={platform.id}
                                    className={`${platform.bgColor} rounded-2xl p-6 border-2 ${platform.borderColor} transform hover:scale-105 transition-all duration-500 hover:shadow-2xl backdrop-blur-lg bg-opacity-90`}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-3xl">{platform.logo}</div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800">{platform.name}</h3>
                                                <p className="text-sm text-gray-600 max-w-xs">{platform.description}</p>
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
                                        onClick={() => {
                                            if (platform.id === 'codechef') {
                                                // Navigate to CodeChef loader
                                                window.location.href = '/codechefloder';
                                            } else if (platform.id === 'leetcode') {
                                                // Navigate to LeetCode loader
                                                window.location.href = '/LeetCodeProfileAnalyze';
                                            }
                                        }}
                                        className={`w-full py-3 bg-gradient-to-r ${platform.color} text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300`}
                                    >
                                        Analyze {platform.name} Profile
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
                </section>

                {/* Footer */}
                <footer className="py-12 px-4 border-t border-white/20">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="text-white/80 mb-4">
                            Built with ❤️ for the competitive programming community
                        </div>
                        <div className="text-white/60 text-sm">
                            © 2025 CodeCompare. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default HomePage;