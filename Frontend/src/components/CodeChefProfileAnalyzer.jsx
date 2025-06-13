// src/components/CodeChefProfileAnalyzer.jsx

// You MUST install react-window for this component to work:
// npm install react-window
// or
// yarn add react-window

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';

import {
    MagnifyingGlassIcon, ArrowUpTrayIcon, UsersIcon, UserIcon, TableCellsIcon,
    ArrowDownTrayIcon, ExclamationCircleIcon, CheckCircleIcon, XMarkIcon, ArrowPathIcon,
    FunnelIcon, ChevronUpIcon, ChevronDownIcon, InformationCircleIcon, StarIcon as HeroStarIcon,
} from '@heroicons/react/24/outline';

// API Configuration
// For production, use environment variables: process.env.REACT_APP_API_URL
const API_BASE_URL = "https://codechefprofileanalyzerbackendnode.onrender.com";

// Debounce utility
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

// --- Memoized Child Components ---

const SimpleHeatmapCell = memo(({ date, value, maxValue }) => {
    const intensity = maxValue > 0 ? Math.min(1, value / maxValue) : 0;
    const bgColor = value > 0
        ? intensity > 0.66 ? 'bg-green-700'
        : intensity > 0.33 ? 'bg-green-500' : 'bg-green-400'
        : 'bg-slate-600';
    return <div className={`w-3 h-3 ${bgColor} rounded-sm`} title={`${date}: ${value} submissions`} />;
});

