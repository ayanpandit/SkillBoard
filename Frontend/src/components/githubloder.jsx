import React, { useState, useEffect } from 'react';
import GithubProfileAnalyzer from './GithubProfileAnalyzer';
import GithubRepoAnalyzer from './GithubRepoAnalyzer';
import { User, GitBranch } from 'lucide-react';

// Pulsating Loader Component
const PulsatingLoader = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-400 text-xs font-semibold">
        GitHub
      </div>
    </div>
    <p className="mt-6 text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 animate-pulse">
      {text}
    </p>
  </div>
);

function GithubLoader() {
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' or 'repositories'
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Start fade out animation
      setFadeOut(true);
      
      // After fade out completes, show analyzer
      setTimeout(() => {
        setShowLoader(false);
      }, 500); // 0.5s for fade out animation
      
    }, 1500); // 1.5-second loader

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  // Show loader first, then content
  if (showLoader) {
    return (
      <div className={`min-h-screen bg-black text-slate-300 flex flex-col justify-center items-center transition-all duration-500 ${
        fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <PulsatingLoader text="Initializing GitHub Analyzer..." />
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      {/* Tab Switcher */}
      <div className="relative pt-32 pb-6 flex justify-center">
        <div className="bg-slate-800/90 backdrop-blur-md rounded-full p-1 border border-slate-700 shadow-xl inline-flex">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'profiles'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <User size={18} />
            <span className="font-semibold">User Profiles</span>
          </button>
          <button
            onClick={() => setActiveTab('repositories')}
            className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'repositories'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <GitBranch size={18} />
            <span className="font-semibold">Repositories</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'profiles' ? (
          <GithubProfileAnalyzer />
        ) : (
          <GithubRepoAnalyzer />
        )}
      </div>
    </div>
  );
}

export default GithubLoader;
