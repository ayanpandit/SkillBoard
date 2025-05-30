// src/components/CodeChefProfileAnalyzer.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

import {
    MagnifyingGlassIcon, ArrowUpTrayIcon, UsersIcon, UserIcon, TableCellsIcon,
    ArrowDownTrayIcon, ExclamationCircleIcon, CheckCircleIcon, XMarkIcon, ArrowPathIcon,
    FunnelIcon, ChevronUpIcon, ChevronDownIcon, InformationCircleIcon, StarIcon as HeroStarIcon,
    TagIcon,
} from '@heroicons/react/24/outline';

// API_CONFIG and API_BASE_URL remain the same
const API_CONFIG = {
    host: 'localhost',
    protocol: 'http',
    port: '5000',
};
const API_BASE_URL = `${API_CONFIG.protocol}://${API_CONFIG.host}${API_CONFIG.port ? `:${API_CONFIG.port}` : ''}`;


// Debounce function remains the same
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

// Heatmap components (SimpleHeatmapCell, HeatmapDisplay) remain the same as last version (already memoized)
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
                    <p className="text-slate-500 text-sm">No activity entries found.</p>
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
});


// TableRow memoized component remains the same
const TableRow = memo(({ item, index, columns, specificContestSearch, checkContestParticipation, openModal }) => {
    if (!item || !item.username) return null;

    let participationClass = '';
    if (specificContestSearch.trim() && item.data) { // item.data implies item.status was 'success'
        const participated = checkContestParticipation(item.data, specificContestSearch.trim());
        if (participated === true) participationClass = 'bg-green-800/20 hover:bg-green-700/30';
        else if (participated === false) participationClass = 'bg-red-800/20 hover:bg-red-700/30';
    }

    return (
        <tr onClick={() => item.status === 'success' && item.data && openModal(item)} // only open modal on success
            className={`hover:bg-slate-700/50 transition-colors duration-150 
                        ${item.status === 'success' && item.data ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                        ${participationClass}`}>
            {columns.map(col => (
                <td key={col.key + item.username + index} className="px-4 py-3 whitespace-nowrap">
                    {col.render(item, index)}
                </td>
            ))}
        </tr>
    );
});


