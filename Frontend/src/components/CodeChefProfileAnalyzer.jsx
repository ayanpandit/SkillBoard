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
    InformationCircleIcon,
    StarIcon, // Using one from Heroicons directly for stars
} from '@heroicons/react/24/outline'; // Using Heroicons v2

// API Configuration
const API_CONFIG = {
    host: 'localhost',
    port: '5000',
    protocol: 'http',
};
const API_BASE_URL = `${API_CONFIG.protocol}://${API_CONFIG.host}:${API_CONFIG.port}`;

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
    // Simplified: Removed contestNumberSearch for now to reduce complexity
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
        let colorClass = 'text-yellow-400'; // Default to yellow
        if (starCount === 1) colorClass = 'text-gray-400';
        else if (starCount === 2) colorClass = 'text-green-500';
        else if (starCount === 3) colorClass = 'text-blue-500';
        // Add more if needed based on CodeChef star colors
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
        console.log(`Fetching data from: ${url} with options:`, options.method || 'GET');
        try {
            const response = await fetch(url, options);
            console.log('Response Status:', response.status);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const textResponse = await response.text();
                console.error("Non-JSON response:", textResponse);
                throw new Error(`Server returned non-JSON response: ${textResponse.substring(0,100)}...`);
            }
            const data = await response.json();
            console.log('Response Data:', data);
            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error("API Error in fetchData:", error);
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
             // Ensure result is an array for consistency if API returns single object
            const resultsArray = Array.isArray(result) ? result : [result];
            if (resultsArray[0] && resultsArray[0].username) { // Basic check for valid structure
                setAllResults(resultsArray);
                setFilteredResults(resultsArray);
                showNotification(`Profile for ${resultsArray[0].username} fetched.`, 'success');
            } else {
                console.error("Fetched single user data is not in expected format:", result);
                showNotification('Received malformed data for single user.', 'error');
                setAllResults([]);
                setFilteredResults([]);
            }
        } else {
             setAllResults([]);
             setFilteredResults([]);
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
            const validResults = results.filter(r => r && r.username); // Ensure basic structure
            setAllResults(validResults);
            setFilteredResults(validResults);
            const successCount = validResults.filter(r => r.status === 'success').length;
            showNotification(`${successCount} valid profiles processed out of ${results.length}.`, 'success');
            if(validResults.length !== results.length){
                showNotification(`Some profiles in bulk upload were malformed.`, 'error');
            }
        } else {
            console.error("Fetched bulk user data is not an array or is null:", results);
            showNotification('Received malformed data for bulk users or no data.', 'error');
            setAllResults([]);
            setFilteredResults([]);
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
    const applyFiltersAndSort = useCallback(() => {
        let tempResults = [...allResults];

        if (usernameSearch.trim()) {
            const searchTermLower = usernameSearch.toLowerCase().trim();
            tempResults = tempResults.filter(result => {
                if (!result || typeof result.username !== 'string') return false; // Guard against undefined/null result or username
                const usernameMatch = result.username.toLowerCase().includes(searchTermLower);
                // Simplified: assuming 'name' field might exist directly in result.data
                const nameMatch = result.data?.name?.toLowerCase().includes(searchTermLower);
                return usernameMatch || nameMatch;
            });
        }

        if (sortConfig.key) {
            tempResults.sort((a, b) => {
                let valA = getNestedValue(a, sortConfig.key);
                let valB = getNestedValue(b, sortConfig.key);

                if (sortConfig.key === 'cheatCount') {
                    valA = calculateCheatCount(a.data);
                    valB = calculateCheatCount(b.data);
                }

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
                } else {
                    valA = String(valA == null ? '' : valA).toLowerCase(); // Handle null/undefined
                    valB = String(valB == null ? '' : valB).toLowerCase(); // Handle null/undefined
                    if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
            });
        }
        setFilteredResults(tempResults);
    }, [allResults, usernameSearch, sortConfig]);


    const getNestedValue = (obj, path) => {
        if (!obj || !path) return null;
        if (path === 'cheatCount') return calculateCheatCount(obj.data);

        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (typeof current !== 'object' || current === null || !(key in current)) {
                return (path.includes('Rating') || path.includes('Contests') || path.includes('Rank')) ? 0 : 'N/A';
            }
            current = current[key];
        }
        return current;
    };

    const calculateCheatCount = (userData) => {
        if (!userData || !Array.isArray(userData.ratingData)) return 0;
        return userData.ratingData.reduce((sum, contest) => {
            if (contest && Array.isArray(contest.penalised_in)) {
                return sum + contest.penalised_in.length;
            }
            return sum;
        }, 0);
    };

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
    }, [applyFiltersAndSort]);

    // --- Export Functions (Simplified CSV Structure) ---
    const exportToCSV = (dataToExport, filename) => {
        if (!dataToExport || dataToExport.length === 0) {
            showNotification('No data to export.', 'error');
            return;
        }
        const headers = [
            'Username', 'Full Name', 'Rating', 'Stars', 'Contests', 'Cheat Count', 'Max Rating'
        ];
        const csvRows = [
            headers.join(','),
            ...dataToExport.map(row => {
                if (!row || !row.username) return ''; // Skip malformed rows
                const name = row.data?.name || 'N/A';
                const cheatCount = calculateCheatCount(row.data);
                return [
                    `"${row.username}"`, `"${name}"`, row.data?.currentRating || 'N/A',
                    `"${row.data?.stars || 'N/A'}"`, row.data?.contestsGiven || 0, cheatCount,
                    row.data?.highestRating || 'N/A'
                ].filter(Boolean).join(','); // Filter(Boolean) to remove empty strings if any field is missing completely
            }).filter(row => row) // remove empty rows
        ];

        if (csvRows.length <= 1) { // Only headers or no valid data
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

    const exportAllData = () => exportToCSV(filteredResults, 'codechef_profiles_all.csv');

    // --- Modal ---
    const openModal = (user) => {
        if (!user || !user.data) { // Guard clause
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
        setFilteredResults([]);
        setUsernameSearch('');
        setSortConfig({ key: null, direction: 'ascending' });
        if (fileInputRef.current) fileInputRef.current.value = "";
        showNotification('Analyzer reset.', 'success', 3000);
    };

    // Table Columns Definition
    const columns = [
        { key: 's.no', label: 'S.No', sortable: false, render: (item, index) => index + 1 },
        { key: 'username', label: 'Username', sortable: true, render: (item) => <span className="font-semibold text-indigo-400">{item.username}</span> },
        { key: 'data.name', label: 'Full Name', sortable: true, render: (item) => item.data?.name || 'N/A' },
        { key: 'data.currentRating', label: 'Rating', sortable: true, render: (item) => item.data?.currentRating || 'N/A' },
        { key: 'data.stars', label: 'Stars', sortable: true, render: (item) => getStarBadge(item.data?.stars) },
        { key: 'data.contestsGiven', label: 'Contests', sortable: true, render: (item) => item.data?.contestsGiven || 0 },
        { key: 'cheatCount', label: 'Cheats', sortable: true, render: (item) => {
            const count = calculateCheatCount(item.data);
            return count > 0 ? <span className="px-2 py-0.5 text-xs font-semibold text-red-100 bg-red-600 rounded-full">{count}</span> : <span className="text-green-400">0</span>;
        }},
        { key: 'data.highestRating', label: 'Max Rating', sortable: true, render: (item) => item.data?.highestRating || 'N/A' },
    ];

    useEffect(() => { // Log for debugging data structure
        if(allResults.length > 0) {
            console.log("Current allResults (sample):", allResults[0]);
        }
    }, [allResults]);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 p-4 md:p-8">
            <div className="container mx-auto max-w-6xl">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        CodeChef Profile Analyzer
                    </h1>
                    <p className="text-slate-400 text-sm">Analyze CodeChef profiles</p>
                </header>

                {/* Notifications */}
                {errorMessage && (
                    <div className="fixed top-5 right-5 bg-red-600 text-white p-3 rounded-md shadow-lg z-50 flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" /> {errorMessage}
                        <button onClick={() => setErrorMessage('')} className="ml-3"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                )}
                {successMessage && (
                    <div className="fixed top-5 right-5 bg-green-600 text-white p-3 rounded-md shadow-lg z-50 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" /> {successMessage}
                        <button onClick={() => setSuccessMessage('')} className="ml-3"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                )}

                <section className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
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
                                    {fileName || "Choose CSV/Excel"}
                                </label>
                                <input type="file" id="csvFile" ref={fileInputRef} accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
                                <button onClick={processBulkUpload} disabled={loading || !file} className="w-full p-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-md disabled:opacity-50 flex items-center justify-center"><ArrowUpTrayIcon className="h-5 w-5 mr-1" />Process</button>
                            </div>
                        </div>
                    </div>
                </section>

                {(allResults.length > 0 || loading) && (
                    <section className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
                        <h2 className="text-lg font-semibold mb-3 flex items-center"><FunnelIcon className="h-5 w-5 mr-1 text-orange-400" />Filter & Export</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label htmlFor="username-s" className="block text-xs text-slate-400 mb-0.5">Search Username/Name</label>
                                <input id="username-s" type="text" value={usernameSearch} onChange={(e) => setUsernameSearch(e.target.value)} placeholder="Filter by name..." className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-orange-500" />
                            </div>
                            <div className="flex space-x-2 sm:col-start-2 md:col-start-3 justify-end">
                                <button onClick={exportAllData} disabled={loading || filteredResults.length === 0} className="p-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50 flex items-center"><ArrowDownTrayIcon className="h-5 w-5 mr-1" />Export</button>
                                <button onClick={handleRefresh} className="p-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md flex items-center"><ArrowPathIcon className="h-5 w-5 mr-1" />Reset</button>
                            </div>
                        </div>
                         {loading && <div className="mt-3 text-center text-teal-400">Loading...</div>}
                         <div className="mt-2 text-xs text-slate-500">
                            {allResults.length > 0 && `Showing ${filteredResults.length} of ${allResults.length} results.`}
                        </div>
                    </section>
                )}

                {filteredResults.length > 0 && (
                    <section className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-700">
                                    <tr>
                                        {columns.map(col => (
                                            <th key={col.key} scope="col" className="px-4 py-3" onClick={() => col.sortable && requestSort(col.key)}>
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
                                        if (!item || !item.username) return null; // Skip rendering if item is malformed
                                        return (
                                            <tr key={item.username + index} onClick={() => item.data && openModal(item)}
                                                className={`hover:bg-slate-700/70 transition-colors ${item.data ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}>
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
                        <TableCellsIcon className="h-12 w-12 mx-auto mb-3"/>
                        <p>No data. Use search or upload to begin.</p>
                    </div>
                )}
            </div>

            {/* Modal (Simplified) */}
            {showModal && selectedUser && selectedUser.data && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 text-slate-200 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-indigo-400">{selectedUser.username}</h2>
                            <button onClick={closeModal} className="p-1 rounded-full hover:bg-slate-700"><XMarkIcon className="h-5 w-5"/></button>
                        </div>
                        <div className="p-4 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <p><strong>Full Name:</strong> {selectedUser.data.name || 'N/A'}</p>
                                <p><strong>Current Rating:</strong> {selectedUser.data.currentRating || 'N/A'}</p>
                                <p><strong>Stars:</strong> {getStarBadge(selectedUser.data.stars) || 'N/A'}</p>
                                <p><strong>Highest Rating:</strong> {selectedUser.data.highestRating || 'N/A'}</p>
                                <p><strong>Total Contests:</strong> {selectedUser.data.contestsGiven || 0}</p>
                                <p><strong>Cheating Incidents:</strong> {calculateCheatCount(selectedUser.data)}</p>
                                <p><strong>Global Rank:</strong> {selectedUser.data.globalRank || 'N/A'}</p>
                                <p><strong>Country Rank:</strong> {selectedUser.data.countryRank || 'N/A'}</p>
                            </div>
                            {selectedUser.data.ratingData && selectedUser.data.ratingData.length > 0 && (
                                <div>
                                    <h3 className="text-md font-semibold mb-1 mt-3">Recent Contests:</h3>
                                    <ul className="list-disc list-inside pl-1 max-h-48 overflow-y-auto bg-slate-700/50 p-2 rounded-md text-xs space-y-1">
                                        {selectedUser.data.ratingData.slice(0, 10).map((contest, i) => ( // Show top 10
                                            <li key={i} className={contest.penalised_in?.length > 0 ? 'text-red-400' : ''}>
                                                {contest.name} ({contest.code}) - Rating: {contest.rating} {contest.penalised_in?.length > 0 ? '(Penalized)' : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {!selectedUser.data.ratingData || selectedUser.data.ratingData.length === 0 && (
                                <p className="text-slate-500 text-sm mt-2">No contest history data found.</p>
                             )}
                        </div>
                         <div className="p-3 border-t border-slate-700 text-right">
                            <button onClick={closeModal} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeChefProfileAnalyzer;