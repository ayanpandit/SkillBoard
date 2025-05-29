// src/components/CodeChefProfileAnalyzer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
    MagnifyingGlassIcon,
    ArrowUpTrayIcon,
    UsersIcon,
    UserIcon,
    TableCellsIcon,
    ArrowDownTrayIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    XMarkIcon,
    ArrowPathIcon,
    FunnelIcon, // For Filter
    ChevronUpIcon, // For sort
    ChevronDownIcon, // For sort
    InformationCircleIcon, // Potentially for tooltips/info
    StarIcon, // Using one from Heroicons directly for stars
    TagIcon, // For contest number search
} from '@heroicons/react/24/outline'; // Using Heroicons v2

//===============================================================================================
/*const API_CONFIG = {
    host: 'skillboard-yyn4.onrender.com',
    protocol: 'https',
    port: '', // no port needed for HTTPS
};

const API_BASE_URL = `${API_CONFIG.protocol}://${API_CONFIG.host}`;*/
//====================================================================================================
const API_CONFIG = {
    host: 'skillboard-production.up.railway.app',
    protocol: 'https',
    port: '',  // no port needed for HTTPS
};

const API_BASE_URL = `${API_CONFIG.protocol}://${API_CONFIG.host}`;


//====================================================================================================
/*const API_CONFIG = {
    host: 'localhost',
    protocol: 'http',
    port: '5000', // or whatever port your Flask backend is using
};

const API_BASE_URL = `${API_CONFIG.protocol}://${API_CONFIG.host}${API_CONFIG.port ? `:${API_CONFIG.port}` : ''}`;*/

//====================================================================================================



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

// --- Heatmap Helper Components ---
const SimpleHeatmapCell = ({ date, value, maxValue }) => {
    const intensity = maxValue > 0 ? Math.min(1, value / maxValue) : 0;
    let bgColor = 'bg-slate-600'; // Base for no/low activity, distinct from overall bg
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
};

const HeatmapDisplay = ({ heatMapData }) => {
    if (!heatMapData || heatMapData.length === 0) {
        return <p className="text-slate-500 text-sm">No heatmap data available.</p>;
    }

    const sortedHeatMapData = [...heatMapData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxValue = Math.max(...sortedHeatMapData.map(d => d.value), 0);

    const dataByYearMonth = sortedHeatMapData.reduce((acc, curr) => {
        const date = new Date(curr.date); // Assuming curr.date is 'YYYY-MM-DD'
        const year = date.getUTCFullYear();
        const month = date.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
        const yearMonth = `${month} ${year}`;
        if (!acc[yearMonth]) {
            acc[yearMonth] = [];
        }
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
                    <p className="text-slate-500 text-sm">No activity entries found in heatmap data.</p>
                )}
            </div>
            <div className="flex items-center space-x-1 text-xs mt-2 text-slate-500">
                <span>Less</span>
                <div className="w-2.5 h-2.5 bg-slate-600 rounded-sm" title="0/low activity"></div>
                <div className="w-2.5 h-2.5 bg-green-400 rounded-sm"></div>
                <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div>
                <div className="w-2.5 h-2.5 bg-green-700 rounded-sm"></div>
                <span>More</span>
            </div>
        </div>
    );
};


