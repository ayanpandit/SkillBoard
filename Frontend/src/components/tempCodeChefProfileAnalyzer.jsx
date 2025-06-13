// src/components/CodeChefProfileAnalyzer.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

import {
    MagnifyingGlassIcon, ArrowUpTrayIcon, UsersIcon, UserIcon, TableCellsIcon,
    ArrowDownTrayIcon, ExclamationCircleIcon, CheckCircleIcon, XMarkIcon, ArrowPathIcon,
    FunnelIcon, ChevronUpIcon, ChevronDownIcon, InformationCircleIcon, StarIcon as HeroStarIcon,
    TagIcon,
} from '@heroicons/react/24/outline';

// API_CONFIG for the hosted Render backend
const API_CONFIG = {
    host: 'codechefprofileanalyzerbackendnode.onrender.com',
    protocol: 'https',
    port: '', // Standard HTTPS port (443) is implied and usually not specified in the URL.
              // Setting it to empty string ensures it's not appended by your logic.
};

// API_BASE_URL will now correctly construct the Render URL
const API_BASE_URL = `${API_CONFIG.protocol}://${API_CONFIG.host}${API_CONFIG.port ? `:${API_CONFIG.port}` : ''}`;

// Debounce function 
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

// Heatmap components
const SimpleHeatmapCell = memo(({ date, value, maxValue }) => {
    const intensity = maxValue > 0 ? Math.min(1, value / maxValue) : 0;
    let bgColor = 'bg-slate-600';
    if (value > 0) {
        if (intensity > 0.66) bgColor = 'bg-green-700';
        else if (intensity > 0.33) bgColor = 'bg-green-500';
        else bgColor = 'bg-green-400';
    }
    return (
        <div
            className={`w-3 h-3 ${bgColor} rounded-sm`}
            title={`${date}: ${value} submissions`}
        />
    );
});

