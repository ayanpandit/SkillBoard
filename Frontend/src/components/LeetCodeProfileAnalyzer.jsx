import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Search, UploadCloud, X, Loader2, UserCircle, BarChart2, CalendarDays,
  Code, Medal, Trophy, Activity, ExternalLink, ChevronDown, ChevronUp,
  Brain, Briefcase, MapPin, Star, CheckCircle, AlertTriangle,
  Download, Filter, RotateCcw
} from 'lucide-react';

const IS_PRODUCTION = import.meta.env.PROD;


// Old LeetCode backend (suspended)
// const API_URL_OLD = 'https://leetcodebackend-zjtf.onrender.com/api/leetcode';
// const API_BULK_URL_OLD = 'https://leetcodebackend-zjtf.onrender.com/api/leetcode/bulk';

// New LeetCode backend (active)
const API_URL = IS_PRODUCTION
  ? 'https://skillboard-leetcode.onrender.com/api/leetcode'
  : 'http://localhost:3000/api/leetcode';

const API_BULK_URL = IS_PRODUCTION
  ? 'https://skillboard-leetcode.onrender.com/api/leetcode/bulk'
  : 'http://localhost:3000/api/leetcode/bulk';



// StatCard, Section, getDifficultyColorText, getDifficultyColorBg components remain the same
const StatCard = ({ title, value, icon, color = "text-sky-400" }) => (
  <div className="bg-slate-800 p-4 rounded-lg shadow-md flex items-center">
    {React.createElement(icon, { className: `w-8 h-8 mr-3 ${color}` })}
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-xl font-semibold text-slate-100">{value === undefined || value === null || value === '' ? 'N/A' : String(value)}</p>
    </div>
  </div>
);

const Section = ({ title, children, icon, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-6 bg-slate-800 rounded-lg shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left text-slate-100 hover:bg-slate-700/70 rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        <div className="flex items-center">
          {React.createElement(icon, { className: "w-5 h-5 mr-2 text-sky-400" })}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <div className="p-4 border-t border-slate-700">{children}</div>}
    </div>
  );
};

const getDifficultyColorText = (difficulty) => {
  if (difficulty === 'Easy') return 'text-green-400';
  if (difficulty === 'Medium') return 'text-yellow-400';
  if (difficulty === 'Hard') return 'text-red-400';
  return 'text-slate-400';
};

const getDifficultyColorBg = (difficulty) => {
  if (difficulty === 'Easy') return 'bg-green-500';
  if (difficulty === 'Medium') return 'bg-yellow-500';
  if (difficulty === 'Hard') return 'bg-red-500';
  return 'bg-sky-500';
};

// Helper to safely get nested values
const getNestedValue = (obj, path, defaultValue = 'N/A') => {
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  return (value === undefined || value === null) ? defaultValue : value;
};

// Default empty user structure for error cases in bulk
const defaultErrorUserStructure = (username, errorMessage) => ({
  username,
  error: errorMessage,
  profile: { ranking: 'N/A', realName: 'N/A', userAvatar: null, location: 'N/A', school: 'N/A', reputation: 'N/A' },
  stats: { All: { solved: 0, total: 0, submissions: 0 }, Easy: { solved: 0, total: 0, submissions: 0 }, Medium: { solved: 0, total: 0, submissions: 0 }, Hard: { solved: 0, total: 0, submissions: 0 } },
  activity: { totalActiveDays: 0, streak: 0, activeYears: 'N/A' },
  submissions: [], languages: [], tags: [],
  badges: { username: username, earned: [], upcoming: [], summary: { totalEarned: 0, level: 'N/A', totalUpcoming: 0, totalPossible: 0, categories: {} }, error: errorMessage },
  contests: { summary: { totalAttended: 0, weeklyAttended: 0, biweeklyAttended: 0 }, history: [] },
  heatmap: { error: "Data fetch failed" }
});


