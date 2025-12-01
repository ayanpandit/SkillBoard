import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Search, UploadCloud, X, Loader2, UserCircle, BarChart2, CalendarDays,
  Code, Medal, Trophy, Activity, ExternalLink, ChevronDown, ChevronUp,
  Brain, Briefcase, MapPin, Star, CheckCircle, AlertTriangle,
  Download, Filter, RotateCcw
} from 'lucide-react';

// CodeForces API endpoints - now using local backend server
const API_URL = import.meta.env.VITE_CODEFORCES_API_URL || 'http://localhost:3002/api/codeforces';
const API_BULK_URL = import.meta.env.VITE_CODEFORCES_API_BULK_URL || 'http://localhost:3002/api/codeforces/bulk';

const CodeForcesProfileAnalyzer = ({ initialFileUrl, initialFileName }) => {
  // State management
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
  const [filterRealName, setFilterRealName] = useState('');

  // Helper to safely get nested values
  const getNestedValue = (obj, path, defaultValue = 'N/A') => {
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    return (value === undefined || value === null) ? defaultValue : value;
  };

  // Fetch single user data
  const fetchSingleUserData = useCallback(async (username) => {
    try {
      const response = await axios.get(`${API_URL}/${username}`);
      return { username, ...response.data };
    } catch (err) {
      console.error(`Error fetching data for ${username}:`, err);
      return { username, error: err.response?.data?.error || 'Failed to fetch data' };
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

  // Handle initial file upload from Profile page
  useEffect(() => {
    const processInitialFile = async () => {
      if (initialFileUrl && !lastSearchedFile) {
        try {
          const response = await fetch(initialFileUrl);
          const blob = await response.blob();
          const fileFromBlob = new File([blob], initialFileName || 'uploaded_file.csv', {
            type: blob.type
          });
          setLastSearchedFile(fileFromBlob);
          
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
              setError('Failed to parse the uploaded file. Please ensure it\'s a valid CSV or Excel file.');
            }
          };
          reader.readAsArrayBuffer(fileFromBlob);
        } catch (err) {
          setError('Failed to load the uploaded file.');
        }
      }
    };
    
    processInitialFile();
  }, [initialFileUrl, initialFileName]);

  // Sortable header component
  const SortableHeader = ({ columnKey, title, currentSortConfig, onRequestSort }) => (
    <th scope="col" className="px-5 py-3 cursor-pointer hover:bg-slate-600/50 transition-colors select-none" onClick={() => onRequestSort(columnKey)}>
      <div className="flex items-center justify-between">
        <span>{title}</span>
        <div className="flex flex-col ml-1">
          <ChevronUp size={12} className={currentSortConfig.key === columnKey && currentSortConfig.direction === 'ascending' ? 'text-sky-400' : 'text-slate-600'} />
          <ChevronDown size={12} className={currentSortConfig.key === columnKey && currentSortConfig.direction === 'descending' ? 'text-sky-400' : 'text-slate-600'} />
        </div>
      </div>
    </th>
  );

  // Table columns configuration
  const tableColumns = useMemo(() => [
    { key: 'sno', label: 'S.No.', sortable: false },
    { key: 'username', label: 'Username', sortable: true, getValue: user => user.username?.toLowerCase() || '' },
    { key: 'name', label: 'Name', sortable: true, getValue: user => `${getNestedValue(user, 'firstName', '')} ${getNestedValue(user, 'lastName', '')}`.trim().toLowerCase() || 'z' },
    { key: 'rank', label: 'Rank', sortable: true, getValue: user => getNestedValue(user, 'rank', 'Unrated') },
    { key: 'rating', label: 'Rating', sortable: true, getValue: user => getNestedValue(user, 'rating', 0) },
    { key: 'maxRating', label: 'Max Rating', sortable: true, getValue: user => getNestedValue(user, 'maxRating', 0) },
    { key: 'problemsSolved', label: 'Problems Solved', sortable: true, getValue: user => getNestedValue(user, 'problemsSolved', 0) },
    { key: 'contestsParticipated', label: 'Contests', sortable: true, getValue: user => getNestedValue(user, 'contestsParticipated', 0) },
    { key: 'status', label: 'Status', sortable: true, getValue: user => user.error ? 0 : 1 },
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
      const realNameMatch = getNestedValue(user, 'firstName', '').toLowerCase().includes(filterRealName.toLowerCase()) ||
                           getNestedValue(user, 'lastName', '').toLowerCase().includes(filterRealName.toLowerCase());
      return usernameMatch && realNameMatch;
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
  }, [searchResults, sortConfig, filterUsername, filterRealName, tableColumns]);

  // Download table as Excel
  const handleDownloadTable = () => {
    const exportData = processedResults.map((user, index) => ({
      'S.No.': index + 1,
      'Username': user.username,
      'Rank': getNestedValue(user, 'rank', 'Unranked'),
      'Rating': getNestedValue(user, 'rating', 0),
      'Max Rating': getNestedValue(user, 'maxRating', 0),
      'Problems Solved': getNestedValue(user, 'problemsSolved', 0),
      'Contests': getNestedValue(user, 'contestsParticipated', 0),
      'Status': user.error ? 'Error' : 'Success'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Codeforces Data');
    XLSX.writeFile(wb, 'codeforces_profiles.xlsx');
  };

  // Get rank color
  const getRankColor = (rank) => {
    if (!rank || rank === 'Unranked') return 'text-slate-400';
    const rankLower = rank.toLowerCase();
    if (rankLower.includes('legendary')) return 'text-red-500';
    if (rankLower.includes('grandmaster')) return 'text-red-400';
    if (rankLower.includes('master')) return 'text-orange-400';
    if (rankLower.includes('candidate master')) return 'text-purple-400';
    if (rankLower.includes('expert')) return 'text-blue-400';
    if (rankLower.includes('specialist')) return 'text-cyan-400';
    if (rankLower.includes('pupil')) return 'text-green-400';
    if (rankLower.includes('newbie')) return 'text-gray-400';
    return 'text-slate-400';
  };

  // Modal content component
  const ModalContent = ({ user }) => {
    if (!user) return null;

    if (user.error) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Profile</h3>
          <p className="text-slate-400">{user.error}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 pb-4 border-b border-slate-700">
          <UserCircle className="w-16 h-16 text-sky-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">{user.username}</h2>
            {(user.firstName || user.lastName) && (
              <p className="text-slate-400">{user.firstName} {user.lastName}</p>
            )}
            <p className={`text-lg font-semibold ${getRankColor(user.rank)}`}>
              {user.rank || 'Unranked'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">Current Rating</p>
            <p className="text-2xl font-bold text-sky-400">{user.rating || 0}</p>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">Max Rating</p>
            <p className="text-2xl font-bold text-purple-400">{user.maxRating || 0}</p>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">Problems Solved</p>
            <p className="text-2xl font-bold text-green-400">{user.problemsSolved || 0}</p>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">Contests</p>
            <p className="text-2xl font-bold text-orange-400">{user.contestsParticipated || 0}</p>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">Contribution</p>
            <p className="text-2xl font-bold text-yellow-400">{user.contribution || 0}</p>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">Friends</p>
            <p className="text-2xl font-bold text-pink-400">{user.friendOfCount || 0}</p>
          </div>
        </div>

        {user.organization && (
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400 mb-1">Organization</p>
            <p className="text-lg text-white">{user.organization}</p>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <a
            href={`https://codeforces.com/profile/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors"
          >
            View Full Profile <ExternalLink className="ml-2" size={18} />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black text-slate-300 min-h-screen pb-12">
      <div className="container mx-auto px-4 py-8 mt-40">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Codeforces Profile Analyzer</h2>
          <p className="text-slate-400 mt-2">
            Analyze Codeforces profiles for competitive programming insights
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-xl mx-auto mb-8 p-6 bg-slate-800 rounded-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-grow">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSingleSearch()}
                placeholder="Enter Codeforces Username"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={handleSingleSearch}
              disabled={isLoading || !usernameInput.trim()}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              {isLoading && totalToProcess === 1 ? <Loader2 className="animate-spin mr-2" size={20} /> : <Search className="mr-2" size={20} />}
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

          {error && <p className="text-red-400 mt-4 text-center text-sm">{error}</p>}
        </div>

        {/* Loading Progress */}
        {isLoading && totalToProcess > 0 && (
          <div className="my-6 text-center">
            <Loader2 className="animate-spin inline-block w-8 h-8 text-sky-400 mb-2" />
            <p className="text-lg">
              {totalToProcess > 1 ? `Processing ${totalToProcess} users... (This may take a moment)` : `Processing ${processingProgress} of ${totalToProcess} users...`}
            </p>
            <div className="w-full max-w-md mx-auto bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
              <div
                className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-linear"
                style={{ width: `${totalToProcess > 0 ? (processingProgress / totalToProcess) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {searchResults.length > 0 && !isLoading && (
          <div className="mt-10 max-w-7xl mx-auto bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex flex-wrap gap-4 items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-100">Search Results ({processedResults.length})</h2>
              <button
                onClick={handleDownloadTable}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm"
              >
                <Download size={18} className="mr-2" /> Download Table
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-700">
              <input
                type="text"
                placeholder="Filter by Username..."
                value={filterUsername}
                onChange={e => setFilterUsername(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Filter by Real Name..."
                value={filterRealName}
                onChange={e => setFilterRealName(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm text-left text-slate-300">
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
                  {processedResults.map((user, index) => (
                    <tr
                      key={user.username}
                      className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-5 py-4 font-medium">{index + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center">
                          <UserCircle className="w-5 h-5 mr-2 text-sky-400" />
                          <span className="font-medium text-sky-300">{user.username}</span>
                        </div>
                      </td>
                      <td className={`px-5 py-4 font-semibold ${getRankColor(user.rank)}`}>
                        {getNestedValue(user, 'rank', 'Unranked')}
                      </td>
                      <td className="px-5 py-4 font-semibold text-sky-400">
                        {getNestedValue(user, 'rating', 0)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-purple-400">
                        {getNestedValue(user, 'maxRating', 0)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-green-400">
                        {getNestedValue(user, 'problemsSolved', 0)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-orange-400">
                        {getNestedValue(user, 'contestsParticipated', 0)}
                      </td>
                      <td className="px-5 py-4">
                        {user.error ? (
                          <span className="flex items-center text-red-400">
                            <AlertTriangle className="w-4 h-4 mr-1" /> Error
                          </span>
                        ) : (
                          <span className="flex items-center text-green-400">
                            <CheckCircle className="w-4 h-4 mr-1" /> Success
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
              className="bg-slate-850 text-slate-200 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-slate-700"
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
        
      </div>
      <footer id="contact-section" className="mt-12 border-t border-slate-700 pt-8">
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

export default CodeForcesProfileAnalyzer;