const HeatmapDisplay = memo(({ heatMapData }) => {
    if (!heatMapData || heatMapData.length === 0) return <p className="text-slate-500 text-sm">No heatmap data available.</p>;

    const dataByYearMonth = [...heatMapData]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .reduce((acc, curr) => {
            const date = new Date(curr.date);
            const yearMonth = `${date.toLocaleString('default', { month: 'long', timeZone: 'UTC' })} ${date.getUTCFullYear()}`;
            if (!acc[yearMonth]) acc[yearMonth] = [];
            acc[yearMonth].push(curr);
            return acc;
        }, {});
    
    const maxValue = Math.max(...heatMapData.map(d => d.value), 0);

    return (
        <div>
            <h3 className="text-md font-semibold mb-2 mt-3">Activity Heatmap</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 bg-slate-700/30 p-2 rounded-md">
                {Object.entries(dataByYearMonth).map(([yearMonth, monthData]) => (
                    <div key={yearMonth}>
                        <h4 className="text-xs font-medium text-slate-400 mb-1.5">{yearMonth}</h4>
                        <div className="flex flex-wrap gap-0.5">
                            {monthData.map(item => <SimpleHeatmapCell key={item.date} {...item} maxValue={maxValue} />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// The TableRow component is now designed to be rendered by react-window.
// It receives `index`, `style` (for positioning), and `data` (an object containing our props).
const TableRow = memo(({ index, style, data }) => {
    const { items, columns, specificContestSearch, checkContestParticipation, openModal } = data;
    const item = items[index];

    if (!item?.username) return null;

    let participationClass = '';
    if (specificContestSearch.trim() && item.status === 'success' && item.data) {
        const participated = checkContestParticipation(item.data, specificContestSearch.trim());
        if (participated === true) participationClass = 'bg-green-800/20 hover:bg-green-700/30';
        else if (participated === false) participationClass = 'bg-red-800/20 hover:bg-red-700/30';
    }

    return (
        <div style={style}
             onClick={() => item.status === 'success' && item.data && openModal(item)}
             className={`flex items-center hover:bg-slate-700/50 transition-colors duration-150 border-b border-slate-700 ${item.status === 'success' ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'} ${participationClass}`}>
            {columns.map(col => (
                <div key={col.key} className="px-4 py-3 whitespace-nowrap" style={{ width: col.width, flexShrink: 0 }}>
                    {col.render(item, index)}
                </div>
            ))}
        </div>
    );
});

// --- Main Component ---

const CodeChefProfileAnalyzer = () => {
    // --- State Management ---
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
    const tableContainerRef = useRef(null); // For react-window width

    // --- Core Functions (memoized with useCallback) ---

    const showNotification = useCallback((message, type = 'error', duration = 5000) => {
        if (type === 'error') setErrorMessage(message);
        else setSuccessMessage(message);
        setTimeout(() => { setErrorMessage(''); setSuccessMessage(''); }, duration);
    }, []);
    
    const fetchData = useCallback(async (url, options = {}) => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
                throw new Error(errorData.error || errorData.message);
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

    const processBulkUpload = useCallback(async () => {
        if (!file) return showNotification('Please select a CSV/Excel file.', 'error');
        const formData = new FormData();
        formData.append('file', file);
        const results = await fetchData(`${API_BASE_URL}/fetch-profiles`, { method: 'POST', body: formData });
        if (results && Array.isArray(results)) {
            const validResults = results.filter(r => r && r.username);
            setAllResults(validResults);
            const successCount = validResults.filter(r => r.status === 'success').length;
            showNotification(`${successCount} profiles fetched, ${validResults.length - successCount} failed or not found.`, 'success', 7000);
        } else if (results !== null) {
            showNotification('Received malformed data for bulk users.', 'error');
            setAllResults([]);
        }
    }, [file, fetchData, showNotification]);

    const searchSingleUser = useCallback(async () => {
        if (!singleUsername.trim()) return showNotification('Please enter a CodeChef username.', 'error');
        const result = await fetchData(`${API_BASE_URL}/fetch-profile?username=${encodeURIComponent(singleUsername.trim())}`);
        if (result) {
            const resArray = Array.isArray(result) ? result : [result];
            setAllResults(resArray);
            if (resArray[0]?.status === 'success') showNotification(`Profile for ${resArray[0].username} fetched.`, 'success');
            else showNotification(resArray[0]?.message || 'Could not fetch profile.', 'error');
        } else {
            setAllResults([]);
        }
    }, [singleUsername, fetchData, showNotification]);
    
    const calculateCheatCount = useCallback((userData) => {
        return userData?.ratingData?.reduce((sum, contest) => sum + (contest.penalised_in?.length > 0 ? 1 : 0), 0) ?? 0;
    }, []);

    const getNestedValue = useCallback((obj, path) => {
        if (path === 'cheatCount') return calculateCheatCount(obj?.data);
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            current = current?.[key];
        }
        const isNumeric = path.includes('Rating') || path.includes('contestsGiven') || path.includes('Rank');
        if (current === null || current === undefined) return isNumeric ? 0 : 'N/A';
        return current;
    }, [calculateCheatCount]);

    const applyFiltersAndSort = useCallback(() => {
        let tempResults = [...allResults];
        if (usernameSearch.trim()) {
            const searchTerm = usernameSearch.toLowerCase().trim();
            tempResults = tempResults.filter(r => r.username.toLowerCase().includes(searchTerm) || r.data?.name?.toLowerCase().includes(searchTerm));
        }
        if (sortConfig.key) {
            tempResults.sort((a, b) => {
                const valA = getNestedValue(a, sortConfig.key);
                const valB = getNestedValue(b, sortConfig.key);
                const isNumeric = sortConfig.key.includes('Rating') || sortConfig.key.includes('contestsGiven') || sortConfig.key === 'cheatCount';
                
                if (isNumeric) {
                    const numA = Number(valA) || 0;
                    const numB = Number(valB) || 0;
                    return sortConfig.direction === 'ascending' ? numA - numB : numB - numA;
                } else {
                    const strA = String(valA ?? '').toLowerCase();
                    const strB = String(valB ?? '').toLowerCase();
                    return sortConfig.direction === 'ascending' ? strA.localeCompare(strB) : strB.localeCompare(strA);
                }
            });
        }
        setFilteredResults(tempResults);
    }, [allResults, usernameSearch, sortConfig, getNestedValue]);

    useEffect(() => {
        const debouncedFilter = debounce(() => applyFiltersAndSort(), 300);
        debouncedFilter();
    }, [allResults, usernameSearch, sortConfig, applyFiltersAndSort]);
    
    // --- UI Handlers ---
    const requestSort = useCallback((key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    }, []);

    const handleFileChange = e => {
        const file = e.target.files[0];
        setFile(file);
        setFileName(file ? file.name : '');
    };
    
    const handleRefresh = useCallback(() => {
        setSingleUsername(''); setFile(null); setFileName('');
        setAllResults([]); setUsernameSearch(''); setSpecificContestSearch('');
        setSortConfig({ key: null, direction: 'ascending' });
        if (fileInputRef.current) fileInputRef.current.value = "";
        showNotification('Analyzer reset.', 'success', 3000);
    }, [showNotification]);
    
    const openModal = useCallback(user => {
        if (user?.status === 'success' && user.data) {
            setSelectedUser(user);
            setShowModal(true);
        } else {
            showNotification('Cannot open details. Profile data is missing or failed to load.', 'error');
        }
    }, [showNotification]);

    const closeModal = useCallback(() => setShowModal(false), []);
    
    // --- Data Utilities ---
    const getStarBadge = useCallback(starsStr => {
        if (!starsStr || starsStr === 'N/A') return <span className="text-gray-400">N/A</span>;
        const starCount = parseInt(String(starsStr).charAt(0), 10);
        if (isNaN(starCount)) return <span className="text-gray-400">N/A</span>;
        const colors = ['gray-400', 'green-500', 'blue-500', 'purple-500', 'orange-500', 'red-500', 'red-500'];
        const colorClass = `text-${colors[starCount - 1] || 'yellow-400'}`;
        return <span className={`font-bold ${colorClass} flex items-center`}>{starCount} <HeroStarIcon className="h-4 w-4 ml-1" /></span>;
    }, []);

    const checkContestParticipation = useCallback((userData, contestNum) => {
        if (!userData?.ratingData || !contestNum) return null;
        const contestRegex = new RegExp(`(starters|start)\\s*${contestNum.trim()}`, 'i');
        return userData.ratingData.some(c => contestRegex.test(c.name) || c.code.includes(`START${contestNum.trim()}`));
    }, []);
    
    // --- Table Column Definitions (memoized) ---
    const columns = useMemo(() => [
        { key: 's.no', label: 'S.No', sortable: false, width: 60, render: (item, index) => <div className="text-center">{index + 1}</div> },
        { key: 'username', label: 'Username', sortable: true, width: 180, render: item => <span className="font-semibold text-indigo-400">{item.username}</span> },
        { key: 'status', label: 'Status', sortable: true, width: 80, render: item => item.status === 'success' ? <CheckCircleIcon className="h-5 w-5 text-green-400 mx-auto" title="Success" /> : <ExclamationCircleIcon className="h-5 w-5 text-red-400 mx-auto" title={item.message || "Error"} /> },
        { key: 'data.name', label: 'Full Name', sortable: true, width: 220, render: item => item.status === 'success' ? (getNestedValue(item, 'data.name') || 'N/A') : <span className="text-slate-500 italic">{item.message || 'N/A'}</span> },
        { key: 'data.currentRating', label: 'Rating', sortable: true, width: 100, render: item => item.status === 'success' ? getNestedValue(item, 'data.currentRating') : <span className="text-slate-500">N/A</span> },
        { key: 'data.stars', label: 'Stars', sortable: true, width: 100, render: item => item.status === 'success' ? getStarBadge(getNestedValue(item, 'data.stars')) : <span className="text-slate-500">N/A</span> },
        { key: 'data.contestsGiven', label: 'Contests', sortable: true, width: 100, render: item => item.status === 'success' ? getNestedValue(item, 'data.contestsGiven') : <span className="text-slate-500">N/A</span> },
        { key: 'cheatCount', label: 'Violations', sortable: true, width: 100, render: item => item.status === 'success' ? (calculateCheatCount(item.data) > 0 ? <span className="px-2 py-0.5 text-xs font-semibold text-red-100 bg-red-600 rounded-full">{calculateCheatCount(item.data)}</span> : <span className="text-green-400">0</span>) : <span className="text-slate-500">N/A</span> },
        { key: 'data.highestRating', label: 'Max Rating', sortable: true, width: 120, render: item => item.status === 'success' ? getNestedValue(item, 'data.highestRating') : <span className="text-slate-500">N/A</span> },
        { key: 'data.globalRank', label: 'Global Rank', sortable: true, width: 120, render: item => item.status === 'success' ? (getNestedValue(item, 'data.globalRank') || 'N/A') : <span className="text-slate-500">N/A</span> },
    ], [getNestedValue, getStarBadge, calculateCheatCount]);
    
    const totalColumnWidth = useMemo(() => columns.reduce((acc, col) => acc + col.width, 0), [columns]);


    // --- JSX Render ---
    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 p-4 md:p-8 font-sans">
            <div className="container mx-auto max-w-full px-2">
                <header className="text-center mb-8 pt-24">
                    <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">CodeChef Profile Analyzer</h1>
                    <p className="text-slate-400">Analyze profiles, contest participation, and activity at scale.</p>
                </header>

                {/* Notifications */}
                {errorMessage && <div className="fixed top-5 right-5 bg-red-600 text-white p-3 rounded-md shadow-lg z-[100] flex items-center"><ExclamationCircleIcon className="h-5 w-5 mr-2" />{errorMessage}<button onClick={() => setErrorMessage('')} className="ml-3 p-1 rounded-full hover:bg-red-700"><XMarkIcon className="h-4 w-4" /></button></div>}
                {successMessage && <div className="fixed top-5 right-5 bg-green-600 text-white p-3 rounded-md shadow-lg z-[100] flex items-center"><CheckCircleIcon className="h-5 w-5 mr-2" />{successMessage}<button onClick={() => setSuccessMessage('')} className="ml-3 p-1 rounded-full hover:bg-green-700"><XMarkIcon className="h-4 w-4" /></button></div>}

                {/* Input Section */}
                <section className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
                    {/* ... (input fields JSX is unchanged) ... */}
                </section>
                
                {/* Filter and Export Section */}
                {(allResults.length > 0 || loading) && (
                    <section className="mb-6 p-4 bg-slate-800 rounded-lg shadow-xl">
                        {/* ... (filter/export JSX is unchanged) ... */}
                    </section>
                )}

                {/* --- VIRTUALIZED TABLE --- */}
                {filteredResults.length > 0 && (
                    <section ref={tableContainerRef} className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
                        {/* Table Header */}
                        <div className="text-xs text-slate-400 uppercase bg-slate-700/60 flex sticky top-0 z-10">
                            {columns.map(col => (
                                <div key={col.key} onClick={() => col.sortable && requestSort(col.key)}
                                    className={`px-4 py-3 flex items-center ${col.sortable ? 'cursor-pointer hover:text-indigo-400' : ''}`}
                                    style={{ width: col.width, flexShrink: 0 }}>
                                    {col.label}
                                    {col.sortable && sortConfig.key === col.key && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)}
                                </div>
                            ))}
                        </div>
                        {/* Table Body (Virtualized List) */}
                        <List
                            height={500} // Adjust height as needed
                            itemCount={filteredResults.length}
                            itemSize={65} // Height of each row in pixels
                            width={tableContainerRef.current?.clientWidth || '100%'}
                            itemData={{
                                items: filteredResults,
                                columns,
                                specificContestSearch,
                                checkContestParticipation,
                                openModal
                            }}
                        >
                            {TableRow}
                        </List>
                    </section>
                )}
                
                {allResults.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500"><TableCellsIcon className="h-12 w-12 mx-auto mb-3" /><p>No data to display. Use search or upload to begin.</p></div>
                )}
            </div>

            {/* Modal */}
            {showModal && selectedUser?.data && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-slate-800 text-slate-200 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                       {/* ... (Modal JSX is unchanged, it will work as before) ... */}
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-indigo-400">{selectedUser.username}</h2>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-700"><XMarkIcon className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                           <HeatmapDisplay heatMapData={selectedUser.data.heatMap} />
                           {/* ... other modal content ... */}
                        </div>
                    </div>
                </div>
            )}
            
            <footer id="contact-section" className="mt-12 border-t border-slate-700 pt-8">
                 {/* ... (Footer JSX is unchanged) ... */}
            </footer>
        </div>
    );
};

export default CodeChefProfileAnalyzer;