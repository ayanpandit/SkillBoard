import React, { useState, useCallback } from 'react';
import {
  Search, Loader2, X, ChevronDown, ChevronUp, User, Award, Trophy, Star,
  TrendingUp, Calendar
} from 'lucide-react';

const IS_PRODUCTION = import.meta.env.PROD;

// CodeChef backend API endpoint loaded from .env
const API_URL = IS_PRODUCTION
  ? import.meta.env.VITE_CODECHEF_API_URL_PROD
  : import.meta.env.VITE_CODECHEF_API_URL_DEV;

// --- Reusable UI Components ---

const StatCard = ({ title, value, icon, color = "text-orange-400" }) => (
  <div className="bg-slate-800 p-4 rounded-lg shadow-md flex items-center">
    {React.createElement(icon, { className: `w-8 h-8 mr-3 ${color}` })}
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-xl font-semibold text-slate-100">
        {value === undefined || value === null || value === '' ? 'N/A' : String(value)}
      </p>
    </div>
  </div>
);

const Section = ({ title, children, icon, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-6 bg-slate-800 rounded-lg shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left text-slate-100 hover:bg-slate-700/70 rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <div className="flex items-center">
          {React.createElement(icon, { className: "w-5 h-5 mr-2 text-orange-400" })}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <div className="p-4 border-t border-slate-700">{children}</div>}
    </div>
  );
};

// --- Main Component ---

function CodeChefProfileAnalyzer() {
  const [usernameInput, setUsernameInput] = useState('');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async () => {
    const username = usernameInput.trim();
    if (!username) {
      setError('Please enter a username.');
      return;
    }

    setIsLoading(true);
    setError('');
    setUserData(null);

    try {
      const response = await fetch(`${API_URL}?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (response.status === 404 || data.error) {
        setError(data.error || 'User not found.');
        setUserData(null);
      } else if (!response.ok) {
        throw new Error(data.error || `HTTP Error ${response.status}`);
      } else {
        setUserData(data);
      }
    } catch (err) {
      console.error(`Error fetching ${username}:`, err);
      setError(`Failed to fetch data. Please check the console for details.`);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, [usernameInput]);

  const UserProfileDisplay = ({ user }) => {
    if (!user) return null;

    const isErrorState = user.error && !user.rating;
    if (isErrorState) {
      return (
        <div className="text-center py-12 mt-10 max-w-4xl mx-auto bg-slate-800 rounded-xl shadow-2xl p-6">
          <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Profile</h2>
          <p className="text-slate-300">{user.error}</p>
        </div>
      );
    }
    
    return (
      <div className="mt-10 max-w-4xl mx-auto bg-slate-800 rounded-xl shadow-2xl p-6 space-y-6">
        {/* Header Section */}
        <div className="text-center border-b border-slate-700 pb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-1">{user.username}</h2>
          {user.full_name && user.full_name !== 'N/A' && (
            <p className="text-lg text-slate-400">{user.full_name}</p>
          )}
          {user.error && (
            <p className="text-sm text-yellow-400 mt-2">⚠️ Partial data: {user.error}</p>
          )}
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Rating" value={user.rating} icon={TrendingUp} color="text-orange-400" />
          <StatCard title="Stars" value={user.stars} icon={Star} color="text-yellow-400" />
          <StatCard title="Problems Solved" value={user.problems_solved} icon={Award} color="text-green-400" />
          <StatCard title="Global Rank" value={user.global_rank} icon={Trophy} color="text-purple-400" />
        </div>

        {/* Rankings Section */}
        <Section title="Rankings" icon={Trophy} defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Global Rank</p>
              <p className="text-2xl font-bold text-purple-400">
                {user.global_rank === 'N/A' ? 'N/A' : `#${user.global_rank}`}
              </p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Country Rank</p>
              <p className="text-2xl font-bold text-orange-400">
                {user.country_rank === 'N/A' ? 'N/A' : `#${user.country_rank}`}
              </p>
            </div>
          </div>
        </Section>

        {/* Contest History */}
        {user.contest_history && user.contest_history.length > 0 && (
          <Section title="Contest History" icon={Calendar} defaultOpen={false}>
            <div className="overflow-x-auto pretty-scrollbar">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-300">Contest Name</th>
                    <th className="px-4 py-2 text-left text-slate-300">Rating</th>
                    <th className="px-4 py-2 text-left text-slate-300">Rank</th>
                    <th className="px-4 py-2 text-left text-slate-300">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {user.contest_history.map((contest, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-2 text-slate-300">{contest.name}</td>
                      <td className="px-4 py-2 text-orange-400 font-semibold">{contest.rating}</td>
                      <td className="px-4 py-2 text-slate-300">{contest.rank}</td>
                      <td className="px-4 py-2 text-slate-400">{contest.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-700">
          Last updated: {user.scraped_at || 'Unknown'}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
      <style jsx global>{`
        .pretty-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .pretty-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .pretty-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        .pretty-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
      
      <header className="text-center mb-8 pt-24">
        <h1 className="text-4xl md:text-5xl font-bold text-orange-400">CodeChef Profile Analyzer</h1>
        <p className="text-slate-400 mt-2">Analyze CodeChef profiles with detailed insights</p>
      </header>

      {/* Search Section */}
      <div className="max-w-xl mx-auto mb-8 p-6 bg-slate-800 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter CodeChef Username"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !usernameInput.trim()}
            className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Search className="mr-2" size={20} />
            )}
            Search
          </button>
        </div>

        {error && !isLoading && <p className="text-red-400 mt-4 text-center text-sm">{error}</p>}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="my-6 text-center">
          <Loader2 className="animate-spin inline-block w-8 h-8 text-orange-400 mb-2" />
          <p className="text-lg">Fetching user data...</p>
        </div>
      )}

      {/* Results Display */}
      {!isLoading && userData && <UserProfileDisplay user={userData} />}

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
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
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
  );
}

export default CodeChefProfileAnalyzer;
