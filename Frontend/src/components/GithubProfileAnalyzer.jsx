import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Search, Loader2, X, ChevronDown, ChevronUp, User, Star, GitFork, Code,
  Calendar, TrendingUp, Download, RotateCcw, UploadCloud, CheckCircle,
  AlertTriangle, UserCircle, MapPin, Link as LinkIcon, Mail, Twitter,
  Briefcase, BookOpen, Users, Activity, Award, ExternalLink, GitBranch,
  Eye, AlertCircle, Package, Zap
} from 'lucide-react';

// GitHub API endpoint
const API_URL = import.meta.env.VITE_GITHUB_API_URL || 'http://localhost:3003/api/github';
const API_BULK_URL = import.meta.env.VITE_GITHUB_API_BULK_URL || 'http://localhost:3003/api/github/bulk';

// Reusable UI Components
const StatCard = ({ title, value, icon, color = "text-purple-400" }) => (
  <div className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg shadow-md flex items-center border border-slate-700/50 hover:border-slate-600/70 transition-all duration-300">
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
    <div className="mb-6 bg-slate-800/40 backdrop-blur-sm rounded-lg shadow-md border border-slate-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left text-slate-100 hover:bg-slate-700/70 rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <div className="flex items-center">
          {React.createElement(icon, { className: "w-5 h-5 mr-2 text-purple-400" })}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <div className="p-4 border-t border-slate-700">{children}</div>}
    </div>
  );
};