const CodeChefProfileAnalyzer = () => {
    // Input States
    const [singleUsername, setSingleUsername] = useState('');
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');

    // Data States
    const [allResults, setAllResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Table Interaction States
    const [usernameSearch, setUsernameSearch] = useState('');
    const [specificContestSearch, setSpecificContestSearch] = useState(''); // For contest number
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const fileInputRef = useRef(null);

    // --- Utility Functions ---
    const showNotification = (message, type = 'error', duration = 5000) => {
        if (type === 'error') setErrorMessage(message);
        else setSuccessMessage(message);

        setTimeout(() => {
            setErrorMessage('');
            setSuccessMessage('');
        }, duration);
    };

    const getStarBadge = (starsStr) => {
        if (!starsStr || starsStr === 'N/A') return <span className="text-gray-400">N/A</span>;
        const starCount = parseInt(starsStr.charAt(0));
        let colorClass = 'text-yellow-400';
        if (starCount === 1) colorClass = 'text-gray-400';
        else if (starCount === 2) colorClass = 'text-green-500';
        else if (starCount === 3) colorClass = 'text-blue-500';
        else if (starCount === 4) colorClass = 'text-purple-500';
        else if (starCount === 5) colorClass = 'text-orange-500';
        else if (starCount >= 6) colorClass = 'text-red-500';

        return (
            <span className={`font-bold ${colorClass} flex items-center`}>
                {starsStr.charAt(0)} <StarIcon className="h-4 w-4 ml-1" />
            </span>
        );
    };


    // --- API Call Functions ---
    const fetchData = async (url, options = {}) => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const response = await fetch(url, options);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const textResponse = await response.text();
                throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}...`);
            }
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const searchSingleUser = async () => {
        if (!singleUsername.trim()) {
            showNotification('Please enter a CodeChef username.', 'error');
            return;
        }
        const result = await fetchData(`${API_BASE_URL}/fetch-profile?username=${encodeURIComponent(singleUsername.trim())}`);
        if (result) {
            const resultsArray = Array.isArray(result) ? result : [result];
            if (resultsArray[0] && resultsArray[0].username) {
                setAllResults(resultsArray);
                // setFilteredResults(resultsArray); // applyFiltersAndSort will handle this
                showNotification(`Profile for ${resultsArray[0].username} fetched.`, 'success');
            } else {
                showNotification('Received malformed data for single user.', 'error');
                setAllResults([]);
                // setFilteredResults([]);
            }
        } else {
            setAllResults([]);
            // setFilteredResults([]);
        }
    };

    const processBulkUpload = async () => {
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
            const validResults = results.filter(r => r && r.username);
            setAllResults(validResults);
            // setFilteredResults(validResults); // applyFiltersAndSort will handle this
            const successCount = validResults.filter(r => r.status === 'success' || (r.data && r.data.success)).length; // Check for success flag too
            showNotification(`${successCount} valid profiles processed out of ${results.length}.`, 'success');
            if (validResults.length !== results.length) {
                showNotification(`Some profiles in bulk upload were malformed or failed.`, 'error');
            }
        } else {
            showNotification('Received malformed data for bulk users or no data.', 'error');
            setAllResults([]);
            // setFilteredResults([]);
        }
    };

    // --- File Handling ---
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

    // --- Table Filtering and Sorting ---
    const getNestedValue = (obj, path) => {
        if (!obj || !path) return null;
        if (path === 'cheatCount') return calculateCheatCount(obj.data);

        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (typeof current !== 'object' || current === null || !(key in current)) {
                return (path.includes('Rating') || path.includes('Contests') || path.includes('Rank') || path.includes('Given')) ? 0 : 'N/A';
            }
            current = current[key];
        }
        return current;
    };

    const calculateCheatCount = (userData) => {
        if (!userData || !Array.isArray(userData.ratingData)) return 0;
        return userData.ratingData.reduce((sum, contest) => {
            if (contest && Array.isArray(contest.penalised_in) && contest.penalised_in.length > 0) {
                return sum + 1; // Count as 1 incident if penalised_in array is not empty
            }
            return sum;
        }, 0);
    };

    const checkContestParticipation = (userData, contestNumber) => {
        if (!userData || !Array.isArray(userData.ratingData) || !contestNumber || !contestNumber.trim()) return null;
        const contestNumStr = contestNumber.trim();
        // Regex to match "Starters {number}" or "START{number}" possibly followed by a division letter
        // It will match if contest.name is like "Starters 123 (Rated)" or "Starters 123 Division 2"
        const contestNameRegex = new RegExp(`starters\\s+${contestNumStr}(?:\\s|\\(|[A-D])`, 'i');
        // It will match if contest.code is like "START123D"
        const contestCodeRegex = new RegExp(`START${contestNumStr}[A-D]?`, 'i');

        return userData.ratingData.some(contest =>
            (contest.name && contestNameRegex.test(contest.name)) ||
            (contest.code && contestCodeRegex.test(contest.code))
        );
    };


    const applyFiltersAndSort = useCallback(() => {
        let tempResults = [...allResults];

        if (usernameSearch.trim()) {
            const searchTermLower = usernameSearch.toLowerCase().trim();
            tempResults = tempResults.filter(result => {
                if (!result || typeof result.username !== 'string') return false;
                const usernameMatch = result.username.toLowerCase().includes(searchTermLower);
                const nameMatch = result.data?.name?.toLowerCase().includes(searchTermLower);
                return usernameMatch || nameMatch;
            });
        }

        // Note: specificContestSearch is used for highlighting, not filtering here. Filtering for it is done in exportNonParticipants.

        if (sortConfig.key) {
            tempResults.sort((a, b) => {
                let valA = getNestedValue(a, sortConfig.key);
                let valB = getNestedValue(b, sortConfig.key);

                // Handle N/A for numeric sorts, treating N/A as lowest
                if (typeof valA === 'string' && valA === 'N/A') valA = -Infinity;
                if (typeof valB === 'string' && valB === 'N/A') valB = -Infinity;


                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
                } else {
                    valA = String(valA == null || valA === -Infinity ? '' : valA).toLowerCase();
                    valB = String(valB == null || valB === -Infinity ? '' : valB).toLowerCase();
                    if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
            });
        }
        setFilteredResults(tempResults);
    }, [allResults, usernameSearch, sortConfig]); // specificContestSearch not needed here as it's for display/export


    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        const debouncedFilterSort = debounce(applyFiltersAndSort, 300);
        debouncedFilterSort();
    }, [applyFiltersAndSort]); // Removed usernameSearch, sortConfig, allResults. applyFiltersAndSort itself depends on them.

    // --- Export Functions ---
    const exportToCSV = (dataToExport, filename) => { // For full profile data
        if (!dataToExport || dataToExport.length === 0) {
            showNotification('No data to export.', 'error');
            return;
        }
        const headers = [
            'Username', 'Full Name', 'Rating', 'Stars', 'Contests Attended', 'Cheat Incidents', 'Max Rating', 'Global Rank', 'Country Rank'
        ];
        const csvRows = [
            headers.join(','),
            ...dataToExport.map(row => {
                if (!row || !row.username || !row.data) return '';
                const name = row.data.name || 'N/A';
                const cheatCount = calculateCheatCount(row.data);
                return [
                    `"${row.username}"`, `"${name}"`, row.data.currentRating || 'N/A',
                    `"${row.data.stars || 'N/A'}"`, row.data.contestsGiven || 0, cheatCount,
                    row.data.highestRating || 'N/A', row.data.globalRank || 'N/A', row.data.countryRank || 'N/A'
                ].filter(Boolean).join(',');
            }).filter(row => row)
        ];

        if (csvRows.length <= 1) {
            showNotification('No valid data to export.', 'error');
            return;
        }

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`${filename} exported.`, 'success');
    };

    const exportUsernamesToCSV = (users, filename) => { // For list of usernames
        if (!users || users.length === 0) {
            showNotification('No usernames to export.', 'error');
            return;
        }
        const headers = ['Username'];
        const csvRows = [
            headers.join(','),
            ...users.map(user => `"${user.username}"`) // Assumes users is an array of {username: string}
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`${filename} exported.`, 'success');
    };


    const exportAllData = () => exportToCSV(filteredResults, 'codechef_profiles_all.csv');

    const exportNonParticipants = () => {
        if (!specificContestSearch.trim()) {
            showNotification('Please enter a contest number to find non-participants.', 'error');
            return;
        }
        const contestNum = specificContestSearch.trim();
        const nonParticipants = filteredResults.filter(user => {
            if (!user.data) return true; // Treat users with no fetched data as non-participants for this purpose
            return !checkContestParticipation(user.data, contestNum);
        });

        if (nonParticipants.length === 0) {
            showNotification(`All currently filtered users seem to have participated in Starters ${contestNum}, or no users to check.`, 'info', 4000);
            return;
        }
        exportUsernamesToCSV(nonParticipants, `non_participants_starters_${contestNum}.csv`);
    };


    // --- Modal ---
    const openModal = (user) => {
        if (!user || !user.data) {
            showNotification('Cannot open details for user with missing data.', 'error');
            return;
        }
        setSelectedUser(user);
        setShowModal(true);
    };
    const closeModal = () => setShowModal(false);

    // --- Refresh / Reset ---
    const handleRefresh = () => {
        setSingleUsername('');
        setFile(null);
        setFileName('');
        setAllResults([]);
        // setFilteredResults([]); // This will be handled by applyFiltersAndSort
        setUsernameSearch('');
        setSpecificContestSearch('');
        setSortConfig({ key: null, direction: 'ascending' });
        if (fileInputRef.current) fileInputRef.current.value = "";
        showNotification('Analyzer reset.', 'success', 3000);
    };

    // Table Columns Definition
    const columns = [
        { key: 's.no', label: 'S.No', sortable: false, render: (item, index) => index + 1 },
        { key: 'username', label: 'Username', sortable: true, render: (item) => <span className="font-semibold text-indigo-400">{item.username}</span> },
        { key: 'data.name', label: 'Full Name', sortable: true, render: (item) => getNestedValue(item, 'data.name') },
        { key: 'data.currentRating', label: 'Rating', sortable: true, render: (item) => getNestedValue(item, 'data.currentRating') },
        { key: 'data.stars', label: 'Stars', sortable: true, render: (item) => getStarBadge(getNestedValue(item, 'data.stars')) },
        { key: 'data.contestsGiven', label: 'Contests', sortable: true, render: (item) => getNestedValue(item, 'data.contestsGiven') },
        {
            key: 'cheatCount', label: 'Cheats', sortable: true, render: (item) => {
                const count = calculateCheatCount(item.data);
                return count > 0 ? <span className="px-2 py-0.5 text-xs font-semibold text-red-100 bg-red-600 rounded-full">{count}</span> : <span className="text-green-400">0</span>;
            }
        },
        { key: 'data.highestRating', label: 'Max Rating', sortable: true, render: (item) => getNestedValue(item, 'data.highestRating') },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 p-4 md:p-8">
            <div className="container mx-auto max-w-7xl"> {/* Increased max-width for better table view */}
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        CodeChef Profile Analyzer
                    </h1>
                    <p className="text-slate-400 text-sm">Analyze profiles, contest participation, and activity.</p>
                </header>

                {errorMessage && ( /* Notifications ... */
                    <div className="fixed top-5 right-5 bg-red-600 text-white p-3 rounded-md shadow-lg z-[100] flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" /> {errorMessage}
                        <button onClick={() => setErrorMessage('')} className="ml-3"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                )}
                {successMessage && (
                    <div className="fixed top-5 right-5 bg-green-600 text-white p-3 rounded-md shadow-lg z-[100] flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" /> {successMessage}
                        <button onClick={() => setSuccessMessage('')} className="ml-3"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                )}

                <section className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
                    {/* Input sections ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-2 flex items-center"><UserIcon className="h-5 w-5 mr-1 text-indigo-400" />Single Search</h2>
                            <div className="flex space-x-2">
                                <input type="text" value={singleUsername} onChange={(e) => setSingleUsername(e.target.value)} placeholder="Username" className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                                <button onClick={searchSingleUser} disabled={loading} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md disabled:opacity-50 flex items-center"><MagnifyingGlassIcon className="h-5 w-5 mr-1" />Search</button>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2 flex items-center"><UsersIcon className="h-5 w-5 mr-1 text-teal-400" />Bulk Upload</h2>
                            <div className="flex flex-col space-y-2">
                                <label htmlFor="csvFile" className="w-full p-2 bg-slate-700 border-2 border-dashed border-slate-600 rounded-md cursor-pointer hover:border-teal-500 text-center text-slate-400">
                                    {fileName || "Choose CSV/Excel (.csv, .xlsx, .xls)"}
                                </label>
                                <input type="file" id="csvFile" ref={fileInputRef} accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
                                <button onClick={processBulkUpload} disabled={loading || !file} className="w-full p-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-md disabled:opacity-50 flex items-center justify-center"><ArrowUpTrayIcon className="h-5 w-5 mr-1" />Process</button>
                            </div>
                        </div>
                    </div>
                </section>

                {(allResults.length > 0 || loading) && (
                    <section className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
                        <h2 className="text-lg font-semibold mb-3 flex items-center"><FunnelIcon className="h-5 w-5 mr-1 text-orange-400" />Filter, Search & Export</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label htmlFor="username-s" className="block text-xs text-slate-400 mb-0.5">Search Username/Name</label>
                                <input id="username-s" type="text" value={usernameSearch} onChange={(e) => setUsernameSearch(e.target.value)} placeholder="Filter by name..." className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div className="md:col-span-1"> {/* Contest Search */}
                                <label htmlFor="contest-s" className="block text-xs text-slate-400 mb-0.5">Search by Contest No.</label>
                                <div className="flex space-x-2">
                                    <input id="contest-s" type="text" value={specificContestSearch} onChange={(e) => setSpecificContestSearch(e.target.value)} placeholder="e.g., 187" className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500" />
                                    <button
                                        onClick={exportNonParticipants}
                                        disabled={loading || !specificContestSearch.trim() || filteredResults.length === 0}
                                        className="p-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-md disabled:opacity-50 flex items-center"
                                        title="Download Non-Participants for this Contest No."
                                    >
                                        <ArrowDownTrayIcon className="h-5 w-5 sm:mr-1" /> <span className="hidden sm:inline">DL Non-Ps</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex space-x-2 justify-end sm:col-span-2 md:col-span-1"> {/* Export & Reset buttons */}
                                <button onClick={exportAllData} disabled={loading || filteredResults.length === 0} className="p-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50 flex items-center"><ArrowDownTrayIcon className="h-5 w-5 mr-1" />Export All</button>
                                <button onClick={handleRefresh} className="p-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md flex items-center"><ArrowPathIcon className="h-5 w-5 mr-1" />Reset</button>
                            </div>
                        </div>
                        {loading && <div className="mt-4 text-center text-teal-400 animate-pulse">Loading data, please wait...</div>}
                        <div className="mt-2 text-xs text-slate-500">
                            {allResults.length > 0 && `Showing ${filteredResults.length} of ${allResults.length} results.`}
                        </div>
                    </section>
                )}

                {filteredResults.length > 0 && (
                    <section className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm text-left"> {/* Increased min-width for more columns */}
                                <thead className="text-xs text-slate-400 uppercase bg-slate-700/60">
                                    <tr>
                                        {columns.map(col => (
                                            <th key={col.key} scope="col" className="px-4 py-3 sticky top-0 bg-slate-700/80 backdrop-blur-sm" onClick={() => col.sortable && requestSort(col.key)}>
                                                <div className={`flex items-center ${col.sortable ? 'cursor-pointer hover:text-indigo-400' : ''}`}>
                                                    {col.label}
                                                    {col.sortable && sortConfig.key === col.key && (
                                                        sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4 ml-1 text-indigo-400" /> : <ChevronDownIcon className="h-4 w-4 ml-1 text-indigo-400" />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredResults.map((item, index) => {
                                        if (!item || !item.username) return null;

                                        let participationClass = '';
                                        if (specificContestSearch.trim() && item.data) {
                                            const participated = checkContestParticipation(item.data, specificContestSearch.trim());
                                            if (participated === true) {
                                                participationClass = 'bg-green-800/20 hover:bg-green-700/30';
                                            } else if (participated === false) {
                                                participationClass = 'bg-red-800/20 hover:bg-red-700/30';
                                            }
                                        }

                                        return (
                                            <tr key={item.username + index} onClick={() => item.data && openModal(item)}
                                                className={`hover:bg-slate-700/50 transition-colors duration-150 
                                                            ${item.data ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                                                            ${participationClass}`}>
                                                {columns.map(col => (
                                                    <td key={col.key + item.username} className="px-4 py-3 whitespace-nowrap">
                                                        {col.render(item, index)}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {allResults.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        <TableCellsIcon className="h-12 w-12 mx-auto mb-3" />
                        <p>No data. Use search or upload to begin analysis.</p>
                    </div>
                )}
            </div>

            {showModal && selectedUser && selectedUser.data && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-slate-800 text-slate-200 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10 rounded-t-lg">
                            <div className="flex items-center space-x-3">
                                <UserIcon className="h-6 w-6 text-indigo-500" />
                                <div>
                                    <h2 className="text-xl font-semibold text-indigo-400">{selectedUser.username}</h2>
                                    <p className="text-sm text-slate-400">{selectedUser.data.name || 'Name not available'}</p>
                                </div>
                                {selectedUser.data.countryFlag && (
                                    <img src={selectedUser.data.countryFlag} alt={selectedUser.data.countryName}
                                        title={selectedUser.data.countryName} className="h-6 w-auto rounded-sm" />
                                )}
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Profile Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-indigo-400">{selectedUser.data.currentRating || 'N/A'}</div>
                                    <div className="text-xs text-slate-400">Current Rating</div>
                                </div>
                                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                                    <div className="text-xl font-bold">{getStarBadge(selectedUser.data.stars)}</div>
                                    <div className="text-xs text-slate-400">Stars</div>
                                </div>
                                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-400">{selectedUser.data.contestsGiven || 0}</div>
                                    <div className="text-xs text-slate-400">Contests</div>
                                </div>
                                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                                    <div className={`text-2xl font-bold ${calculateCheatCount(selectedUser.data) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {calculateCheatCount(selectedUser.data)}
                                    </div>
                                    <div className="text-xs text-slate-400">Violations</div>
                                </div>
                            </div>

                            {/* Detailed Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-3 text-indigo-400 flex items-center">
                                        <StarIcon className="h-5 w-5 mr-2" />
                                        Performance Metrics
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Highest Rating:</span>
                                            <span className="font-medium">{selectedUser.data.highestRating || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Global Rank:</span>
                                            <span className="font-medium">{selectedUser.data.globalRank || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Country Rank:</span>
                                            <span className="font-medium">{selectedUser.data.countryRank || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Country:</span>
                                            <span className="font-medium">{selectedUser.data.countryName || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-3 text-teal-400 flex items-center">
                                        <InformationCircleIcon className="h-5 w-5 mr-2" />
                                        Account Info
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Username:</span>
                                            <span className="font-medium text-indigo-300">{selectedUser.username}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Profile Status:</span>
                                            <span className="font-medium text-green-400">Active</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Total Contests:</span>
                                            <span className="font-medium">{selectedUser.data.ratingData?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contest History */}
                            {selectedUser.data.ratingData && selectedUser.data.ratingData.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold mb-3 text-purple-400 flex items-center">
                                        <TableCellsIcon className="h-5 w-5 mr-2" />
                                        Contest History {/* Changed "Recent Contest History" to "Contest History" */}
                                    </h3>
                                    <div className="bg-slate-700/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                                        <div className="space-y-2">
                                            {/* MODIFIED: Removed .slice(0, 10) to show all contests */}
                                            {selectedUser.data.ratingData.map((contest, i) => (
                                                <div key={contest.code + i}
                                                    className={`p-3 rounded-md border-l-4 ${contest.penalised_in && contest.penalised_in.length > 0
                                                        ? 'bg-red-900/20 border-red-400'
                                                        : 'bg-slate-600/30 border-blue-400'
                                                        }`}>
                                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-sm truncate">{contest.name}</h4>
                                                            <p className="text-xs text-slate-400">{contest.code}</p>
                                                        </div>
                                                        <div className="text-right text-xs">
                                                            <div className="font-medium">Rating: {contest.rating}</div>
                                                            <div className="text-slate-400">Rank: {contest.rank}</div>
                                                            {contest.penalised_in && contest.penalised_in.length > 0 && (
                                                                <div className="text-red-300 font-medium">⚠ Penalized</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(!selectedUser.data.ratingData || selectedUser.data.ratingData.length === 0) && (
                                <div className="text-center py-8 text-slate-500">
                                    <TableCellsIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No contest history available</p>
                                </div>
                            )}

                            {/* Heatmap Display */}
                            <HeatmapDisplay heatMapData={selectedUser.data.heatMap} />
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-700 flex justify-between items-center sticky bottom-0 bg-slate-800 z-10 rounded-b-lg">
                            <div className="text-xs text-slate-400">
                                Profile data as of latest fetch
                            </div>
                            <button onClick={closeModal}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Footer */}
            <footer className="mt-12 border-t border-slate-700 pt-8">
                <div className="text-center space-y-6">
                    {/* Social Media Icons */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-300">Connect With Us</h3>
                        <div className="flex justify-center space-x-6">
                            <a href="https://www.linkedin.com/in/ayan-pandey-b66067296/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                            <a href="https://www.instagram.com/ayanpandit_31?igsh=NWkyMzFrYTkxbTN5"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-slate-700 hover:bg-pink-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.986 11.988 11.986s11.987-5.368 11.987-11.986C24.014 5.367 18.635.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.197-1.559-.748-.948-1.186-2.25-1.186-3.729 0-1.297.315-2.472.942-3.355.627-.882 1.51-1.559 2.441-1.933v1.297c-.627.374-1.186 1.049-1.49 1.933-.305.883-.441 1.933-.441 3.058 0 1.125.136 2.175.441 3.058.304.884.863 1.559 1.49 1.933v1.297zm7.098 0v-1.297c.627-.374 1.186-1.049 1.49-1.933.305-.883.441-1.933.441-3.058 0-1.125-.136-2.175-.441-3.058-.304-.884-.863-1.559-1.49-1.933V5.412c.931.374 1.814 1.051 2.441 1.933.627.883.942 2.058.942 3.355 0 1.479-.438 2.781-1.186 3.729-.749.948-1.9 1.559-3.197 1.559z" />
                                </svg>
                            </a>
                            <a href="https://github.com/ayanpandit"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-slate-700 hover:bg-gray-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Suggestion Box */}
                    <div>
                        <button
                            onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLScSyPv2Nc5gyqDu7wQ1JLNGLeLEdDzjhsYD9VfCaduIIEYZtg/viewform?usp=dialog', '_blank')}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Send Suggestions
                        </button>
                    </div>

                    {/* Copyright */}
                    <div className="text-sm text-slate-500 border-t border-slate-700 pt-4">
                        <p>🌟 Built with passion and a pinch of late-night coffee — by Ayan Pandey 2023-27 </p>
                        <p>© 2025 CodeChef Profile Analyzer. </p>
                    </div>
                </div>
            </footer>
        </div>

    );

};

export default CodeChefProfileAnalyzer;
