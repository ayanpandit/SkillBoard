import React, { useState } from 'react';
import GithubProfileAnalyzer from './GithubProfileAnalyzer';
import GithubRepoAnalyzer from './GithubRepoAnalyzer';
import { User, GitBranch } from 'lucide-react';

function GithubLoader() {
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' or 'repositories'

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