function GithubProfileAnalyzer() {
  const location = useLocation();
  const [usernameInput, setUsernameInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [lastSearchedUsernames, setLastSearchedUsernames] = useState([]);
  const [lastSearchedFile, setLastSearchedFile] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: 'sno', direction: 'ascending' });
  const [filterUsername, setFilterUsername] = useState('');
  const [filterName, setFilterName] = useState('');

  // Handle file upload from Profile component
  useEffect(() => {
    const handleFileFromProfile = async () => {
      if (location.state?.fileUrl && location.state?.fileName) {
        const { fileUrl, fileName } = location.state;
        setLastSearchedFile(fileName);
        
        try {
          setIsLoading(true);
          setError('');
          
          // Fetch the file
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch file');
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          // Extract usernames from first column (skip header)
          const usernames = data
            .slice(1)
            .map(row => row[0])
            .filter(username => username && String(username).trim());
          
          if (usernames.length === 0) {
            setError('No valid usernames found in the uploaded file.');
            setIsLoading(false);
            return;
          }
          
          // Process the usernames
          await processUsernames(usernames);
          
        } catch (err) {
          console.error('Error processing file from profile:', err);
          setError('Failed to process the uploaded file. Please try again.');
          setIsLoading(false);
        }
        
        // Clear the location state to prevent re-processing on component re-render
        window.history.replaceState({}, document.title);
      }
    };
    
    handleFileFromProfile();
  }, [location.state]);

  // Helper to safely get nested values
  const getNestedValue = (obj, path, defaultValue = 'N/A') => {
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    // Allow 0 and false as valid values, only use default for null/undefined/empty string
    if (value === undefined || value === null || value === '') return defaultValue;
    return value;
  };

  // Fetch single user data
  const fetchSingleUserData = useCallback(async (username) => {
    try {
      const response = await axios.get(`${API_URL}/${username}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching data for ${username}:`, err);
      return { username, error: err.response?.data?.error || 'Failed to fetch data', success: false };
    }
  }, []);

  // Fetch bulk user data
  const fetchBulkUserData = async (usernames) => {
    try {
      const response = await axios.post(API_BULK_URL, { usernames });
      return response.data.results || [];
    } catch (err) {
      console.error('Error fetching bulk data:', err);
      throw err;
    }
  };

  // Process usernames (single or bulk)
  const processUsernames = async (usernamesToFetch) => {
    if (!usernamesToFetch || usernamesToFetch.length === 0) {
      setError('Please provide at least one username.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResults([]);
    setTotalToProcess(usernamesToFetch.length);
    setProcessingProgress(0);

    let results = [];

    if (usernamesToFetch.length === 1 && usernamesToFetch[0]) {
      const result = await fetchSingleUserData(usernamesToFetch[0]);
      results = [result];
      setProcessingProgress(1);
    } else {
      try {
        results = await fetchBulkUserData(usernamesToFetch);
        setProcessingProgress(usernamesToFetch.length);
      } catch (err) {
        setError('Failed to fetch bulk data. Please try again.');
      }
    }

    setSearchResults(results);
    setIsLoading(false);
  };

  // Handle single search
  const handleSingleSearch = async () => {
    const trimmedUsername = usernameInput.trim();
    if (!trimmedUsername) return;
    setLastSearchedUsernames([trimmedUsername]);
    setLastSearchedFile(null);
    await processUsernames([trimmedUsername]);
    setUsernameInput('');
  };

  // Handle bulk search (file upload)
  const handleBulkSearch = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLastSearchedFile(file);
    setLastSearchedUsernames([]);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        const usernames = jsonData
          .flat()
          .map(val => String(val).trim())
          .filter(val => val && val.toLowerCase() !== 'username');
        
        await processUsernames(usernames);
      } catch (err) {
        setError('Failed to parse file. Please ensure it\'s a valid CSV or Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = null;
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (lastSearchedFile && lastSearchedUsernames.length === 0) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          const usernames = jsonData
            .flat()
            .map(val => String(val).trim())
            .filter(val => val && val.toLowerCase() !== 'username');
          await processUsernames(usernames);
        } catch (err) {
          setError('Failed to refresh data.');
        }
      };
      reader.readAsArrayBuffer(lastSearchedFile);
    } else if (lastSearchedUsernames.length > 0) {
      await processUsernames(lastSearchedUsernames);
    }
  };

  // Contribution heatmap component
  const ContributionHeatmap = ({ contributionHeatmap }) => {
    if (!contributionHeatmap || Object.keys(contributionHeatmap).length === 0) {
      return <p className="text-slate-400 text-sm">No contribution data available.</p>;
    }

    // Get dates for the last year
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const dates = [];
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dates.push({
        date: dateStr,
        count: contributionHeatmap[dateStr] || 0
      });
    }

    const getColor = (count) => {
      if (count === 0) return 'bg-slate-700';
      if (count <= 2) return 'bg-green-900';
      if (count <= 5) return 'bg-green-700';
      if (count <= 10) return 'bg-green-500';
      return 'bg-green-400';
    };

    // Group by weeks
    const weeks = [];
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push(dates.slice(i, i + 7));
    }

    return (
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-full">
          <div className="flex gap-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`w-3 h-3 rounded-sm ${getColor(day.count)} hover:ring-2 hover:ring-purple-400 transition-all cursor-pointer`}
                    title={`${day.date}: ${day.count} contributions`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-slate-700"></div>
          <div className="w-3 h-3 rounded-sm bg-green-900"></div>
          <div className="w-3 h-3 rounded-sm bg-green-700"></div>
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400"></div>
          <span>More</span>
        </div>
      </div>
    );
  };

  // Modal content component for detailed view
  const ModalContent = ({ user }) => {
    if (!user || !user.success) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Profile</h3>
          <p className="text-slate-400">{user?.error || 'Failed to load profile data'}</p>
        </div>
      );
    }

    const profile = user.profile || {};
    const stats = user.stats || {};
    const languages = user.languages || [];
    const popularRepos = user.popularRepos || [];
    const recentRepos = user.recentRepos || [];
    const recentActivity = user.recentActivity || [];

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center space-x-4 pb-4 border-b border-slate-700">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-500">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-full h-full text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
            <p className="text-lg text-purple-400">@{user.username}</p>
            {profile.bio && (
              <p className="text-slate-300 mt-2">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-400">
              {profile.company && profile.company !== 'N/A' && (
                <div className="flex items-center gap-1">
                  <Briefcase size={14} />
                  <span>{profile.company}</span>
                </div>
              )}
              {profile.location && profile.location !== 'N/A' && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.email && profile.email !== 'N/A' && (
                <div className="flex items-center gap-1">
                  <Mail size={14} />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile.twitter && (
                <div className="flex items-center gap-1">
                  <Twitter size={14} />
                  <span>@{profile.twitter}</span>
                </div>
              )}
              {profile.blog && (
                <a href={profile.blog} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-purple-400">
                  <LinkIcon size={14} />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard title="Total Stars" value={stats.totalStars} icon={Star} color="text-yellow-400" />
          <StatCard title="Total Forks" value={stats.totalForks} icon={GitFork} color="text-blue-400" />
          <StatCard title="Public Repos" value={profile.publicRepos} icon={BookOpen} color="text-green-400" />
          <StatCard title="Followers" value={profile.followers} icon={Users} color="text-purple-400" />
          <StatCard title="Following" value={profile.following} icon={Users} color="text-cyan-400" />
          <StatCard title="Total Contributions" value={stats.totalContributions} icon={Activity} color="text-orange-400" />
          <StatCard title="Current Streak" value={`${stats.currentStreak} days`} icon={Zap} color="text-pink-400" />
          <StatCard title="Longest Streak" value={`${stats.longestStreak} days`} icon={Award} color="text-red-400" />
        </div>

        {/* Language Stats */}
        <Section title="Top Languages" icon={Code} defaultOpen={true}>
          {languages.length > 0 ? (
            <div className="space-y-3">
              {languages.map((lang, idx) => (
                <div key={idx} className="bg-slate-700/30 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-200">{lang.language}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-400">{lang.repos} repos</span>
                      <span className="text-purple-400 font-bold">{lang.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${lang.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No language data available.</p>
          )}
        </Section>

        {/* Popular Repositories */}
        <Section title="Popular Repositories" icon={Star} defaultOpen={true}>
          {popularRepos.length > 0 ? (
            <div className="space-y-3">
              {popularRepos.map((repo, idx) => (
                <div key={idx} className="bg-slate-700/30 p-4 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-2"
                    >
                      {repo.name}
                      <ExternalLink size={16} />
                    </a>
                  </div>
                  {repo.description && (
                    <p className="text-slate-300 text-sm mb-3">{repo.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>{repo.language}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star size={14} />
                      <span>{repo.stars}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork size={14} />
                      <span>{repo.forks}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{repo.watchers}</span>
                    </div>
                    {repo.openIssues > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle size={14} />
                        <span>{repo.openIssues} issues</span>
                      </div>
                    )}
                  </div>
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {repo.topics.slice(0, 5).map((topic, topicIdx) => (
                        <span
                          key={topicIdx}
                          className="bg-purple-900/30 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-700/40"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No repositories found.</p>
          )}
        </Section>

        {/* Contribution Activity */}
        <Section title="Contribution Activity" icon={Calendar} defaultOpen={true}>
          <ContributionHeatmap contributionHeatmap={user.contributionHeatmap} />
        </Section>

        {/* Recent Activity */}
        <Section title="Recent Activity" icon={Activity}>
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.slice(0, 10).map((activity, idx) => (
                <div key={idx} className="bg-slate-700/30 p-3 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="font-semibold text-purple-400">{activity.type}</span>
                    {activity.repo && (
                      <span className="text-slate-400">in <span className="text-slate-200">{activity.repo}</span></span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No recent activity.</p>
          )}
        </Section>

        {/* View Full Profile */}
        <div className="flex justify-center pt-4">
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
          >
            View Full GitHub Profile <ExternalLink className="ml-2" size={18} />
          </a>
        </div>
      </div>
    );
  };

  // Sortable header component
  const SortableHeader = ({ columnKey, title, currentSortConfig, onRequestSort }) => (
    <th scope="col" className="px-5 py-3 cursor-pointer hover:bg-slate-600/50 transition-colors select-none" onClick={() => onRequestSort(columnKey)}>
      <div className="flex items-center justify-between">
        <span>{title}</span>
        <div className="flex flex-col ml-1">
          <ChevronUp size={12} className={currentSortConfig.key === columnKey && currentSortConfig.direction === 'ascending' ? 'text-purple-400' : 'text-slate-600'} />
          <ChevronDown size={12} className={currentSortConfig.key === columnKey && currentSortConfig.direction === 'descending' ? 'text-purple-400' : 'text-slate-600'} />
        </div>
      </div>
    </th>
  );

  // Table columns configuration
  const tableColumns = useMemo(() => [
    { key: 'sno', label: 'S.No.', sortable: false },
    { key: 'username', label: 'Username', sortable: true, getValue: user => user.username?.toLowerCase() || '' },
    { key: 'name', label: 'Name', sortable: true, getValue: user => getNestedValue(user, 'name', '').toLowerCase() || getNestedValue(user, 'profile.name', '').toLowerCase() },
    { key: 'followers', label: 'Followers', sortable: true, getValue: user => getNestedValue(user, 'followers', 0) || getNestedValue(user, 'profile.followers', 0) },
    { key: 'repos', label: 'Public Repos', sortable: true, getValue: user => getNestedValue(user, 'publicRepos', 0) || getNestedValue(user, 'profile.publicRepos', 0) },
    { key: 'contributions', label: 'Total Contributions', sortable: true, getValue: user => {
      const val = getNestedValue(user, 'totalContributions', null) ?? getNestedValue(user, 'stats.totalContributions', 0);
      return val;
    } },
    { key: 'forks', label: 'Total Forks', sortable: true, getValue: user => getNestedValue(user, 'totalForks', 0) || getNestedValue(user, 'stats.totalForks', 0) },
    { key: 'language', label: 'Top Language', sortable: true, getValue: user => getNestedValue(user, 'topLanguage', 'N/A').toLowerCase() },
    { key: 'status', label: 'Status', sortable: true, getValue: user => user.success ? 1 : 0 },
  ], []);

  // Request sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Process and filter results
  const processedResults = useMemo(() => {
    let filtered = searchResults.filter(user => {
      const usernameMatch = user.username?.toLowerCase().includes(filterUsername.toLowerCase());
      const nameMatch = (getNestedValue(user, 'name', '') || getNestedValue(user, 'profile.name', '')).toLowerCase().includes(filterName.toLowerCase());
      return usernameMatch && nameMatch;
    });

    if (sortConfig.key && sortConfig.key !== 'sno') {
      const column = tableColumns.find(col => col.key === sortConfig.key);
      if (column && column.getValue) {
        filtered.sort((a, b) => {
          const aVal = column.getValue(a);
          const bVal = column.getValue(b);
          if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        });
      }
    }

    return filtered;
  }, [searchResults, sortConfig, filterUsername, filterName, tableColumns]);

  // Download table as Excel
  const handleDownloadTable = () => {
    const exportData = processedResults.map((user, index) => ({
      'S.No.': index + 1,
      'Username': user.username,
      'Name': getNestedValue(user, 'name', 'N/A') || getNestedValue(user, 'profile.name', 'N/A'),
      'Followers': getNestedValue(user, 'followers', 0) || getNestedValue(user, 'profile.followers', 0),
      'Public Repos': getNestedValue(user, 'publicRepos', 0) || getNestedValue(user, 'profile.publicRepos', 0),
      'Total Contributions': (() => {
        const val = getNestedValue(user, 'totalContributions', null) ?? getNestedValue(user, 'stats.totalContributions', null);
        return val !== null ? val : 0;
      })(),
      'Total Forks': getNestedValue(user, 'totalForks', 0) || getNestedValue(user, 'stats.totalForks', 0),
      'Top Language': getNestedValue(user, 'topLanguage', 'N/A'),
      'Profile URL': getNestedValue(user, 'profileUrl', 'N/A') || getNestedValue(user, 'profile.profileUrl', 'N/A'),
      'Status': user.success ? 'Success' : 'Error'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GitHub Profiles');
    XLSX.writeFile(wb, 'github_profiles.xlsx');
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 p-4 md:p-8 font-sans">
      <style>{`
        .pretty-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .pretty-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .pretty-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        .pretty-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
      
      <header className="text-center mb-6 pt-24">
        <h1 className="text-4xl md:text-5xl font-bold text-purple-400">GitHub Profile Analyzer</h1>
        <p className="text-slate-400 mt-2">Comprehensive GitHub profile analytics and insights</p>
      </header>

      {/* Search Section */}
      <div className="max-w-xl mx-auto mb-8 p-6 bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSingleSearch()}
              placeholder="Enter GitHub Username"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-700/50 backdrop-blur-sm text-slate-100 placeholder-slate-400 border border-slate-600/50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={handleSingleSearch}
            disabled={isLoading || !usernameInput.trim()}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {isLoading && totalToProcess === 1 ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Search className="mr-2" size={20} />
            )}
            Search
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <label
            htmlFor="bulk-upload"
            className={`cursor-pointer bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-2.5 rounded-lg inline-flex items-center justify-center transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <UploadCloud className="mr-2" size={20} /> Bulk Search (CSV/XLSX)
          </label>
          <input
            id="bulk-upload"
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleBulkSearch}
            disabled={isLoading}
            className="hidden"
          />
          <button
            onClick={handleRefresh}
            disabled={isLoading || (lastSearchedUsernames.length === 0 && !lastSearchedFile)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : <RotateCcw className="mr-2" size={20} />}
            Refresh Data
          </button>
        </div>

        {error && !isLoading && <p className="text-red-400 mt-4 text-center text-sm">{error}</p>}
      </div>

      {/* Loading Progress */}
      {isLoading && totalToProcess > 0 && (
        <div className="my-6 mx-auto max-w-2xl bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-slate-700/50">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="animate-spin w-8 h-8 text-purple-400 mr-3" />
            <h3 className="text-xl font-semibold text-slate-100">Processing Profiles...</h3>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">
                <strong className="text-purple-400">{processingProgress}</strong> completed
              </span>
              <span className="text-slate-300">
                <strong className="text-blue-400">{totalToProcess - processingProgress}</strong> remaining
              </span>
              <span className="text-slate-300">
                Total: <strong className="text-purple-400">{totalToProcess}</strong>
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-700/50 backdrop-blur-sm rounded-full h-3 overflow-hidden shadow-inner border border-slate-600/30">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ width: `${totalToProcess > 0 ? (processingProgress / totalToProcess) * 100 : 0}%` }}
            ></div>
          </div>
          
          <div className="text-center mt-2 text-lg font-semibold text-purple-400">
            {totalToProcess > 0 ? Math.round((processingProgress / totalToProcess) * 100) : 0}%
          </div>
        </div>
      )}

      {/* Results Table */}
      {searchResults.length > 0 && (
        <div className="mt-10 max-w-7xl mx-auto bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-slate-700/50">
          <div className="p-5 border-b border-slate-700/50 flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-100">
              Search Results ({processedResults.length})
              {isLoading && <span className="text-sm text-purple-400 ml-2">(Loading more...)</span>}
            </h2>
            <button
              onClick={handleDownloadTable}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm"
            >
              <Download size={18} className="mr-2" /> Download Table
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-700/50">
            <input
              type="text"
              placeholder="Filter by Username..."
              value={filterUsername}
              onChange={e => setFilterUsername(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-700/50 backdrop-blur-sm text-slate-100 placeholder-slate-400 border border-slate-600/50 focus:ring-1 focus:ring-purple-500 outline-none text-sm"
            />
            <input
              type="text"
              placeholder="Filter by Name..."
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-700/50 backdrop-blur-sm text-slate-100 placeholder-slate-400 border border-slate-600/50 focus:ring-1 focus:ring-purple-500 outline-none text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm text-left text-slate-300">
              <thead className="text-xs text-purple-300 uppercase bg-slate-700/50">
                <tr>
                  {tableColumns.map(col => (
                    col.sortable ?
                      <SortableHeader key={col.key} columnKey={col.key} title={col.label} currentSortConfig={sortConfig} onRequestSort={requestSort} />
                      : <th key={col.key} scope="col" className="px-5 py-3">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedResults.map((user, index) => (
                  <tr
                    key={user.username}
                    className="bg-slate-800/20 backdrop-blur-sm border-b border-slate-700/50 hover:bg-slate-700/40 cursor-pointer transition-colors"
                    onClick={async () => {
                      // If user data is from bulk (missing detailed info), fetch full data
                      if (!user.profile && !user.stats && user.success) {
                        setIsLoading(true);
                        const fullData = await fetchSingleUserData(user.username);
                        setIsLoading(false);
                        setSelectedUser(fullData);
                      } else {
                        setSelectedUser(user);
                      }
                    }}
                  >
                    <td className="px-5 py-4 font-medium">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center">
                        <UserCircle className="w-5 h-5 mr-2 text-purple-400" />
                        <span className="font-medium text-purple-300">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {getNestedValue(user, 'name', 'N/A') || getNestedValue(user, 'profile.name', 'N/A')}
                    </td>
                    <td className="px-5 py-4 font-semibold text-purple-400">
                      {getNestedValue(user, 'followers', 0) || getNestedValue(user, 'profile.followers', 0)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-green-400">
                      {getNestedValue(user, 'publicRepos', 0) || getNestedValue(user, 'profile.publicRepos', 0)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-orange-400">
                      {(() => {
                        const val = getNestedValue(user, 'totalContributions', null) ?? getNestedValue(user, 'stats.totalContributions', null);
                        return val !== null ? val : 'N/A';
                      })()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-blue-400">
                      {getNestedValue(user, 'totalForks', 0) || getNestedValue(user, 'stats.totalForks', 0)}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {getNestedValue(user, 'topLanguage', 'N/A')}
                    </td>
                    <td className="px-5 py-4">
                      {user.success ? (
                        <span className="flex items-center text-green-400">
                          <CheckCircle className="w-4 h-4 mr-1" /> Success
                        </span>
                      ) : (
                        <span className="flex items-center text-red-400">
                          <AlertTriangle className="w-4 h-4 mr-1" /> Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {processedResults.length === 0 && (
              <p className="p-5 text-center text-slate-400">No users match the current filters or no search performed.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal for detailed view */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-slate-800/60 backdrop-blur-md text-slate-200 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-slate-700/70 pretty-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-100 transition-colors z-[110] p-1 rounded-full hover:bg-slate-700"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
            <ModalContent user={selectedUser} />
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
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
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

export default GithubProfileAnalyzer;
