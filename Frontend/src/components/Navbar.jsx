import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Home, User, Phone, Briefcase, ChevronDown, LogOut } from 'lucide-react';
import LoginSignup from './LoginSignup';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; // Added import

const Navbar = () => {    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, signOut } = useAuth(); // Get currentUser and signOut from context
    const { showToast } = useToast(); // Added useToast
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [openDropdown, setOpenDropdown] = useState('');
    const [prevScrollPos, setPrevScrollPos] = useState(0);
    const [visible, setVisible] = useState(true);
    const [showLoginSignup, setShowLoginSignup] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const isAnalyzerPage = location.pathname === '/codechefloder' || location.pathname === '/LeetCodeProfileAnalyze';

    // Handle scroll effect for navbar
    useEffect(() => {
        if (isAnalyzerPage) {
            // For analyzer pages, navbar is always visible and not in "scrolled" state.
            // It will scroll with the page naturally due to className changes.
            setVisible(true);
            setIsScrolled(false); // Keep a consistent base appearance
            // No scroll listener needed for fixed behavior on these pages.
            return () => {}; // Return an empty cleanup function
        }

        // This part only runs for non-analyzer pages (fixed navbar behavior)
        const handleScroll = () => {
            const currentScrollPos = window.scrollY;
            
            // Show navbar at the very top of the page
            if (currentScrollPos === 0) {
                setVisible(true);
                setIsScrolled(false);
                setPrevScrollPos(currentScrollPos); // Update prevScrollPos here
                return;
            }

            // Determine scroll direction and visibility
            setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
            setIsScrolled(currentScrollPos > 50);
            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [prevScrollPos, isAnalyzerPage]); // Add isAnalyzerPage to dependency array

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

    const handleGetStartedClick = () => {
        setShowLoginSignup(true);
    };

    const handleCloseLoginSignup = () => {
        setShowLoginSignup(false);
    };    const handleLogout = async () => {
        try {
            const { error } = await signOut();
            if (error) throw error;
            setShowUserDropdown(false); // Close dropdown on logout
            navigate('/'); // Redirect to home or login page
        } catch (error) {
            console.error("Error signing out: ", error.message);
            // Handle logout error (e.g., display a message to the user)
        }
    };

    const handleAnalyzerNavigation = (route) => {
        if (!currentUser) {
            showToast('Please sign in to access the analyzer', 'info');
            setShowLoginSignup(true);
            setOpenDropdown('');
            return;
        }
        setOpenDropdown('');
        navigate(route);
    };

    const navItems = [
        { name: 'Home', icon: Home, action: () => navigate('/') },
        { 
            name: 'Services', 
            icon: Briefcase, 
            isDropdown: true,
            subItems: [
                { name: 'CodeChef', action: () => handleAnalyzerNavigation('/codechefloder') },
                { name: 'LeetCode', action: () => handleAnalyzerNavigation('/LeetCodeProfileAnalyze') },
                 { name: 'CodeFoces', action: () => handleAnalyzerNavigation('/codeforcesloder') }
            ]
        },
        { name: 'About', icon: User, action: () => navigate('/About') },        { name: 'Contact', icon: Phone, action: () => {
            const currentPath = window.location.pathname;
            const scrollToFooter = () => {
                // First try to scroll to the absolute bottom
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                });
                
                // Then after a small delay, ensure we're at the contact section
                setTimeout(() => {
                    const footer = document.getElementById('contact-section');
                    if (footer) {
                        footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                }, 100);
            };

            // If we're not on the homepage, navigate first then scroll
            if (currentPath !== '/') {
                navigate('/');
                // Wait for navigation and render to complete then scroll
                setTimeout(scrollToFooter, 300);
            } else {
                // If we're already on the current page, just scroll
                scrollToFooter();
            }
            
            // Close the mobile menu if it's open
            setIsMenuOpen(false);
        }},
    ];

    return (
        <> {/* Added Fragment to wrap Navbar and LoginSignup */}
            <nav className={
                isAnalyzerPage
                    ? "relative rounded-2xl  backdrop-blur-lg shadow-2xl border border-white/20 mt-4 mb-0 md:mt-6 md:mb-0 lg:mt-8 lg:mb-0 mx-12" // Set bottom margins to 0
                    : `fixed top-9 left-12 right-12 z-50 transition-all duration-500 rounded-2xl ${
                        !visible
                            ? 'opacity-0 translate-y-[-100%] pointer-events-none'
                            : isScrolled
                                ? 'bg-black/20 backdrop-blur-lg shadow-2xl border border-white/20 opacity-100 translate-y-0'
                                : 'bg-black/20 backdrop-blur-lg shadow-2xl border border-white/20 opacity-100 translate-y-0'
                    }` // Existing classes for fixed/auto-hiding navbar
            }>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`flex items-center justify-between ${isAnalyzerPage ? 'h-16 md:h-20' : 'h-16 md:h-20'}`}> {/* Reverted height on analyzer pages */}
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
                            {currentUser ? (
                                <div className="relative dropdown-container">
                                    <button
                                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                                        className="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors duration-200"
                                    >
                                        <span>Hi, {currentUser.user_metadata?.full_name || currentUser.email.split('@')[0]}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showUserDropdown && (
                                        <div className="absolute top-full right-0 mt-2 py-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700/50 z-50">
                                            <button
                                                onClick={() => { navigate('/profile'); setShowUserDropdown(false); }}
                                                className="w-full px-4 py-2 text-left text-white hover:bg-slate-700/50 transition-colors duration-200 flex items-center space-x-2"
                                            >
                                                <User className="w-4 h-4" />
                                                <span>Profile</span>
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-2 text-left text-white hover:bg-slate-700/50 transition-colors duration-200 flex items-center space-x-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleGetStartedClick}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                                >
                                    Get Started
                                </button>
                            )}
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
                                <div key={item.name}> {/* इंश्योर करें कि यह div ठीक से बंद हो */}
                                    {item.isDropdown ? (
                                        <>
                                            <button
                                                onClick={() => handleDropdownClick(item.name)}
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
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                                            </button>
                                            
                                            {/* Mobile Dropdown Menu */}
                                            <div className={`pl-12 mt-2 space-y-2 transition-all duration-300 ${openDropdown === item.name ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                                {item.subItems.map((subItem) => (
                                                    <button
                                                        key={subItem.name}
                                                        onClick={() => {
                                                            setIsMenuOpen(false);
                                                            setOpenDropdown('');
                                                            setTimeout(() => {
                                                                handleAnalyzerNavigation(subItem.action()); // Using handleAnalyzerNavigation
                                                            }, 100);
                                                        }}
                                                        className="w-full px-4 py-2 rounded-lg text-left text-white hover:bg-white/10 transition-colors duration-200"
                                                    >
                                                        {subItem.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                item.action();
                                            }}
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
                                        </button>
                                    )}
                                </div> /* यह navItems.map के अंदर वाले div का क्लोजिंग टैग है */
                            ))}
                            <div className="pt-4 border-t border-white/10">
                                {currentUser ? (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                navigate('/profile');
                                                setIsMenuOpen(false);
                                            }}
                                            className="group flex items-center w-full px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
                                        >
                                            <User className="w-5 h-5 mr-3 group-hover:text-purple-400 transition-colors" />
                                            <span className="font-medium group-hover:text-purple-400 transition-colors flex-1 text-left">
                                                Profile (Hi, {currentUser.user_metadata?.full_name || currentUser.email.split('@')[0]})
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="group flex items-center w-full px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
                                        >
                                            <LogOut className="w-5 h-5 mr-3 group-hover:text-purple-400 transition-colors" />
                                            <span className="font-medium group-hover:text-purple-400 transition-colors flex-1 text-left">
                                                Logout
                                            </span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleGetStartedClick();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                                    >
                                        Get Started
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div> {/* यह Mobile Navigation Menu वाले div का क्लोजिंग टैग है (`md:hidden...`) */}
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
            {showLoginSignup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
                    <LoginSignup onClose={handleCloseLoginSignup} />
                </div>
            )}
        </>
    );
};

export default Navbar;