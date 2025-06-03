import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Rocket, 
  Search, 
  Wrench, 
  Star, 
  Mail, 
  Shield, 
  Code, 
  TrendingUp, 
  Award, 
  BarChart3, 
  Zap,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  ArrowUp
} from 'lucide-react';

const About = () => {
  const [isVisible, setIsVisible] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all sections
    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    // Scroll to top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Track Performance",
      desc: "Monitor your problem-solving progress"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Discover Patterns",
      desc: "Analyze your submission trends"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Showcase Rankings",
      desc: "Display your badges and achievements"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Compare Stats",
      desc: "Track your coding journey over time"
    }
  ];

  const techStack = [
    {
      category: "Frontend",
      technologies: ["React", "Tailwind CSS", "Three.js"],
      icon: <Code className="w-6 h-6" />
    },
    {
      category: "Backend", 
      technologies: ["Python Flask", "Real-time APIs", "Data Scraping"],
      icon: <Zap className="w-6 h-6" />
    },
    {
      category: "Deployment",
      technologies: ["Render Hosting", "Speed Optimized", "99% Uptime"],
      icon: <Rocket className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div 
            id="hero"
            data-animate
            className={`text-center transform transition-all duration-1000 ${
              isVisible.hero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl">
                <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              About SkillBoard
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Your personalized dashboard for competitive programming insights. Whether you're preparing for placements, 
              sharpening your skills, or passionate about problem-solving — SkillBoard gives you a clear view of your coding journey.
            </p>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </section>

      {/* Mission Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div 
            id="mission"
            data-animate
            className={`transform transition-all duration-1000 delay-200 ${
              isVisible.mission ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="bg-gradient-to-r from-slate-800/50 to-purple-800/30 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-purple-500/20">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-2xl">
                    <Rocket className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-orange-400">
                    Our Mission
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                    Our mission is simple: <span className="text-orange-400 font-semibold">To empower coders with meaningful insights into their competitive programming progress.</span> We aim to make your hard work visible, your achievements measurable, and your journey shareable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div 
            id="whatwedo"
            data-animate
            className={`transform transition-all duration-1000 delay-300 ${
              isVisible.whatwedo ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-2xl">
                  <Search className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-green-400">
                What We Do
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
                SkillBoard pulls data from popular coding platforms like <span className="text-green-400 font-semibold">CodeChef</span> and <span className="text-blue-400 font-semibold">LeetCode</span> and presents it in a clean, fast, and futuristic interface.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="group">
                  <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-purple-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-xl text-gray-300">
                All in one place — <span className="text-purple-400 font-semibold">no clutter, no confusion</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div 
            id="techstack"
            data-animate
            className={`transform transition-all duration-1000 delay-400 ${
              isVisible.techstack ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl shadow-2xl">
                  <Wrench className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-yellow-400">
                How We Built It
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                SkillBoard is proudly built using cutting-edge full-stack technologies
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {techStack.map((stack, index) => (
                <div key={index} className="group">
                  <div className="bg-gradient-to-br from-slate-800/50 to-orange-800/30 backdrop-blur-sm rounded-3xl p-8 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl h-full">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        {stack.icon}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-yellow-400">
                        {stack.category}
                      </h3>
                      <div className="space-y-3">
                        {stack.technologies.map((tech, techIndex) => (
                          <div key={techIndex} className="flex items-center justify-center">
                            <ChevronRight className="w-5 h-5 text-orange-400 mr-3" />
                            <span className="text-gray-300 text-base sm:text-lg">{tech}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-lg text-gray-300">
                Our site is optimized for both performance and experience — mobile-responsive, quick to load, and always evolving.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why SkillBoard Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div 
            id="why"
            data-animate
            className={`transform transition-all duration-1000 delay-500 ${
              isVisible.why ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="bg-gradient-to-r from-slate-800/50 to-indigo-800/30 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-indigo-500/20">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-2xl">
                    <Star className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-indigo-400">
                  Why SkillBoard?
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-6">
                  There are many platforms to code on, but few to <span className="text-indigo-400 font-semibold">understand your growth</span>.
                </p>
                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  SkillBoard bridges that gap. It's not just a tool — it's your <span className="text-purple-400 font-semibold">coding companion</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div 
            id="privacy"
            data-animate
            className={`transform transition-all duration-1000 delay-700 ${
              isVisible.privacy ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="bg-gradient-to-r from-slate-800/50 to-green-800/30 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-green-500/20">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-2xl">
                    <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-green-400">
                    Built with Passion, Respecting Your Privacy
                  </h2>
                  <p className="text-lg text-gray-300 leading-relaxed mb-4">
                    We value your trust. Your data is never stored or misused — it's fetched live from official sources and presented only to you.
                  </p>
                  <p className="text-lg text-green-400 font-semibold">
                    Transparency is part of who we are.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="p-8 bg-gradient-to-r from-slate-800/30 to-purple-800/20 backdrop-blur-sm rounded-3xl border border-purple-500/20">
            <p className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text mb-4">
              Thank you for using SkillBoard.
            </p>
            <p className="text-lg sm:text-xl text-gray-300">
              Let's build your coding legacy — one problem at a time. 💻🚀
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50 hover:shadow-purple-500/25"
        >
          <ArrowUp className="w-6 h-6 text-white" />
        </button>
      )}
      <footer className="mt-12 border-t border-slate-700 pt-8">
    <div className="text-center space-y-6">
        <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-300">Connect With Me</h3>
            <div className="flex justify-center space-x-6">
                <a href="https://www.linkedin.com/in/ayan-pandey-b66067296/" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" aria-label="LinkedIn Profile">
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
            <button onClick={() => window.open('https://forms.gle/xcraRbXbaAyiqhpj7', '_blank')} /* Replace with your actual Google Form link */ className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
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
  );
};

export default About;