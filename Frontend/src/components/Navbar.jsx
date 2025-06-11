import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Home, User, Phone, Briefcase, ChevronDown } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [openDropdown, setOpenDropdown] = useState('');

    // Handle scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDropdownClick = (name) => {
        setOpenDropdown(openDropdown === name ? '' : name);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setOpenDropdown('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const scrollToCards = () => {
        const cardsSection = document.getElementById('platforms-section');
        cardsSection?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const navItems = [
        { name: 'Home', icon: Home, action: () => navigate('/') },
        { 
            name: 'Services', 
            icon: Briefcase, 
            isDropdown: true,
            subItems: [
                { name: 'CodeChef', action: () => navigate('/codechefloder') },
                { name: 'LeetCode', action: () => navigate('/LeetCodeProfileAnalyze') }
            ]
        },
        { name: 'About', icon: User, action: () => navigate('/About') },        { name: 'Contact', icon: Phone, action: () => {
            const currentPath = window.location.pathname;
            const scrollToFooter = () => {
                const footer = document.getElementById('contact-section');
                if (footer) {
                    footer.scrollIntoView({ behavior: 'smooth' });
                }
            };

            // If we're already on the current page, just scroll
            scrollToFooter();

            // If we're not on the homepage and clicking contact, first navigate then scroll
            if (currentPath !== '/') {
                navigate('/');
                // Wait for navigation to complete then scroll
                setTimeout(scrollToFooter, 100);
            }
        }},
    ];

    return (
        <nav className={`fixed top-9 left-12 right-12 z-50 transition-all duration-500 rounded-2xl ${
            isScrolled 
                ? 'opacity-0 translate-y-[-100%] pointer-events-none' 
                : 'bg-black/20 backdrop-blur-lg shadow-2xl border border-white/20 opacity-100 translate-y-0'
        }`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
                        <h1 className="text-2xl md:text-3xl font-bold">
                            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                Skill
                            </span>
                            <span className="text-white">Board</span>
                        </h1>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex space-x-8">
                        {navItems.map((item) => (
                            <div key={item.name} className="dropdown-container relative">
                                <button
                                    onClick={() => item.isDropdown ? handleDropdownClick(item.name) : item.action()}
                                    className="text-white hover:text-purple-400 transition-colors duration-200 flex items-center space-x-1 group"
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                    {item.isDropdown && (
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                                    )}
                                </button>
                                
                                {/* Desktop Dropdown Menu */}
                                {item.isDropdown && openDropdown === item.name && (
                                    <div className="absolute top-full left-0 mt-2 py-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700/50">
                                        {item.subItems.map((subItem) => (
                                            <button
                                                key={subItem.name}
                                                onClick={subItem.action}
                                                className="w-full px-4 py-2 text-left text-white hover:bg-slate-700/50 transition-colors duration-200 flex items-center space-x-2"
                                            >
                                                <span>{subItem.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* CTA Button - Desktop */}
                    <div className="hidden md:block">
                        <button
                            onClick={scrollToCards}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
                        >
                            {isMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`md:hidden transition-all duration-500 overflow-hidden ${
                isMenuOpen 
                    ? 'max-h-[400px] opacity-100' 
                    : 'max-h-0 opacity-0'
            }`}>
                <div className="bg-black/40 backdrop-blur-lg border-t border-white/10 rounded-b-2xl">
                    <div className="px-4 py-4 space-y-2">
                        {navItems.map((item, index) => (
                            <div key={item.name}>
                                <button
                                    onClick={() => item.isDropdown ? handleDropdownClick(item.name) : (item.action(), setIsMenuOpen(false))}
                                    className="group flex items-center w-full px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        animation: isMenuOpen ? 'slideInFromRight 0.5s ease-out forwards' : 'none'
                                    }}
                                >
                                    <item.icon className="w-5 h-5 mr-3 group-hover:text-purple-400 transition-colors" />
                                    <span className="font-medium group-hover:text-purple-400 transition-colors flex-1 text-left">
                                        {item.name}
                                    </span>
                                    {item.isDropdown && (
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                                    )}
                                </button>
                                
                                {/* Mobile Dropdown Menu */}
                                {item.isDropdown && openDropdown === item.name && (
                                    <div className="pl-12 mt-2 space-y-2">
                                        {item.subItems.map((subItem) => (
                                            <button
                                                key={subItem.name}
                                                onClick={() => {
                                                    subItem.action();
                                                    setIsMenuOpen(false);
                                                    setOpenDropdown('');
                                                }}
                                                className="w-full px-4 py-2 rounded-lg text-left text-white hover:bg-white/10 transition-colors duration-200"
                                            >
                                                {subItem.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="pt-4 border-t border-white/10">
                            <button
                                onClick={() => {
                                    scrollToCards();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animation styles */}
            <style jsx>{`
                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