const CodeChefProfileAnalyzer = () => {
    // States remain the same
    const [singleUsername, setSingleUsername] = useState('');
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [allResults, setAllResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [usernameSearch, setUsernameSearch] = useState('');
    const [specificContestSearch, setSpecificContestSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const fileInputRef = useRef(null);

    const showNotification = useCallback((message, type = 'error', duration = 5000) => {
        if (type === 'error') setErrorMessage(message);
        else setSuccessMessage(message);
        setTimeout(() => {
            setErrorMessage('');
            setSuccessMessage('');
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
        else if (starCount === 2) colorClass = 'text-green-500';
        else if (starCount === 3) colorClass = 'text-blue-500';
        else if (starCount === 4) colorClass = 'text-purple-500';
        else if (starCount === 5) colorClass = 'text-orange-500'; // For 5 stars
        else if (starCount >= 6) colorClass = 'text-red-500';    // For 6 and 7 stars

        return (
            <span className={`font-bold ${colorClass} flex items-center`}>
                {firstChar} <HeroStarIcon className="h-4 w-4 ml-1" />
            </span>
        );
    }, []);

    // fetchData, searchSingleUser, processBulkUpload, handleFileChange remain the same as last version

    const fetchData = useCallback(async (url, options = {}) => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
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
            showNotification('Please enter a CodeChef username.', 'error');
            return;
        }
        const result = await fetchData(`${API_BASE_URL}/fetch-profile?username=${encodeURIComponent(singleUsername.trim())}`);
        if (result) {
            const resultsArray = Array.isArray(result) ? result : [result];
            if (resultsArray[0] && resultsArray[0].username) { // Check for username, status check is done by UI
                setAllResults(resultsArray);
                if (resultsArray[0].status === 'success') {
                    showNotification(`Profile for ${resultsArray[0].username} fetched.`, 'success');
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

    // getNestedValue, calculateCheatCount, checkContestParticipation, applyFiltersAndSort, requestSort, useEffect for debouncing remain the same as last version
    const getNestedValue = useCallback((obj, path) => {
        if (!obj || !path) return null;
        if (path === 'cheatCount') return calculateCheatCount(obj.data);

        const keys = path.split('.');
        let current = obj; // `obj` here is the full result item (e.g., { username: 'u', status: 'success', data: { ... } })
        for (const key of keys) {
            if (key === 'data' && current.status === 'success') { // Enter data object only if status is success
                current = current.data;
                if (typeof current !== 'object' || current === null) return (path.includes('Rating') || path.includes('contestsGiven') || path.includes('Rank')) ? 0 : 'N/A';
                continue;
            } else if (key === 'data' && current.status !== 'success') { // If trying to access data on an error item
                return (path.includes('Rating') || path.includes('contestsGiven') || path.includes('Rank')) ? 0 : 'N/A';
            }

            // For keys other than 'data', or after entering 'data'
            if (typeof current !== 'object' || current === null || !(key in current)) {
                // Provide a default value for sorting, especially for numeric fields.
                if (path.includes('Rating') || path.includes('contestsGiven') || path.includes('Rank')) return 0; // For sorting, make errors/N/A low
                return 'N/A'; // For display
            }
            current = current[key];
        }
        // Final null/undefined check
        if (current === null || current === undefined) {
            if (path.includes('Rating') || path.includes('contestsGiven') || path.includes('Rank')) return 0;
            return 'N/A';
        }
        return current;
    }, [/* calculateCheatCount defined below, so not a dep here */]); // remove calculateCheatCount if it's standalone

    const calculateCheatCount = useCallback((userData) => { // userData is assumed to be result.data
        if (!userData || !Array.isArray(userData.ratingData)) return 0;
        return userData.ratingData.reduce((sum, contest) => {
            if (contest && Array.isArray(contest.penalised_in) && contest.penalised_in.length > 0) {
                return sum + 1;
            }
            return sum;
        }, 0);
    }, []);

    const checkContestParticipation = useCallback((userData, contestNumber) => { // userData is assumed to be result.data
        if (!userData || !Array.isArray(userData.ratingData) || !contestNumber || !String(contestNumber).trim()) return null;
        const contestNumStr = String(contestNumber).trim();
        const contestNameRegex = new RegExp(`starters\\s+${contestNumStr}(?:\\s|\\(|[A-D]|$)`, 'i');
        const contestCodeRegex = new RegExp(`START${contestNumStr}[A-D]?$`, 'i');
        return userData.ratingData.some(contest =>
            (contest.name && contestNameRegex.test(contest.name)) ||
            (contest.code && contestCodeRegex.test(contest.code))
        );
    }, []);

    const applyFiltersAndSort = useCallback(() => {
        let tempResults = [...allResults];

        if (usernameSearch.trim()) {
            const searchTermLower = usernameSearch.toLowerCase().trim();
            tempResults = tempResults.filter(result => {
                if (!result || typeof result.username !== 'string') return false;
                const usernameMatch = result.username.toLowerCase().includes(searchTermLower);
                const nameMatch = result.status === 'success' && result.data?.name?.toLowerCase().includes(searchTermLower);
                return usernameMatch || nameMatch;
            });
        }

        if (sortConfig.key) {
            tempResults.sort((a, b) => {
                // For 'status', 'username', direct access. For others, use getNestedValue properly
                let valA, valB;
                if (sortConfig.key === 'username') {
                    valA = a.username;
                    valB = b.username;
                } else if (sortConfig.key === 'status') {
                    valA = a.status;
                    valB = b.status;
                } else { // data nested keys
                    valA = getNestedValue(a, sortConfig.key);
                    valB = getNestedValue(b, sortConfig.key);
                }

                // Numeric sort: Handle cases where values might be N/A, undefined, or actual numbers.
                // getNestedValue for numeric paths already returns 0 for error/N/A cases.
                const isNumericSort = sortConfig.key.includes('Rating') || sortConfig.key.includes('contestsGiven') || sortConfig.key === 'cheatCount';

                if (isNumericSort) {
                    // Ensure N/A, null, undefined from getNestedValue are treated as -Infinity for sorting.
                    // If getNestedValue for numeric fields returns 0 on error, that's already handled.
                    const numA = (typeof valA === 'number') ? valA : (valA === 'N/A' || valA === undefined || valA === null ? -Infinity : parseFloat(String(valA).replace(/[^0-9.-]+/g, "")) || -Infinity);
                    const numB = (typeof valB === 'number') ? valB : (valB === 'N/A' || valB === undefined || valB === null ? -Infinity : parseFloat(String(valB).replace(/[^0-9.-]+/g, "")) || -Infinity);
                    return sortConfig.direction === 'ascending' ? numA - numB : numB - numA;
                } else { // String sort
                    const strA = String(valA == null ? '' : valA).toLowerCase();
                    const strB = String(valB == null ? '' : valB).toLowerCase();
                    if (strA < strB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (strA > strB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
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

    // exportToCSV, exportUsernamesToCSV, exportAllData, exportNonParticipants remain the same as last version
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

        if (csvRows.length <= 1) { showNotification('No valid data to create CSV rows.', 'error'); return; }

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`${filename} exported.`, 'success');
    }, [showNotification, calculateCheatCount]);

    const exportUsernamesToCSV = useCallback((users, filename) => { // users is an array of {username: string} objects
        if (!users || users.length === 0) {
            showNotification('No usernames to export.', 'error');
            return;
        }
        const headers = ['Username'];
        const csvRows = [headers.join(','), ...users.map(user => `"${user.username}"`)];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`${filename} exported.`, 'success');
    }, [showNotification]);

    const exportAllData = useCallback(() => exportToCSV(filteredResults, 'codechef_profiles_all.csv'), [filteredResults, exportToCSV]);

    const exportNonParticipants = useCallback(() => {
        if (!specificContestSearch.trim()) {
            showNotification('Please enter a contest number to find non-participants.', 'error');
            return;
        }
        const contestNum = specificContestSearch.trim();
        // Filter from 'filteredResults' which contains items with status
        const nonParticipantsRaw = filteredResults.filter(user => {
            if (user.status !== 'success' || !user.data) return true;
            return !checkContestParticipation(user.data, contestNum);
        });

        const nonParticipants = nonParticipantsRaw.map(u => ({ username: u.username }));


        if (nonParticipants.length === 0) {
            showNotification(`All currently filtered users seem to have participated in Starters ${contestNum}, or no valid users to check.`, 'info', 4000);
            return;
        }
        exportUsernamesToCSV(nonParticipants, `non_participants_starters_${contestNum}.csv`);
    }, [filteredResults, specificContestSearch, showNotification, checkContestParticipation, exportUsernamesToCSV]);


    // openModal, closeModal, handleRefresh remain the same as last version
    const openModal = useCallback((user) => {
        // Parameter `user` is expected to be an item from `allResults` or `filteredResults`
        if (!user || user.status !== 'success' || !user.data) {
            showNotification('Cannot open details. User data is missing, an error occurred, or profile not found.', 'error');
            return;
        }
        setSelectedUser(user); // `user` here contains {username, status: 'success', data: {...}}
        setShowModal(true);
    }, [showNotification]);

    const closeModal = useCallback(() => setShowModal(false), []);

    const handleRefresh = useCallback(() => {
        setSingleUsername('');
        setFile(null);
        setFileName('');
        setAllResults([]);
        // filteredResults will be updated by useEffect on allResults change
        setUsernameSearch('');
        setSpecificContestSearch('');
        setSortConfig({ key: null, direction: 'ascending' });
        if (fileInputRef.current) fileInputRef.current.value = "";
        showNotification('Analyzer reset.', 'success', 3000);
    }, [showNotification]);


    // ***** MODIFIED columns DEFINITION TO INCLUDE MISSING FIELDS AND HANDLE STATUS *****
    const columns = React.useMemo(() => [
        { key: 's.no', label: 'S.No', sortable: false, render: (item, index) => index + 1 },
        {
            key: 'username',
            label: 'Username',
            sortable: true,
            render: (item) => <span className="font-semibold text-indigo-400">{item.username}</span>
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (item) => item.status === 'success' ?
                <CheckCircleIcon className="h-5 w-5 text-green-400" title="Success" /> :
                <ExclamationCircleIcon
                    className="h-5 w-5 text-red-400 cursor-help"
                    title={item.message || "Error/Not found"}
                />
        },
        {
            key: 'data.name',
            label: 'Full Name',
            sortable: true,
            render: (item) => item.status === 'success' ? (getNestedValue(item, 'data.name') || 'N/A') : <span className="text-slate-500 italic">{item.message || 'N/A'}</span>
        },
        {
            key: 'data.currentRating',
            label: 'Rating',
            sortable: true,
            render: (item) => item.status === 'success' ? (getNestedValue(item, 'data.currentRating') ?? 'N/A') : <span className="text-slate-500">N/A</span>
        },
        {
            key: 'data.stars',
            label: 'Stars',
            sortable: true,
            render: (item) => item.status === 'success' ? getStarBadge(getNestedValue(item, 'data.stars')) : <span className="text-slate-500">N/A</span>
        },
        {
            key: 'data.contestsGiven',
            label: 'Contests',
            sortable: true,
            render: (item) => item.status === 'success' ? (getNestedValue(item, 'data.contestsGiven') ?? 0) : <span className="text-slate-500">N/A</span>
        },
        {
            key: 'cheatCount',
            label: 'Violations',
            sortable: true,
            render: (item) => {
                if (item.status !== 'success') return <span className="text-slate-500">N/A</span>;
                const count = calculateCheatCount(item.data); // item.data is safe here
                return count > 0 ? <span className="px-2 py-0.5 text-xs font-semibold text-red-100 bg-red-600 rounded-full">{count}</span> : <span className="text-green-400">0</span>;
            }
        },
        // ***** RESTORED Max Rating and Global Rank COLUMNS *****
        {
            key: 'data.highestRating',
            label: 'Max Rating',
            sortable: true,
            render: (item) => item.status === 'success' ? (getNestedValue(item, 'data.highestRating') ?? 'N/A') : <span className="text-slate-500">N/A</span>
        },
        {
            key: 'data.globalRank',
            label: 'Global Rank',
            sortable: true,
            render: (item) => item.status === 'success' ? (getNestedValue(item, 'data.globalRank') || 'N/A') : <span className="text-slate-500">N/A</span>
        },
    ], [getNestedValue, getStarBadge, calculateCheatCount]); // Dependencies for useMemo

    // Return JSX (Main UI structure, Error/Success messages, Input sections, Filter/Search, Table, Modal, Footer)
    // remains structurally the same as the last good version. The critical changes are above.
    // Only small adjustments for consistency (e.g. title attributes on icons) might be added.
    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 p-4 md:p-8">
            <div className="container mx-auto max-w-full px-2">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        CodeChef Profile Analyzer
                    </h1>
                    <p className="text-slate-400 text-sm">Analyze profiles, contest participation, and activity.</p>
                </header>

                {errorMessage && (
                    <div className="fixed top-5 right-5 bg-red-600 text-white p-3 rounded-md shadow-lg z-[100] flex items-center max-w-md">
                        <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span className="flex-grow break-words">{errorMessage}</span>
                        <button onClick={() => setErrorMessage('')} className="ml-3 p-1 rounded-full hover:bg-red-700"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                )}
                {successMessage && (
                    <div className="fixed top-5 right-5 bg-green-600 text-white p-3 rounded-md shadow-lg z-[100] flex items-center max-w-md">
                        <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span className="flex-grow break-words">{successMessage}</span>
                        <button onClick={() => setSuccessMessage('')} className="ml-3 p-1 rounded-full hover:bg-green-700"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                )}

                <section className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-2 flex items-center"><UserIcon className="h-5 w-5 mr-1 text-indigo-400" />Single Search</h2>
                            <div className="flex space-x-2">
                                <input type="text" value={singleUsername} onChange={(e) => setSingleUsername(e.target.value)} placeholder="Username" className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                                <button onClick={searchSingleUser} disabled={loading} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md disabled:opacity-50 flex items-center whitespace-nowrap"><MagnifyingGlassIcon className="h-5 w-5 sm:mr-1" />Search</button>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2 flex items-center"><UsersIcon className="h-5 w-5 mr-1 text-teal-400" />Bulk Upload</h2>
                            <div className="flex flex-col space-y-2">
                                <label htmlFor="csvFile" className="w-full p-2 bg-slate-700 border-2 border-dashed border-slate-600 rounded-md cursor-pointer hover:border-teal-500 text-center text-slate-400 truncate" title={fileName || "Choose CSV/Excel (.csv, .xlsx, .xls)"}>
                                    {fileName || "Choose CSV/Excel (.csv, .xlsx, .xls)"}
                                </label>
                                <input type="file" id="csvFile" ref={fileInputRef} accept=".csv,.xlsx,.xls,.txt" onChange={handleFileChange} className="hidden" />
                                <button onClick={processBulkUpload} disabled={loading || !file} className="w-full p-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-md disabled:opacity-50 flex items-center justify-center whitespace-nowrap"><ArrowUpTrayIcon className="h-5 w-5 sm:mr-1" />Process</button>
                            </div>
                        </div>
                    </div>
                </section>

                {(allResults.length > 0 || loading) && (
                    <section className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
                        <h2 className="text-lg font-semibold mb-3 flex items-center"><FunnelIcon className="h-5 w-5 mr-1 text-orange-400" />Filter, Search & Export</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label htmlFor="username-s" className="block text-xs text-slate-400 mb-0.5">Search User/Name</label>
                                <input id="username-s" type="text" value={usernameSearch} onChange={(e) => setUsernameSearch(e.target.value)} placeholder="Filter by name..." className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div className="md:col-span-1">
                                <label htmlFor="contest-s" className="block text-xs text-slate-400 mb-0.5">Contest No.</label>
                                <div className="flex space-x-2">
                                    <input id="contest-s" type="text" value={specificContestSearch} onChange={(e) => setSpecificContestSearch(e.target.value)} placeholder="e.g., 187" className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500" />
                                    <button
                                        onClick={exportNonParticipants}
                                        disabled={loading || !specificContestSearch.trim() || filteredResults.length === 0}
                                        className="p-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-md disabled:opacity-50 flex items-center whitespace-nowrap"
                                        title="Download Non-Participants for this Contest No." >
                                        <ArrowDownTrayIcon className="h-5 w-5 sm:mr-1" /> <span className="hidden sm:inline">Non-Ps</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex space-x-2 justify-end sm:col-span-2 md:col-span-1 items-center"> {/* Changed items-end to items-center for button alignment */}
                                <button onClick={exportAllData} disabled={loading || filteredResults.length === 0} className="p-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50 flex items-center whitespace-nowrap"><ArrowDownTrayIcon className="h-5 w-5 sm:mr-1" />Export All</button>
                                <button onClick={handleRefresh} disabled={loading} className="p-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md disabled:opacity-50 flex items-center whitespace-nowrap"><ArrowPathIcon className="h-5 w-5 sm:mr-1" />Reset</button>
                            </div>
                        </div>
                        {loading && <div className="mt-4 text-center text-teal-400 animate-pulse">Loading data, please wait... This may take some time for large files.</div>}
                        <div className="mt-2 text-xs text-slate-500">
                            {allResults.length > 0 && `Displaying ${filteredResults.length} of ${allResults.length} results. Usernames without fetched data are included but may sort differently.`}
                        </div>
                    </section>
                )}

                {filteredResults.length > 0 && (
                    <section className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-sm text-left"> {/* Adjusted min-width for more columns */}
                                <thead className="text-xs text-slate-400 uppercase bg-slate-700/60">
                                    <tr>
                                        {columns.map(col => (
                                            <th key={col.key} scope="col" className="px-4 py-3 sticky top-0 bg-slate-700/80 backdrop-blur-sm z-10 whitespace-nowrap" onClick={() => col.sortable && requestSort(col.key)}>
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
                                    {filteredResults.map((item, index) => (
                                        <TableRow
                                            key={item.username + "-" + index} // Make key more unique if usernames can repeat pre-filter
                                            item={item}
                                            index={index}
                                            columns={columns}
                                            specificContestSearch={specificContestSearch}
                                            checkContestParticipation={checkContestParticipation}
                                            openModal={openModal}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {allResults.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        <TableCellsIcon className="h-12 w-12 mx-auto mb-3" />
                        <p>No data to display. Use search or upload to begin analysis.</p>
                    </div>
                )}
            </div>

            {showModal && selectedUser && selectedUser.data && ( // Check selectedUser.data here too
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-2 sm:p-4">
                    <div className="bg-slate-800 text-slate-200 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10 rounded-t-lg">
                            <div className="flex items-center space-x-3 min-w-0">
                                <UserIcon className="h-6 w-6 text-indigo-500 flex-shrink-0" />
                                <div className="min-w-0">
                                    <h2 className="text-xl font-semibold text-indigo-400 truncate" title={selectedUser.username}>{selectedUser.username}</h2>
                                    <p className="text-sm text-slate-400 truncate" title={selectedUser.data.name || 'Name not available'}>{selectedUser.data.name || 'Name not available'}</p>
                                </div>
                                {selectedUser.data.countryFlag && (
                                    <img src={selectedUser.data.countryFlag} alt={selectedUser.data.countryName || 'Country'}
                                        title={selectedUser.data.countryName} className="h-6 w-auto rounded-sm ml-auto sm:ml-3 flex-shrink-0" />
                                )}
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-700 transition-colors flex-shrink-0">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar"> {/* Added custom-scrollbar for better UX if needed */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg text-center">
                                    <div className="text-xl sm:text-2xl font-bold text-indigo-400">{selectedUser.data.currentRating ?? 'N/A'}</div>
                                    <div className="text-xs text-slate-400">Current Rating</div>
                                </div>
                                <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg text-center">
                                    <div className="text-lg sm:text-xl font-bold">{getStarBadge(selectedUser.data.stars)}</div>
                                    <div className="text-xs text-slate-400">Stars</div>
                                </div>
                                <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg text-center">
                                    <div className="text-xl sm:text-2xl font-bold text-green-400">{selectedUser.data.contestsGiven ?? 0}</div>
                                    <div className="text-xs text-slate-400">Contests</div>
                                </div>
                                <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg text-center">
                                    <div className={`text-xl sm:text-2xl font-bold ${calculateCheatCount(selectedUser.data) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {calculateCheatCount(selectedUser.data)}
                                    </div>
                                    <div className="text-xs text-slate-400">Violations</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                                <div className="bg-slate-700/30 p-3 sm:p-4 rounded-lg">
                                    <h3 className="text-md sm:text-lg font-semibold mb-3 text-indigo-400 flex items-center">
                                        <HeroStarIcon className="h-5 w-5 mr-2" />Performance Metrics
                                    </h3>
                                    <div className="space-y-1.5 sm:space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-400">Highest Rating:</span><span className="font-medium">{selectedUser.data.highestRating ?? 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Global Rank:</span><span className="font-medium">{selectedUser.data.globalRank || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Country Rank:</span><span className="font-medium">{selectedUser.data.countryRank || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Country:</span><span className="font-medium">{selectedUser.data.countryName || 'N/A'}</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-700/30 p-3 sm:p-4 rounded-lg">
                                    <h3 className="text-md sm:text-lg font-semibold mb-3 text-teal-400 flex items-center">
                                        <InformationCircleIcon className="h-5 w-5 mr-2" />Account Info
                                    </h3>
                                    <div className="space-y-1.5 sm:space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-400">Username:</span><span className="font-medium text-indigo-300">{selectedUser.username}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Status:</span><span className="font-medium text-green-400">Active</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Total Contests Data:</span><span className="font-medium">{selectedUser.data.ratingData?.length || 0}</span></div>
                                    </div>
                                </div>
                            </div>
                            {(selectedUser.data.ratingData && selectedUser.data.ratingData.length > 0) ? (
                                <div className="mb-6">
                                    <h3 className="text-md sm:text-lg font-semibold mb-3 text-purple-400 flex items-center"><TableCellsIcon className="h-5 w-5 mr-2" />Contest History</h3>
                                    <div className="bg-slate-700/30 rounded-lg p-2 sm:p-4 max-h-60 sm:max-h-64 overflow-y-auto custom-scrollbar">
                                        <div className="space-y-2">
                                            {selectedUser.data.ratingData.map((contest, i) => (
                                                <div key={contest.code + (contest.name || '') + i} /* More unique key */ className={`p-2 sm:p-3 rounded-md border-l-4 ${contest.penalised_in?.length > 0 ? 'bg-red-900/20 border-red-400' : 'bg-slate-600/30 border-blue-400'}`}>
                                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                                        <div className="flex-1 min-w-0"><h4 className="font-medium text-sm truncate" title={contest.name}>{contest.name}</h4><p className="text-xs text-slate-400">{contest.code}</p></div>
                                                        <div className="text-right text-xs whitespace-nowrap">
                                                            <div className="font-medium">Rating: {contest.rating}</div>
                                                            <div className="text-slate-400">Rank: {contest.rank}</div>
                                                            {contest.penalised_in?.length > 0 && (<div className="text-red-300 font-medium">⚠ Penalized</div>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (<div className="text-center py-8 text-slate-500"><TableCellsIcon className="h-10 w-10 mx-auto mb-2 opacity-50" /><p>No contest history.</p></div>)}
                            <HeatmapDisplay heatMapData={selectedUser.data.heatMap} />
                        </div>
                        <div className="p-4 border-t border-slate-700 flex justify-between items-center sticky bottom-0 bg-slate-800 z-10 rounded-b-lg">
                            <div className="text-xs text-slate-400">Profile data as of current fetch</div>
                            <button onClick={closeModal} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
            <footer className="mt-12 border-t border-slate-700 pt-8">
                <div className="text-center space-y-6">
                    <div><h3 className="text-lg font-semibold mb-4 text-slate-300">Connect With Me</h3>
                        <div className="flex justify-center space-x-6">
                            <a href="https://www.linkedin.com/in/ayan-pandey-b66067296/" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" aria-label="LinkedIn Profile">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            </a>
                            <a href="https://github.com/ayanpandit" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-700 hover:bg-gray-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" aria-label="GitHub Profile">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                            </a>
                            {/* Add Instagram or other links here if you have them */}
                        </div>
                    </div>
                    <div><button onClick={() => window.open('https://forms.gle/yourSuggestionFormLink', '_blank')} /* Replace with your actual Google Form link */ className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"><svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Send Suggestions</button></div>
                    <div className="text-sm text-slate-500 border-t border-slate-700 pt-4"><p>🌟 Built with passion and a pinch of late-night coffee — by Ayan Pandey 2023-27 </p>
                        <p>© 2025 CodeChef Profile Analyzer. </p></div>
                </div>
            </footer>
        </div>
    );
};

export default CodeChefProfileAnalyzer;