const HeatmapDisplay = memo(({ heatMapData }) => {
    if (!heatMapData || heatMapData.length === 0) {
        return <p className="text-slate-500 text-sm">No heatmap data available.</p>;
    }
    const sortedHeatMapData = [...heatMapData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxValue = Math.max(...sortedHeatMapData.map(d => d.value), 0);

    const dataByYearMonth = sortedHeatMapData.reduce((acc, curr) => {
        const date = new Date(curr.date);
        const year = date.getUTCFullYear();
        const month = date.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
        const yearMonth = `${month} ${year}`;
        if (!acc[yearMonth]) acc[yearMonth] = [];
        acc[yearMonth].push(curr);
        return acc;
    }, {});

    return (
        <div>
            <h3 className="text-md font-semibold mb-2 mt-3">Activity Heatmap</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 bg-slate-700/30 p-2 rounded-md">
                {Object.keys(dataByYearMonth).length > 0 ? (
                    Object.entries(dataByYearMonth).map(([yearMonth, monthData]) => (
                        <div key={yearMonth}>
                            <h4 className="text-xs font-medium text-slate-400 mb-1.5">{yearMonth}</h4>
                            <div className="flex flex-wrap gap-0.5">
                                {monthData.map((item) => (
                                    <SimpleHeatmapCell
                                        key={item.date}
                                        date={item.date}
                                        value={item.value}
                                        maxValue={maxValue}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500 text-sm">No heatmap data available.</p>
                )}
            </div>
        </div>
    );
});

const CodeChefProfileAnalyzer = ({ initialFileUrl, initialFileName }) => {
    // State variables
    const [singleUsername, setSingleUsername] = useState('');
    const [allResults, setAllResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [usernameSearch, setUsernameSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [filters, setFilters] = useState({
        searchQuery: '',
        minRating: '',
        maxRating: '',
        minProblems: '',
        maxProblems: '',
        onlyCheat: false,
        statusFilter: 'all',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [modalContent, setModalContent] = useState(null);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [contextMenuTarget, setContextMenuTarget] = useState(null);
    const [specificContestSearch, setSpecificContestSearch] = useState('');
    
    // Refs
    const notificationTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const contextMenuRef = useRef(null);

    // Helper functions
    const showNotification = useCallback((message, type = 'error', duration = 5000) => {
        setNotification({ message, type });
        
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        
        notificationTimeoutRef.current = setTimeout(() => {
            setNotification({ message: '', type: '' });
        }, duration);
    }, []);

    const getStarBadge = useCallback((starsStrInput) => {
        const starsStr = String(starsStrInput); // Ensure it's a string
        if (!starsStr || starsStr === 'N/A' || starsStr === 'undefined') return <span className="text-gray-400">N/A</span>;

        const firstChar = starsStr.charAt(0);
        const starCount = parseInt(firstChar, 10);

        if (isNaN(starCount)) return <span className="text-gray-400">N/A</span>; // If first char is not a number

        let colorClass = 'text-yellow-400'; // Default for 5+ stars or if not matched
        if (starCount === 1) colorClass = 'text-gray-400';
        else if (starCount === 2) colorClass = 'text-green-400';
        else if (starCount === 3) colorClass = 'text-blue-400';
        else if (starCount === 4) colorClass = 'text-purple-400';

        return (
            <span className={`inline-flex items-center ${colorClass} font-semibold`}>
                {firstChar} <HeroStarIcon className="h-4 w-4 ml-1" />
            </span>
        );
    }, []);

    // API request functions
    const fetchData = useCallback(async (url, options = {}) => {
        setLoading(true);
        try {
            const response = await fetch(url, options);
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                let errorData = { message: `HTTP error! status: ${response.status}` };
                if (contentType && contentType.includes("application/json")) {
                    const jsonError = await response.json();
                    errorData.message = jsonError.error || jsonError.message || errorData.message;
                } else {
                    const textError = await response.text();
                    errorData.message = `${errorData.message}. Response: ${textError.substring(0, 200)}...`;
                }
                throw new Error(errorData.message);
            }
            if (!contentType || !contentType.includes("application/json")) {
                const textResponse = await response.text();
                throw new Error(`Server returned non-JSON response for an OK status: ${textResponse.substring(0, 100)}...`);
            }
            return await response.json();
        } catch (error) {
            console.error("Fetch error:", error);
            showNotification(`Error: ${error.message}`, 'error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const searchSingleUser = useCallback(async () => {
        if (!singleUsername.trim()) {
            showNotification('Please enter a username.', 'error');
            return;
        }

        const results = await fetchData(`${API_BASE_URL}/fetch-profiles?username=${encodeURIComponent(singleUsername.trim())}`);
        
        if (results) {
            if (Array.isArray(results) && results.length === 1) {
                const resultsArray = results;
                setAllResults(resultsArray);

                if (resultsArray[0].status === 'success') {
                    showNotification(`Profile for ${resultsArray[0].username} fetched successfully.`, 'success');
                } else {
                    showNotification(resultsArray[0].message || `Could not fetch profile for ${resultsArray[0].username}.`, 'error');
                }
            } else {
                showNotification('Received malformed data for single user.', 'error');
                setAllResults([]);
            }
        } else {
            setAllResults([]);
        }
    }, [singleUsername, fetchData, showNotification]);

    const processBulkUpload = useCallback(async () => {
        if (!file) {
            showNotification('Please select a CSV/Excel file.', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);

        const results = await fetchData(`${API_BASE_URL}/fetch-profiles`, {
            method: 'POST',
            body: formData,
        });

        if (results && Array.isArray(results)) {
            const validDataResults = results.filter(r => r && r.username);
            setAllResults(validDataResults);
            const successCount = validDataResults.filter(r => r.status === 'success').length;
            const errorCount = validDataResults.length - successCount; // Simpler count
            showNotification(`${successCount} profiles fetched successfully, ${errorCount} failed or not found.`, 'success', 7000);
        } else if (results === null) {
            setAllResults([]);
        } else {
            showNotification('Received malformed data structure for bulk users or no data.', 'error');
            setAllResults([]);
        }
    }, [file, fetchData, showNotification]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        } else {
            setFile(null);
            setFileName('');
        }
    };

    // Data processing and calculation functions
    const getNestedValue = useCallback((obj, path) => {
        if (!obj || !path) return null;
        if (path === 'cheatCount') return calculateCheatCount(obj.data);

        const keys = path.split('.');
        let current = obj; // `obj` here is the full result item (e.g., { username: 'u', status: 'success', data: { ... } })
        for (const key of keys) {
            if (key === 'data' && current.status === 'success') { // Enter data object only if status is success
                current = current.data;
                if (typeof current !== 'object' || current === null) return (path.includes('Rating') || path.includes('contestsGiven') || path.includes('Rank')) ? 0 : 'N/A';
            } else if (current === null || current === undefined || typeof current !== 'object') {
                return (path.includes('Rating') || path.includes('contestsGiven') || path.includes('Rank')) ? 0 : 'N/A';
            } else {
                current = current[key];
            }
        }
        return current !== undefined && current !== null ? current : (path.includes('Rating') || path.includes('contestsGiven') || path.includes('Rank')) ? 0 : 'N/A';
    }, []);

    const calculateCheatCount = useCallback((profileData) => {
        if (!profileData || !profileData.contests || !Array.isArray(profileData.contests)) return 0;
        
        let cheatCount = 0;
        for (const contest of profileData.contests) {
            if (contest.rating && contest.rating.includes("cheating")) {
                cheatCount++;
            }
        }
        return cheatCount;
    }, []);

    const checkContestParticipation = useCallback((profileData, contestCode) => {
        if (!profileData || !profileData.contests || !Array.isArray(profileData.contests) || !contestCode) return false;
        
        const normalizedContestCode = contestCode.toLowerCase().trim();
        return profileData.contests.some(contest => 
            contest.code && contest.code.toLowerCase().includes(normalizedContestCode)
        );
    }, []);

    // Process initial file URL if provided
    useEffect(() => {
        const processInitialFile = async () => {
            if (initialFileUrl && !file) {
                try {
                    setLoading(true);
                    showNotification(`Processing file: ${initialFileName || 'uploaded file'}...`, 'info');
                    
                    // Fetch the file content from the URL
                    const response = await fetch(initialFileUrl);
                    const blob = await response.blob();
                    
                    // Create a File object from the blob
                    const fileFromBlob = new File([blob], initialFileName || 'uploaded_file.csv', { 
                        type: blob.type || 'text/csv' 
                    });
                    
                    // Set the file and filename
                    setFile(fileFromBlob);
                    setFileName(initialFileName || 'uploaded_file.csv');
                    
                    // Process the file for bulk upload
                    const formData = new FormData();
                    formData.append('file', fileFromBlob);
                    
                    const results = await fetchData(`${API_BASE_URL}/fetch-profiles`, {
                        method: 'POST',
                        body: formData,
                    });
                    
                    if (results && Array.isArray(results)) {
                        const validDataResults = results.filter(r => r && r.username);
                        setAllResults(validDataResults);
                        const successCount = validDataResults.filter(r => r.status === 'success').length;
                        const errorCount = validDataResults.length - successCount;
                        showNotification(`${successCount} profiles fetched successfully, ${errorCount} failed or not found.`, 'success', 7000);
                    } else {
                        showNotification('Received malformed data structure or no data from the file.', 'error');
                        setAllResults([]);
                    }
                } catch (error) {
                    console.error("Error processing initial file:", error);
                    showNotification(`Error processing file: ${error.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        };
        
        processInitialFile();
    }, [initialFileUrl, initialFileName, fetchData, showNotification]);

    const applyFiltersAndSort = useCallback(() => {
        // Filter by username if usernameSearch is provided
        let tempResults = [...allResults];
        
        if (usernameSearch) {
            const searchLower = usernameSearch.toLowerCase();
            tempResults = tempResults.filter(result => 
                result.username && result.username.toLowerCase().includes(searchLower)
            );
        }
        
        // Apply sortConfig if available
        if (sortConfig.key) {
            tempResults.sort((a, b) => {
                const aValue = getNestedValue(a, sortConfig.key);
                const bValue = getNestedValue(b, sortConfig.key);
                
                if (aValue === bValue) return 0;
                
                const modifier = sortConfig.direction === 'ascending' ? 1 : -1;
                
                // Handle numeric values
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    return (Number(aValue) - Number(bValue)) * modifier;
                }
                
                // Handle string values
                if (aValue < bValue) return -1 * modifier;
                if (aValue > bValue) return 1 * modifier;
                return 0;
            });
        }
        setFilteredResults(tempResults);
    }, [allResults, usernameSearch, sortConfig, getNestedValue]);

    const requestSort = useCallback((key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    useEffect(() => {
        const debouncedFilterSort = debounce(() => applyFiltersAndSort(), 300);
        debouncedFilterSort();
        return () => clearTimeout(debouncedFilterSort); // Correct cleanup
    }, [allResults, usernameSearch, sortConfig, applyFiltersAndSort]); // applyFiltersAndSort is a dep

    // Export functions
    const exportToCSV = useCallback((dataToExport, filename) => {
        if (!dataToExport || dataToExport.length === 0) {
            showNotification('No data to export.', 'error');
            return;
        }
        // ***** RESTORED HEADERS AND DATA EXPORT *****
        const headers = [
            'Username', 'Status', 'Message/Full Name', 'Rating', 'Stars',
            'Contests Attended', 'Cheat Incidents', 'Max Rating', 'Global Rank', 'Country Rank'
        ];
        const csvRows = [
            headers.join(','),
            ...dataToExport.map(row => {
                if (!row || !row.username) return '';
                if (row.status === 'error') {
                    return [
                        `"${row.username}"`, `"${row.status}"`, `"${String(row.message || 'N/A').replace(/"/g, '""')}"`,
                        'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'
                    ].join(',');
                }
                // Assuming status is 'success' and row.data exists
                const name = String(row.data.name || 'N/A').replace(/"/g, '""');
                const cheatCount = calculateCheatCount(row.data);
                return [
                    `"${row.username}"`, `"${row.status}"`, `"${name}"`,
                    row.data.currentRating ?? 'N/A', `"${row.data.stars || 'N/A'}"`,
                    row.data.contestsGiven ?? 0, cheatCount,
                    row.data.highestRating ?? 'N/A', `"${row.data.globalRank || 'N/A'}"`,
                    `"${row.data.countryRank || 'N/A'}"`
                ].join(',');
            })
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename || 'codechef_profiles.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [showNotification, calculateCheatCount]);

    const exportUsernamesToCSV = useCallback((usersToExport, contestCode, didParticipate = true) => {
        if (!usersToExport || usersToExport.length === 0) {
            showNotification('No data to export.', 'error');
            return;
        }
        
        // Filter users based on contest participation
        const filteredUsers = usersToExport.filter(user => 
            user.status === 'success' && 
            checkContestParticipation(user.data, contestCode) === didParticipate
        );
        
        if (filteredUsers.length === 0) {
            showNotification(`No users ${didParticipate ? 'participated in' : 'missing from'} contest ${contestCode}.`, 'error');
            return;
        }
        
        // Create CSV with just usernames
        const csvContent = filteredUsers.map(user => user.username).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${contestCode}_${didParticipate ? 'participants' : 'missing'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Exported ${filteredUsers.length} usernames of users who ${didParticipate ? 'participated in' : 'did not participate in'} contest ${contestCode}.`, 'success');
    }, [showNotification, checkContestParticipation]);

    // Close context menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setShowContextMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-slate-900 min-h-screen text-slate-300 p-4 pb-20">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 border-b border-slate-700 pb-4">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                        <img src="https://play-lh.googleusercontent.com/QLQzL-MXtxKEDlvlpnGGJEwuEVbUmKtxifFJquPXKTmztVifgh2_1vNLQmYrslXYjQ=w240-h480-rw" alt="CodeChef Logo" className="w-10 h-10 mr-3" />
                        CodeChef Profile Analyzer
                    </h1>
                    <p className="text-slate-400">Search and analyze CodeChef profiles individually or in bulk.</p>
                </header>

                {notification.message && (
                    <div className={`fixed top-5 right-5 ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white p-3 rounded-md shadow-lg z-[100] flex items-center max-w-md`}>
                        {notification.type === 'error' ? 
                            <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" /> : 
                            <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                        }
                        <span className="flex-grow break-words">{notification.message}</span>
                        <button onClick={() => setNotification({message: '', type: ''})} className={`ml-3 p-1 rounded-full ${notification.type === 'error' ? 'hover:bg-red-700' : 'hover:bg-green-700'}`}>
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <section className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-2 flex items-center"><UserIcon className="h-5 w-5 mr-1 text-indigo-400" />Single Search</h2>
                            <div className="flex">
                                <input 
                                    type="text" 
                                    value={singleUsername}
                                    onChange={e => setSingleUsername(e.target.value)}
                                    placeholder="CodeChef username"
                                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onKeyDown={e => e.key === 'Enter' && searchSingleUser()}
                                />
                                <button 
                                    onClick={searchSingleUser}
                                    disabled={loading}
                                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-r-md disabled:opacity-50 flex items-center whitespace-nowrap"
                                >
                                    <MagnifyingGlassIcon className="h-5 w-5 sm:mr-1" />
                                    <span className="hidden sm:inline">Search</span>
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-lg font-semibold mb-2 flex items-center"><UsersIcon className="h-5 w-5 mr-1 text-teal-400" />Bulk Upload</h2>
                            <div className="flex">
                                <input 
                                    type="file"
                                    id="fileUpload"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                />
                                <div onClick={() => fileInputRef.current.click()} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-l-md cursor-pointer overflow-hidden whitespace-nowrap overflow-ellipsis text-slate-400">
                                    {fileName || "Choose CSV/Excel file"}
                                </div>
                                <button onClick={processBulkUpload} disabled={loading || !file} className="w-full p-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-md disabled:opacity-50 flex items-center justify-center whitespace-nowrap"><ArrowUpTrayIcon className="h-5 w-5 sm:mr-1" />Process</button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CodeChefProfileAnalyzer;