function LeetCodeProfileAnalyzer({ initialFileUrl, initialFileName }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [selectedHeatmapYear, setSelectedHeatmapYear] = useState(new Date().getFullYear());
  const [lastSearchedUsernames, setLastSearchedUsernames] = useState([]);
  const [lastSearchedFile, setLastSearchedFile] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: 'sno', direction: 'ascending' });
  const [filterUsername, setFilterUsername] = useState('');
  const [filterRealName, setFilterRealName] = useState('');
  const [weeklyContestQuery, setWeeklyContestQuery] = useState('');
  
  // Process initial file URL if provided
  useEffect(() => {
    const processInitialFile = async () => {
      if (initialFileUrl && !lastSearchedFile) {
        try {
          setIsLoading(true);
          setError('');
          
          // Fetch the file content from the URL
          const response = await fetch(initialFileUrl);
          const blob = await response.blob();
          
          // Create a File object from the blob
          const fileFromBlob = new File([blob], initialFileName || 'uploaded_file.csv', { 
            type: blob.type || 'text/csv' 
          });
          
          // Set as last searched file
          setLastSearchedFile(fileFromBlob);
          
          // Process the file similar to handleBulkSearch
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const fileData = new Uint8Array(e.target.result);
              const workbook = XLSX.read(fileData, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
              const usernames = json.flat().map(name => String(name || '').trim()).filter(name => name && name.length > 0);
              
              if (usernames.length === 0) {
                setError('No valid usernames found in the file.');
                setIsLoading(false);
                return;
              }
              
              setLastSearchedUsernames(usernames);
              await processUsernames(usernames);
              
            } catch (err) {
              console.error("File processing error:", err);
              setError('Failed to process file: ' + (err.message || 'Unknown error'));
              setIsLoading(false);
            }
          };
          reader.readAsArrayBuffer(fileFromBlob);
          
        } catch (error) {
          console.error("Error processing initial file:", error);
          setError(`Error processing file: ${error.message || 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };
      processInitialFile();
  }, [initialFileUrl, initialFileName]);
  const [biweeklyContestQuery, setBiweeklyContestQuery] = useState('');
  const [contestHighlights, setContestHighlights] = useState({});

  // For fetching a single user's data
  const fetchSingleUserData = useCallback(async (username) => {
    try {
      const response = await axios.post(API_URL, { username });
      return response.data;
    } catch (err) {
      console.error(`Error fetching data for ${username}:`, err);
      const errorMessage = err.response?.data?.error || err.message || `Failed to fetch data for ${username}.`;
      return defaultErrorUserStructure(username, errorMessage);
    }
  }, []);

  // For fetching multiple users' data in bulk
  const fetchBulkUserData = async (usernames) => {
    try {
      const response = await axios.post(API_BULK_URL, { usernames });
      if (response.data && response.data.success && response.data.data) {
        // Backend returns an object: { "user1": data1, "user2": data2 }
        // Convert it to an array of user data objects
        // Ensure all usernames are present in the result, even if they errored on backend
        return usernames.map(username =>
          response.data.data[username] ||
          defaultErrorUserStructure(username, `Data for ${username} not found in bulk response.`)
        );
      } else {
        // General error for the bulk request itself
        const bulkErrorMessage = response.data?.error || 'Bulk fetch failed to return valid data structure.';
        console.error('Bulk fetch error:', bulkErrorMessage, response.data);
        return usernames.map(username => defaultErrorUserStructure(username, bulkErrorMessage));
      }
    } catch (err) {
      console.error('Error in fetchBulkUserData:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Generic bulk request error.';
      // Return an array where each user has an error, preserving the username
      return usernames.map(username => defaultErrorUserStructure(username, errorMessage));
    }
  };

  const processUsernames = async (usernamesToFetch) => {
    if (!usernamesToFetch || usernamesToFetch.length === 0) {
      setError('No usernames to process.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true); setError(''); setSearchResults([]);
    setTotalToProcess(usernamesToFetch.length);
    setProcessingProgress(0);

    let results = [];

    if (usernamesToFetch.length === 1 && usernamesToFetch[0]) {
      // Single user processing
      results.push(await fetchSingleUserData(usernamesToFetch[0]));
      setProcessingProgress(1);
    } else if (usernamesToFetch.length > 1) {
      // Bulk user processing
      results = await fetchBulkUserData(usernamesToFetch);
      // For bulk, progress jumps to total as backend handles batching
      setProcessingProgress(usernamesToFetch.length);
    }

    setSearchResults(results);
    setIsLoading(false);
    setContestHighlights({});
  };


  const handleSingleSearch = async () => {
    const trimmedUsername = usernameInput.trim();
    if (!trimmedUsername) { setError('Please enter a username.'); return; }
    setLastSearchedUsernames([trimmedUsername]);
    setLastSearchedFile(null);
    await processUsernames([trimmedUsername]);
    setUsernameInput('');
  };

  const handleBulkSearch = async (event) => {
    const file = event.target.files[0]; if (!file) return;
    setLastSearchedFile(file);
    setLastSearchedUsernames([]); // Clear single search history
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileData = new Uint8Array(e.target.result);
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const usernames = json.flat().map(name => String(name || '').trim()).filter(name => name && name.length > 0);
        if (usernames.length === 0) { setError('No valid usernames found.'); setIsLoading(false); return; }

        setLastSearchedUsernames(usernames); // Store for refresh potential
        await processUsernames(usernames);

      } catch (err) { console.error("File processing error:", err); setError('Failed to process file.'); setIsLoading(false); }
    };
    reader.readAsArrayBuffer(file); event.target.value = null;
  };

  const handleRefresh = async () => {
    if (lastSearchedFile && lastSearchedUsernames.length === 0) { // Prefer reprocessing file if it was the last action
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileData = new Uint8Array(e.target.result);
          const workbook = XLSX.read(fileData, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const usernames = json.flat().map(name => String(name || '').trim()).filter(name => name && name.length > 0);
          if (usernames.length === 0) { setError('No valid usernames found in the last file.'); setIsLoading(false); return; }
          setLastSearchedUsernames(usernames); // Update last searched usernames from file
          await processUsernames(usernames);
        } catch (err) { console.error("File processing error during refresh:", err); setError('Failed to re-process file.'); setIsLoading(false); }
      };
      reader.readAsArrayBuffer(lastSearchedFile);
    } else if (lastSearchedUsernames.length > 0) {
      await processUsernames(lastSearchedUsernames); // This will correctly use single or bulk
    } else {
      setError("No previous search to refresh. Please perform a search first.");
    }
  };

  const HeatmapGrid = ({ heatmapData, year }) => {
    if (!heatmapData || heatmapData.error) {
      return <p className="text-slate-400 text-sm">{heatmapData?.error || "No heatmap data available."}</p>;
    }
    // Handle cases where heatmapData might be an empty object if user has no submissions
    // but no explicit error from backend
    if (typeof heatmapData === 'object' && Object.keys(heatmapData).length === 0 && !heatmapData.note && !heatmapData.error) {
      return <p className="text-slate-400 text-sm">No submission activity recorded for {year}.</p>;
    }
    if (heatmapData.note) {
      return <p className="text-slate-400 text-sm">{heatmapData.note}</p>;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
    const firstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

    const submissionsByDate = {};
    // Ensure heatmapData is an object before trying to iterate
    if (typeof heatmapData === 'object' && heatmapData !== null && !Array.isArray(heatmapData)) {
      Object.entries(heatmapData).forEach(([timestamp, count]) => {
        if (timestamp === "error" || timestamp === "note") return; // Skip special keys
        const date = new Date(parseInt(timestamp) * 1000);
        if (date.getFullYear() === year) {
          const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          submissionsByDate[dateString] = count;
        }
      });
    }


    const getIntensityColor = (count) => {
      if (count === 0) return 'bg-slate-700';
      if (count <= 2) return 'bg-green-700';
      if (count <= 5) return 'bg-green-600';
      if (count <= 10) return 'bg-green-500';
      return 'bg-green-400';
    };

    const currentDate = new Date();
    const currentCalYear = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth();

    return (
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-7 gap-px text-center mb-1 text-slate-400">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        {monthNames.map((monthName, monthIndex) => {
          if (year === currentCalYear && monthIndex > currentMonthIndex) {
            return null; // Don't render future months for the current year
          }
          return (
            <div key={monthIndex} className="mb-3">
              <div className="text-sm font-semibold text-sky-300 mb-1.5">{monthName} {year}</div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth(monthIndex, year) }).map((_, i) => (
                  <div key={`empty-start-${monthIndex}-${i}`} className="w-full aspect-square"></div>
                ))}
                {Array.from({ length: daysInMonth(monthIndex, year) }).map((_, dayIndex) => {
                  const day = dayIndex + 1;
                  const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const count = submissionsByDate[dateString] || 0;
                  const color = getIntensityColor(count);
                  return (
                    <div
                      key={`${monthIndex}-${day}`}
                      className={`w-full aspect-square rounded-sm flex items-center justify-center ${color} transition-colors hover:ring-2 hover:ring-sky-400`}
                      title={`${monthName} ${day}, ${year}: ${count} submission${count !== 1 ? 's' : ''}`}
                    >
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ModalContent = ({ user }) => {
    if (!user) return null;
    const u = user;
    const isFullError = u.error && (!u.profile || getNestedValue(u, 'profile.realName') === 'N/A' && (getNestedValue(u, 'stats.All.solved', 0) === 0));

    if (isFullError) {
      return (
        <div className="text-center p-6 sm:p-8 lg:p-12">
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-2xl p-6 sm:p-8 border border-red-700/30">
            <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-red-300 mb-3">Error Fetching Data</h2>
            <p className="text-slate-200 text-base sm:text-lg lg:text-xl font-medium">{u.username}</p>
            <p className="text-slate-300 mt-3 text-sm sm:text-base max-w-md mx-auto">{u.error}</p>
          </div>
        </div>
      );
    }

    // Calculate contest counts for display
    const totalAttendedFromData = getNestedValue(u, 'contests.summary.totalAttended', 0);
    const biweeklyAttendedFromData = getNestedValue(u, 'contests.summary.biweeklyAttended', 0);

    // Ensure results are numbers. getNestedValue with 0 default helps.
    const displayTotalAttended = typeof totalAttendedFromData === 'number' ? totalAttendedFromData : 0;
    const displayBiweeklyAttended = typeof biweeklyAttendedFromData === 'number' ? biweeklyAttendedFromData : 0;

    // Calculate weekly attended as per request: total - biweekly
    // Prevent negative results if data is inconsistent (e.g. biweekly > total)
    // Or, if the backend already provides weeklyAttended, prefer that.
    const providedWeeklyAttended = getNestedValue(u, 'contests.summary.weeklyAttended', null);
    const displayCalculatedWeeklyAttended = providedWeeklyAttended !== null && typeof providedWeeklyAttended === 'number'
      ? providedWeeklyAttended
      : Math.max(0, displayTotalAttended - displayBiweeklyAttended);


    const formatLocation = (locationStr) => {
      if (!locationStr || locationStr === 'N/A') return 'N/A';
      const parts = locationStr.split('%').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length === 0) return 'N/A';
      if (parts.length === 3) return `${parts[2]}, ${parts[1]}, ${parts[0]}`;
      if (parts.length === 2) return `${parts[1]}, ${parts[0]}`;
      return parts.join(', ');
    };

    const solvedEMH = (getNestedValue(u, 'stats.Easy.solved', 0)) +
      (getNestedValue(u, 'stats.Medium.solved', 0)) +
      (getNestedValue(u, 'stats.Hard.solved', 0));

    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-600/30">
          <div className="flex flex-col sm:flex-row items-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-600/40">
            <div className="relative mb-4 sm:mb-0 sm:mr-6 flex-shrink-0">
              {u.profile.userAvatar ? (
                <div className="relative">
                  <img
                    src={u.profile.userAvatar}
                    alt={u.username}
                    className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-3 border-sky-400 shadow-lg shadow-sky-400/20"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-800"></div>
                </div>
              ) : (
                <div className="relative">
                  <UserCircle className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-slate-400 bg-slate-700 rounded-full p-2" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-600 rounded-full border-2 border-slate-800"></div>
                </div>
              )}
            </div>

            <div className="text-center sm:text-left flex-grow min-w-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent break-all mb-2">
                {u.username}
              </h2>
              {getNestedValue(u, 'profile.realName') !== 'N/A' && (
                <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-3 font-medium">
                  {getNestedValue(u, 'profile.realName')}
                </p>
              )}
              <a
                href={`https://leetcode.com/${u.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm sm:text-base text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200 bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-700/30 hover:border-blue-600/50"
              >
                View LeetCode Profile
                <ExternalLink size={16} className="ml-2 flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* Enhanced Error Warning (Partial Data) */}
        {u.error && !isFullError && (getNestedValue(u, 'profile.realName') !== 'N/A' || getNestedValue(u, 'stats.All.solved', 0) > 0) && (
          <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border border-yellow-700/40 rounded-xl p-4 sm:p-5 text-yellow-300">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Partial Data Warning</p>
                <p className="text-sm text-yellow-200/80">
                  Some information might be incomplete or unavailable. <span className="italic">{u.error}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/10 rounded-xl p-4 sm:p-5 lg:p-6 border border-yellow-700/30 hover:border-yellow-600/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-yellow-200/60 mb-1 uppercase tracking-wider">Ranking</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-100 group-hover:text-yellow-300 transition-colors">
                  #{getNestedValue(u, 'profile.ranking')}
                </p>
              </div>
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 rounded-xl p-4 sm:p-5 lg:p-6 border border-amber-700/30 hover:border-amber-600/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-amber-200/60 mb-1 uppercase tracking-wider">Reputation</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-100 group-hover:text-amber-300 transition-colors">
                  {getNestedValue(u, 'profile.reputation')}
                </p>
              </div>
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:text-amber-300 transition-colors" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 rounded-xl p-4 sm:p-5 lg:p-6 border border-green-700/30 hover:border-green-600/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-green-200/60 mb-1 uppercase tracking-wider">Problems Solved</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-100 group-hover:text-green-300 transition-colors">
                  {solvedEMH} / {getNestedValue(u, 'stats.All.total', 'N/A')}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 group-hover:text-green-300 transition-colors" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-violet-900/10 rounded-xl p-4 sm:p-5 lg:p-6 border border-purple-700/30 hover:border-purple-600/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-purple-200/60 mb-1 uppercase tracking-wider">Contests</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-100 group-hover:text-purple-300 transition-colors">
                  {displayTotalAttended}
                </p>
              </div>
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/20 to-red-900/10 rounded-xl p-4 sm:p-5 lg:p-6 border border-orange-700/30 hover:border-orange-600/50 transition-all duration-300 group sm:col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-orange-200/60 mb-1 uppercase tracking-wider">Current Streak</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-100 group-hover:text-orange-300 transition-colors">
                  {getNestedValue(u, 'activity.streak', 0)} days
                </p>
              </div>
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 group-hover:text-orange-300 transition-colors" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-900/20 to-cyan-900/10 rounded-xl p-4 sm:p-5 lg:p-6 border border-teal-700/30 hover:border-teal-600/50 transition-all duration-300 group sm:col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-teal-200/60 mb-1 uppercase tracking-wider">Active Days</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-teal-100 group-hover:text-teal-300 transition-colors">
                  {getNestedValue(u, 'activity.totalActiveDays', 0)}
                </p>
              </div>
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 group-hover:text-teal-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Enhanced Profile Details Section */}
        <Section title="Profile Details" icon={UserCircle} defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-600/20">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center mr-3">
                  📍
                </div>
                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Location</h4>
              </div>
              <p className="text-slate-100 font-medium">{formatLocation(getNestedValue(u, 'profile.location'))}</p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-600/20">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center mr-3">
                  🎓
                </div>
                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Education</h4>
              </div>
              <p className="text-slate-100 font-medium">{getNestedValue(u, 'profile.school', 'N/A')}</p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-600/20 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center mr-3">
                  📅
                </div>
                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Active Years</h4>
              </div>
              <p className="text-slate-100 font-medium">{getNestedValue(u, 'activity.activeYears', 'N/A')}</p>
            </div>
          </div>
        </Section>

        {/* Enhanced Problem Solving Stats */}
        <Section title="Problem Solving Stats" icon={BarChart2} defaultOpen={true}>
          {u.stats?.error && ( // Check u.stats itself first
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700/40 rounded-lg">
              <p className="text-red-300 text-sm">Stats incomplete: {u.stats.error}</p>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {['Easy', 'Medium', 'Hard'].map(diff => {
              const stat = u.stats ? u.stats[diff] : null; // Check u.stats
              // If stat is null or not an object (could be an error string if u.stats itself is an error obj)
              if (!stat || typeof stat !== 'object' || typeof getNestedValue(stat, 'solved', null) !== 'number') {
                // Optionally render a placeholder or skip if vital stats are missing
                if (!u.stats?.error) { // Only show this if no general stats error is displayed
                  return (
                    <div key={diff} className="bg-slate-800/30 rounded-xl p-4 sm:p-5 lg:p-6 border border-slate-600/20 opacity-60">
                      <h4 className={`text-lg sm:text-xl font-bold ${getDifficultyColorText(diff)} mb-2`}>{diff}</h4>
                      <p className="text-slate-400 text-sm">Data not available for this difficulty.</p>
                    </div>
                  );
                }
                return null;
              }

              const solved = getNestedValue(stat, 'solved', 0);
              const total = getNestedValue(stat, 'total', 0);
              const submissions = getNestedValue(stat, 'submissions', 0);
              const percentage = total > 0 ? (solved / total) * 100 : 0;

              return (
                <div key={diff} className="bg-slate-800/30 rounded-xl p-4 sm:p-5 lg:p-6 border border-slate-600/20 hover:border-slate-500/40 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getDifficultyColorBg(diff)}`}></div>
                      <h4 className={`text-lg sm:text-xl font-bold ${getDifficultyColorText(diff)}`}>{diff}</h4>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                      <span className="text-slate-300 font-medium">
                        <span className="text-slate-100 font-bold text-base">{solved}</span> / {total || 'N/A'}
                      </span>
                      <span className="text-slate-400">
                        {submissions} submissions
                      </span>
                      <span className={`font-semibold ${getDifficultyColorText(diff)}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="w-full bg-slate-700/50 rounded-full h-3 sm:h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getDifficultyColorBg(diff)} transition-all duration-1000 ease-out shadow-lg`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"></div>
                  </div>
                </div>
              );
            })}
          </div>
          {Object.keys(u.stats || {}).length <= 1 && !u.stats?.error && ( // Only 'All' or empty and no specific error
            <div className="text-center py-8">
              <BarChart2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Problem solving statistics are not available.</p>
            </div>
          )}
        </Section>

        {/* Enhanced Badges Section */}
        <Section title="Badges" icon={Medal}>
          {u.badges?.error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700/40 rounded-lg">
              <p className="text-red-300 text-sm">Badge Info: {u.badges.error}</p>
            </div>
          )}

          {u.badges && !u.badges.error && u.badges.summary && ( // Ensure summary exists
            <div className="space-y-6">
              {/* Badge Summary */}
              <div className="bg-slate-800/30 rounded-xl p-4 sm:p-6 border border-slate-600/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-lg border border-purple-700/30">
                    <p className="text-2xl sm:text-3xl font-bold text-purple-300">{getNestedValue(u, 'badges.summary.level', 'N/A')}</p>
                    <p className="text-xs text-purple-200/70 uppercase tracking-wider">Achievement Level</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-lg border border-green-700/30">
                    <p className="text-2xl sm:text-3xl font-bold text-green-300">{getNestedValue(u, 'badges.summary.totalEarned', 0)}</p>
                    <p className="text-xs text-green-200/70 uppercase tracking-wider">Earned</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-lg border border-blue-700/30">
                    <p className="text-2xl sm:text-3xl font-bold text-blue-300">{getNestedValue(u, 'badges.summary.totalUpcoming', 0)}</p>
                    <p className="text-xs text-blue-200/70 uppercase tracking-wider">Upcoming</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-slate-900/20 to-slate-800/10 rounded-lg border border-slate-700/30">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-300">{getNestedValue(u, 'badges.summary.totalPossible', 0)}</p>
                    <p className="text-xs text-slate-200/70 uppercase tracking-wider">Total Possible</p>
                  </div>
                </div>

                {u.badges.summary?.categories && Object.keys(u.badges.summary.categories).length > 0 && (
                  <div className="border-t border-slate-600/30 pt-4">
                    <h4 className="font-semibold text-slate-200 mb-3">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(u.badges.summary.categories).map(([cat, count]) => (
                        <span key={cat} className="bg-sky-900/30 text-sky-200 text-sm px-3 py-1.5 rounded-full border border-sky-700/40">
                          {cat}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Earned Badges */}
              {u.badges.earned?.length > 0 && (
                <div>
                  <h4 className="font-bold text-xl text-slate-100 mb-4 flex items-center">
                    <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                    Earned Badges ({u.badges.earned.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {u.badges.earned.map(b => (
                      <div
                        key={b.id || b.name}
                        className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 p-3 sm:p-4 rounded-xl text-center hover:from-slate-700/60 hover:to-slate-600/40 transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50 hover:shadow-lg hover:shadow-slate-900/20 group aspect-square flex flex-col items-center justify-center"
                        title={`${b.name}\nDesc: ${b.description}\nEarned: ${b.creationDate}\nCat: ${b.category || 'Gen'}\nStatus: ${b.status}`}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 mb-2 flex items-center justify-center">
                          {b.icon ? (
                            <img
                              src={b.icon}
                              alt={b.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                              style={{ backgroundColor: b.iconGifBackground || 'transparent' }}
                            />
                          ) : (
                            <Medal className="w-full h-full text-slate-400 group-hover:text-slate-300 transition-colors" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-tight text-center line-clamp-2 group-hover:text-slate-200 transition-colors">
                          {b.name}
                        </p>
                        {b.creationDate && b.creationDate !== 'N/A' && (
                          <p className="text-[10px] sm:text-xs text-sky-400 mt-1 opacity-80">{b.creationDate}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Badges */}
              {u.badges.upcoming?.length > 0 && (
                <div>
                  <h4 className="font-bold text-xl text-slate-100 mb-4 flex items-center">
                    <div className="w-5 h-5 border-2 border-slate-400 border-dashed rounded mr-2"></div>
                    Upcoming Badges ({u.badges.upcoming.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {u.badges.upcoming.map((b, i) => (
                      <div
                        key={b.name + '-' + i}
                        className="bg-gradient-to-br from-slate-800/40 to-slate-700/30 p-3 sm:p-4 rounded-xl text-center opacity-60 hover:opacity-80 transition-all duration-300 border border-slate-600/20 hover:border-slate-500/40 aspect-square flex flex-col items-center justify-center"
                        title={`${b.name}\nProgress: ${b.progress}\nStatus: ${b.status}`}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 mb-2 flex items-center justify-center">
                          {b.icon ? (
                            <img
                              src={b.icon}
                              alt={b.name}
                              className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                              style={{ backgroundColor: b.iconGifBackground || 'transparent' }}
                            />
                          ) : (
                            <Medal className="w-full h-full text-slate-500" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium leading-tight text-center line-clamp-2">
                          {b.name}
                        </p>
                        {b.progress && b.progress !== 'N/A' && (
                          <p className="text-[10px] sm:text-xs text-sky-500 mt-1">{b.progress}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!u.badges.earned || u.badges.earned.length === 0) && (!u.badges.upcoming || u.badges.upcoming.length === 0) && (
                <div className="text-center py-8">
                  <Medal className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No badges found.</p>
                </div>
              )}
            </div>
          )}

          {(!u.badges || u.badges.error || !u.badges.summary) && ( // Catch if badges object is missing or summary missing
            <div className="text-center py-8">
              <Medal className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Badge information unavailable. {u.badges?.error || ''}</p>
            </div>
          )}
        </Section>



        {/* Enhanced Recent Submissions */}
        <Section title="Recent Submissions" icon={Code}>
          {u.submissions?.length > 0 ? (
            <div className="space-y-3">
              {u.submissions.map((s, i) => (
                <div
                  key={`${s.titleSlug}-${s.timestamp}-${i}`}
                  className="bg-gradient-to-r from-slate-800/40 to-slate-700/30 p-4 sm:p-5 rounded-xl hover:from-slate-700/40 hover:to-slate-600/30 transition-all duration-300 border border-slate-600/20 hover:border-slate-500/40 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <a
                        href={`https://leetcode.com/problems/${s.titleSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-sky-400 hover:text-sky-300 hover:underline text-base sm:text-lg transition-colors duration-200 block truncate group-hover:text-sky-300"
                      >
                        {s.title}
                      </a>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <span className={`font-bold px-2 py-1 rounded-full text-xs ${s.status === 'Accepted'
                            ? 'bg-green-900/30 text-green-300 border border-green-700/40'
                            : 'bg-red-900/30 text-red-300 border border-red-700/40'
                          }`}>
                          {s.status}
                        </span>
                        <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full text-xs border border-purple-700/40">
                          {s.language}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {s.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Code className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No recent submissions.</p>
            </div>
          )}
        </Section>

        {/* Enhanced Language Proficiency */}
        <Section title="Language Proficiency" icon={Brain}>
          {u.languages?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {u.languages
                .sort((a, b) => getNestedValue(b, 'solved', 0) - getNestedValue(a, 'solved', 0))
                .map(l => (
                  <div
                    key={l.name}
                    className="bg-gradient-to-br from-slate-800/40 to-slate-700/30 p-4 rounded-xl border border-slate-600/20 hover:border-slate-500/40 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-200 group-hover:text-slate-100 transition-colors truncate">
                          {l.name}
                        </h4>
                        <p className="text-slate-400 text-sm mt-1">
                          <span className="font-bold text-slate-300">{getNestedValue(l, 'solved', 0)}</span> problems solved
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                        <span className="text-lg">💻</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No language statistics available.</p>
            </div>
          )}
        </Section>

        {/* Enhanced Topics/Tags */}
        <Section title="Topics / Tags (Most Solved)" icon={Briefcase}>
          {u.tags?.length > 0 ? (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {u.tags.map(t => (
                <span
                  key={t.slug || t.name}
                  className="bg-gradient-to-r from-sky-900/40 to-blue-900/30 text-sky-200 text-xs sm:text-sm px-3 py-2 rounded-full hover:from-sky-800/50 hover:to-blue-800/40 transition-all duration-300 border border-sky-700/40 hover:border-sky-600/60 cursor-default"
                >
                  {t.name} <span className="font-bold">({getNestedValue(t, 'solved', 0)})</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No topic statistics available.</p>
            </div>
          )}
        </Section>
        {/* Enhanced Heatmap Section */}
        <Section title={`Submission Activity (${selectedHeatmapYear})`} icon={CalendarDays} defaultOpen={true}>
          <div className="bg-slate-800/30 rounded-xl p-4 sm:p-6 border border-slate-600/20">
            <HeatmapGrid heatmapData={u.heatmap} year={selectedHeatmapYear} />
          </div>
        </Section>

        {/* Enhanced Contest History */}
        <Section title="Contest History" icon={Trophy}>
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-4 border border-purple-700/30 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-purple-300">
                  {displayTotalAttended}
                </p>
                <p className="text-xs text-purple-200/70 uppercase tracking-wider mt-1">Total Contests</p>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-xl p-4 border border-blue-700/30 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-blue-300">
                  {displayCalculatedWeeklyAttended}
                </p>
                <p className="text-xs text-blue-200/70 uppercase tracking-wider mt-1">Weekly</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 rounded-xl p-4 border border-cyan-700/30 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-cyan-300">
                  {displayBiweeklyAttended}
                </p>
                <p className="text-xs text-cyan-200/70 uppercase tracking-wider mt-1">Biweekly</p>
              </div>
            </div>
          </div>

          {u.contests?.history?.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 pretty-scrollbar">
              {u.contests.history.map((c, i) => (
                <div
                  key={`${c.title}-${c.startTime}-${i}`}
                  className="bg-gradient-to-r from-slate-800/40 to-slate-700/30 p-4 sm:p-5 rounded-xl hover:from-slate-700/40 hover:to-slate-600/30 transition-all duration-300 border border-slate-600/20 hover:border-slate-500/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-200 text-base sm:text-lg mb-2 truncate">
                        {c.title}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">Rank:</span>
                          <span className="font-bold text-slate-200">#{c.rank}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">Solved:</span>
                          <span className="font-bold text-green-400">{c.solved}/{c.total}</span>
                        </div>
                        <div className="flex items-center space-x-2 col-span-2 sm:col-span-1">
                          <span className="text-slate-400">Date:</span>
                          <span className="text-slate-300 text-xs">{c.startTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No contest history available.</p>
            </div>
          )}
        </Section>
      </div>

    );
  };
  const SortableHeader = ({ columnKey, title, currentSortConfig, onRequestSort }) => {
    const isSorted = currentSortConfig.key === columnKey;
    const direction = isSorted ? currentSortConfig.direction : null;
    return (
      <th scope="col" className="px-5 py-3 cursor-pointer hover:bg-slate-600/50 transition-colors" onClick={() => onRequestSort(columnKey)}>
        <div className="flex items-center">
          {title}
          {isSorted && (direction === 'ascending' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />)}
        </div>
      </th>
    );
  };

  const tableColumns = useMemo(() => [
    { key: 'sno', label: 'S.No.', sortable: false },
    { key: 'username', label: 'Username', sortable: true, getValue: user => user.username?.toLowerCase() || '' },
    { key: 'realName', label: 'Real Name', sortable: true, getValue: user => getNestedValue(user, 'profile.realName', 'z').toLowerCase() },
    { key: 'ranking', label: 'Ranking', sortable: true, getValue: user => getNestedValue(user, 'profile.ranking', Infinity) === 'N/A' ? Infinity : parseInt(String(getNestedValue(user, 'profile.ranking', Infinity)).replace(/,/g, '')) },
    { key: 'problemsSolved', label: 'Problems Solved', sortable: true, getValue: user => (getNestedValue(user, 'stats.Easy.solved', 0)) + (getNestedValue(user, 'stats.Medium.solved', 0)) + (getNestedValue(user, 'stats.Hard.solved', 0)) },
    { key: 'easy', label: 'Easy', sortable: true, getValue: user => getNestedValue(user, 'stats.Easy.solved', 0) },
    { key: 'medium', label: 'Medium', sortable: true, getValue: user => getNestedValue(user, 'stats.Medium.solved', 0) },
    { key: 'hard', label: 'Hard', sortable: true, getValue: user => getNestedValue(user, 'stats.Hard.solved', 0) },
    { key: 'badgesEarned', label: 'Badges Earned', sortable: true, getValue: user => getNestedValue(user, 'badges.summary.totalEarned', 0) },
    { key: 'activeDays', label: 'Active Days', sortable: true, getValue: user => getNestedValue(user, 'activity.totalActiveDays', 0) },
    { key: 'contests', label: 'Contests', sortable: true, getValue: user => getNestedValue(user, 'contests.summary.totalAttended', 0) },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      getValue: user => {
        const isFullError = user.error && (!user.profile || getNestedValue(user, 'profile.realName') === 'N/A' && (getNestedValue(user, 'stats.All.solved', 0) === 0));
        if (isFullError) return 0; // Full Error - sort first or last depending on direction
        if (user.error) return 1;   // Partial Error
        return 2;                   // OK
      }
    },
  ], []);


  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const processedResults = useMemo(() => {
    let filtered = [...searchResults];

    if (filterUsername) {
      filtered = filtered.filter(user => user.username?.toLowerCase().includes(filterUsername.toLowerCase()));
    }
    if (filterRealName) {
      filtered = filtered.filter(user => getNestedValue(user, 'profile.realName', '').toLowerCase().includes(filterRealName.toLowerCase()));
    }

    const sortableColumn = tableColumns.find(col => col.key === sortConfig.key);
    if (sortableColumn && sortableColumn.sortable) {
      filtered.sort((a, b) => {
        const valA = sortableColumn.getValue(a);
        const valB = sortableColumn.getValue(b);

        // Handle N/A, Infinity, or placeholder 'z' for strings to sort them consistently
        const isASpecial = valA === Infinity || valA === -1 || (typeof valA === 'string' && valA === 'z');
        const isBSpecial = valB === Infinity || valB === -1 || (typeof valB === 'string' && valB === 'z');

        // Specific handling for status sorting: OK > Partial > Error
        if (sortConfig.key === 'status') {
          if (sortConfig.direction === 'ascending') { // Error (0) < Partial (1) < OK (2)
            return valA - valB;
          } else { // OK (2) > Partial (1) > Error (0)
            return valB - valA;
          }
        }


        if (isASpecial && isBSpecial) return 0;
        if (isASpecial) return sortConfig.direction === 'ascending' ? 1 : -1; // Push special values to end when ascending
        if (isBSpecial) return sortConfig.direction === 'ascending' ? -1 : 1; // Push special values to end when ascending

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [searchResults, sortConfig, filterUsername, filterRealName, tableColumns]);

  const createExportableRowData = (user, index) => {
    const solvedEMH = (getNestedValue(user, 'stats.Easy.solved', 0)) +
      (getNestedValue(user, 'stats.Medium.solved', 0)) +
      (getNestedValue(user, 'stats.Hard.solved', 0));

    let statusText = "OK";
    const isFullError = user.error && (!user.profile || getNestedValue(user, 'profile.realName') === 'N/A' && (getNestedValue(user, 'stats.All.solved', 0) === 0));
    if (isFullError) statusText = "Error";
    else if (user.error) statusText = "Partial";

    return {
      'S.No.': index + 1,
      'Username': user.username,
      'Real Name': getNestedValue(user, 'profile.realName'),
      'Ranking': getNestedValue(user, 'profile.ranking'),
      'Problems Solved': solvedEMH,
      'Badges Earned': getNestedValue(user, 'badges.summary.totalEarned', 0),
      'Active Days': getNestedValue(user, 'activity.totalActiveDays', 0),
      'Contests': getNestedValue(user, 'contests.summary.totalAttended', 0),
      'Status': statusText,
      'Error Details': user.error || ''
    };
  };

  const handleDownloadTable = () => {
    const dataToExport = processedResults.map(createExportableRowData);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LeetCode_Stats");
    XLSX.writeFile(workbook, "LeetCode_User_Stats.xlsx");
  };

  const handleApplyContestHighlights = () => {
    const newHighlights = {};
    const weeklyNum = weeklyContestQuery.trim();
    const biweeklyNum = biweeklyContestQuery.trim();

    searchResults.forEach(user => {
      if (!user || !user.username) return; // Skip if user or username is undefined
      const userHighlightsEntry = {};

      if (weeklyNum) {
        const contestTitle = `Weekly Contest ${weeklyNum}`;
        const participated = user.contests?.history?.some(c => c.title === contestTitle);
        userHighlightsEntry.weekly = participated ? 'green' : 'red';
      }

      if (biweeklyNum) {
        const contestTitle = `Biweekly Contest ${biweeklyNum}`;
        const participated = user.contests?.history?.some(c => c.title === contestTitle);
        userHighlightsEntry.biweekly = participated ? 'green' : 'red';
      }

      if (Object.keys(userHighlightsEntry).length > 0) {
        newHighlights[user.username] = userHighlightsEntry;
      }
    });
    setContestHighlights(newHighlights);
    setError('');
  };


  const handleDownloadNonParticipants = (contestType) => {
    const contestNum = contestType === 'weekly' ? weeklyContestQuery.trim() : biweeklyContestQuery.trim();
    if (!contestNum) {
      setError(`Please enter a ${contestType} contest number and apply highlights first.`);
      return;
    }
    if (Object.keys(contestHighlights).length === 0 && (weeklyContestQuery.trim() || biweeklyContestQuery.trim())) {
      setError(`Please click "Apply Contest Highlights" first after entering contest numbers.`);
      return;
    }

    const nonParticipantsUsers = processedResults.filter(user => {
      if (!user || !user.username) return false; // Skip if user or username is undefined
      const highlightStatus = contestHighlights[user.username];
      return highlightStatus && highlightStatus[contestType] === 'red';

    });

    if (nonParticipantsUsers.length === 0) {
      setError(`No non-participants found for ${contestType} contest ${contestNum} based on current highlights and filters.`);
      return;
    }

    const dataToExport = nonParticipantsUsers.map(createExportableRowData);

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Non-Participants ${contestType}`);
    XLSX.writeFile(workbook, `non_participants_${contestType}_contest_${contestNum}.xlsx`);
    setError('');
  };

  useEffect(() => {
    const handleInitialFile = async () => {
      if (initialFileUrl && initialFileName && !lastSearchedFile) {
        try {
          const response = await fetch(initialFileUrl);
          const blob = await response.blob();
          const file = new File([blob], initialFileName, { type: blob.type });
          
          // Create a fake event object with the file
          const fakeEvent = {
            target: {
              files: [file]
            }
          };
          
          handleBulkSearch(fakeEvent);
        } catch (error) {
          console.error('Error handling initial file:', error);
          setError('Error loading the file. Please try uploading manually.');
        }
      }
    };

    handleInitialFile();
  }, [initialFileUrl, initialFileName]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
      <style jsx global>{`.pretty-scrollbar::-webkit-scrollbar {width:6px;height:6px;} .pretty-scrollbar::-webkit-scrollbar-track {background:transparent;} .pretty-scrollbar::-webkit-scrollbar-thumb {background:#475569;border-radius:10px;} .pretty-scrollbar::-webkit-scrollbar-thumb:hover {background:#334155;}`}</style>      <header className="text-center mb-8 pt-24">
        <h1 className="text-4xl md:text-5xl font-bold text-sky-400">LeetCode Profile Analyzer</h1>
      </header>
      <div className="max-w-xl mx-auto mb-8 p-6 bg-slate-800 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-grow">
            <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSingleSearch()} placeholder="Enter LeetCode Username" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={handleSingleSearch} disabled={isLoading || !usernameInput.trim()} className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800">
            {isLoading && totalToProcess === 1 && lastSearchedUsernames.length === 1 && lastSearchedUsernames[0] === usernameInput.trim() ? <Loader2 className="animate-spin mr-2" size={20} /> : <Search className="mr-2" size={20} />}Search
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <label htmlFor="bulk-upload" className={`cursor-pointer bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-2.5 rounded-lg inline-flex items-center justify-center transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <UploadCloud className="mr-2" size={20} /> Bulk Search (CSV/XLSX)
          </label>
          <input id="bulk-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleBulkSearch} disabled={isLoading} className="hidden" />
          <button onClick={handleRefresh} disabled={isLoading || (lastSearchedUsernames.length === 0 && !lastSearchedFile)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 w-full sm:w-auto">
            {isLoading && (totalToProcess > 0 && (lastSearchedUsernames.length > 0 || lastSearchedFile)) ? <Loader2 className="animate-spin mr-2" size={20} /> : <RotateCcw className="mr-2" size={20} />}Refresh Data
          </button>
        </div>
        {error && <p className="text-red-400 mt-4 text-center text-sm">{error}</p>}
      </div>

      {isLoading && totalToProcess > 0 && (
        <div className="my-6 text-center">
          <Loader2 className="animate-spin inline-block w-8 h-8 text-sky-400 mb-2" />
          <p className="text-lg">
            {totalToProcess > 1 ? `Processing ${totalToProcess} users... (This may take a moment)` : `Processing ${processingProgress} of ${totalToProcess} users...`}
          </p>
          <div className="w-full max-w-md mx-auto bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
            <div className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${totalToProcess > 0 ? (processingProgress / totalToProcess) * 100 : 0}%` }}></div>
          </div>
        </div>
      )}

      {searchResults.length > 0 && !isLoading && (
        <div className="mt-10 max-w-7xl mx-auto bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-700 flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-100">Search Results ({processedResults.length})</h2>
            <button onClick={handleDownloadTable} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm">
              <Download size={18} className="mr-2" /> Download Table
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-700">
            <input type="text" placeholder="Filter by Username..." value={filterUsername} onChange={e => setFilterUsername(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm" />
            <input type="text" placeholder="Filter by Real Name..." value={filterRealName} onChange={e => setFilterRealName(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm" />
            <input type="text" placeholder="Weekly Contest No." value={weeklyContestQuery} onChange={e => setWeeklyContestQuery(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm" />
            <input type="text" placeholder="Biweekly Contest No." value={biweeklyContestQuery} onChange={e => setBiweeklyContestQuery(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm" />
          </div>
          <div className="p-4 flex flex-wrap gap-3 border-b border-slate-700">
            <button onClick={handleApplyContestHighlights} disabled={!weeklyContestQuery.trim() && !biweeklyContestQuery.trim()} className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Filter size={18} className="mr-2" /> Apply Contest Highlights
            </button>
            <button onClick={() => handleDownloadNonParticipants('weekly')} disabled={!weeklyContestQuery.trim()} className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Download size={18} className="mr-2" /> Export Non-Participants (Weekly)
            </button>
            <button onClick={() => handleDownloadNonParticipants('biweekly')} disabled={!biweeklyContestQuery.trim()} className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Download size={18} className="mr-2" /> Export Non-Participants (Biweekly)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm text-left text-slate-300"> {/* Adjusted min-width */}
              <thead className="text-xs text-sky-300 uppercase bg-slate-700/50">
                <tr>
                  {tableColumns.map(col => (
                    col.sortable ?
                      <SortableHeader key={col.key} columnKey={col.key} title={col.label} currentSortConfig={sortConfig} onRequestSort={requestSort} />
                      : <th key={col.key} scope="col" className="px-5 py-3">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedResults.map((user, index) => {
                  if (!user || !user.username) { // Defensive check for malformed user objects
                    console.warn("Skipping rendering of malformed user object:", user);
                    return ( // Render a placeholder row or null
                      <tr key={`malformed-user-${index}`} className="border-b border-slate-700 bg-red-900/50">
                        <td colSpan={tableColumns.length} className="px-5 py-4 text-center text-red-300">
                          Malformed user data at index {index}. User: {JSON.stringify(user)}
                        </td>
                      </tr>
                    );
                  }
                  const userHighlight = contestHighlights[user.username] || {};
                  let contestRowClass = '';

                  const weeklyQueryActive = weeklyContestQuery.trim() !== '';
                  const biweeklyQueryActive = biweeklyContestQuery.trim() !== '';

                  let rowIsRed = false;
                  let rowIsGreen = false;

                  if (weeklyQueryActive && userHighlight.weekly === 'red') rowIsRed = true;
                  if (biweeklyQueryActive && userHighlight.biweekly === 'red') rowIsRed = true;

                  if (!rowIsRed) {
                    if (weeklyQueryActive && userHighlight.weekly === 'green') rowIsGreen = true;
                    if (biweeklyQueryActive && userHighlight.biweekly === 'green') rowIsGreen = true;
                  }

                  if (rowIsRed) {
                    contestRowClass = 'bg-red-800/30 hover:bg-red-700/40';
                  } else if (rowIsGreen) {
                    contestRowClass = 'bg-green-800/30 hover:bg-green-700/40';
                  }

                  const isFullError = user.error && (!user.profile || getNestedValue(user, 'profile.realName') === 'N/A' && (getNestedValue(user, 'stats.All.solved', 0) === 0));
                  const baseErrorClass = isFullError ? 'bg-red-900/30 hover:bg-red-800/40'
                    : user.error ? 'bg-yellow-900/20 hover:bg-yellow-800/30' : '';

                  const solvedEMH = (getNestedValue(user, 'stats.Easy.solved', 0)) +
                    (getNestedValue(user, 'stats.Medium.solved', 0)) +
                    (getNestedValue(user, 'stats.Hard.solved', 0));

                  return (
                    <tr
                      key={user.username + index} // Make key more unique if usernames can repeat from different sources
                      onClick={() => { setSelectedUser(user); setSelectedHeatmapYear(new Date().getFullYear()); }}
                      className={`border-b border-slate-700 cursor-pointer transition-colors ${contestRowClass || baseErrorClass || 'hover:bg-slate-700/70'}`}
                    >                      <td className="px-5 py-4">{index + 1}</td>
                      <td className="px-5 py-4 font-medium text-sky-400 break-all">{user.username}</td>
                      <td className="px-5 py-4">{getNestedValue(user, 'profile.realName')}</td>
                      <td className="px-5 py-4">{getNestedValue(user, 'profile.ranking')}</td>
                      <td className="px-5 py-4">{solvedEMH}</td>
                      <td className="px-5 py-4">{getNestedValue(user, 'stats.Easy.solved', 0)}</td>
                      <td className="px-5 py-4">{getNestedValue(user, 'stats.Medium.solved', 0)}</td>
                      <td className="px-5 py-4">{getNestedValue(user, 'stats.Hard.solved', 0)}</td>
                      <td className="px-5 py-4">{getNestedValue(user, 'badges.summary.totalEarned', 0)}</td>
                      <td className="px-5 py-4">{getNestedValue(user, 'activity.totalActiveDays', 0)}</td>
                      <td className="px-5 py-4">{getNestedValue(user, 'contests.summary.totalAttended', 0)}</td>
                      <td className="px-5 py-4">
                        {isFullError
                          ? (<span className="text-red-400 flex items-center"><AlertTriangle size={14} className="mr-1.5" /> Error</span>)
                          : user.error
                            ? (<span className="text-yellow-400 flex items-center"><AlertTriangle size={14} className="mr-1.5" /> Partial</span>)
                            : (<span className="text-green-400 flex items-center"><CheckCircle size={14} className="mr-1.5" /> OK</span>)
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {processedResults.length === 0 && <p className="p-5 text-center text-slate-400">No users match the current filters or no search performed.</p>}
          </div>
        </div>
      )}

      {selectedUser && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null); }}>
        <div className="bg-slate-850 text-slate-200 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-slate-700 pretty-scrollbar" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setSelectedUser(null)} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-100 transition-colors z-[110] p-1 rounded-full hover:bg-slate-700" aria-label="Close modal"><X size={24} /></button>
          <ModalContent user={selectedUser} />
        </div>
      </div>)}      <footer id="contact-section" className="mt-12 border-t border-slate-700 pt-8">
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
    </div>);
}
export default LeetCodeProfileAnalyzer;