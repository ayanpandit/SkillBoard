import React, { useState, useCallback, useMemo, Fragment } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
    Search, UploadCloud, X, Loader2, UserCircle, BarChart2, CalendarDays,
    Code, Medal, Trophy, Activity, ExternalLink, ChevronDown, ChevronUp,
    Brain, Briefcase, MapPin, Star, CheckCircle, AlertTriangle,
    Download, Filter, RotateCcw
} from 'lucide-react';

const API_URL = 'http://localhost:3000/api/leetcode';

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
    // Allow 0 as a valid value
    return (value === undefined || value === null) ? defaultValue : value;
};


function LeetCodeProfileAnalyzer() {
    const [usernameInput, setUsernameInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [totalToProcess, setTotalToProcess] = useState(0);
    const [selectedHeatmapYear, setSelectedHeatmapYear] = useState(new Date().getFullYear());

    const [sortConfig, setSortConfig] = useState({ key: 'sno', direction: 'ascending' });
    const [filterUsername, setFilterUsername] = useState('');
    const [filterRealName, setFilterRealName] = useState('');
    const [weeklyContestQuery, setWeeklyContestQuery] = useState('');
    const [biweeklyContestQuery, setBiweeklyContestQuery] = useState('');
    const [contestHighlights, setContestHighlights] = useState({});
    const [lastSearchedUsernames, setLastSearchedUsernames] = useState([]);
    const [lastSearchedFile, setLastSearchedFile] = useState(null);


    const fetchUserData = useCallback(async (username) => { // Removed year from here, it's used globally
        try {
            const response = await axios.post(API_URL, { username });
            return response.data;
        } catch (err) {
            console.error(`Error fetching data for ${username}:`, err);
            const errorMessage = err.response?.data?.error || err.message || `Failed to fetch data for ${username}.`;
            return {
                username, error: errorMessage,
                profile: { ranking: 'N/A', realName: 'N/A', userAvatar: null, location: 'N/A', school: 'N/A' },
                stats: { All: { solved: 0, total: 0, submissions: 0 }, Easy: {}, Medium: {}, Hard: {} },
                activity: { totalActiveDays: 0, streak: 0, activeYears: 'N/A' },
                submissions: [], languages: [], tags: [],
                badges: { username: username, earned: [], upcoming: [], summary: { totalEarned: 0, level: 'N/A', totalUpcoming: 0, totalPossible: 0, categories: {} }, error: errorMessage },
                contests: { summary: { totalAttended: 0, weeklyAttended: 0, biweeklyAttended: 0 }, history: [] },
                heatmap: { error: "Data fetch failed" }
            };
        }
    }, []);

    const processUsernames = async (usernamesToFetch) => {
        setIsLoading(true); setError(''); setSearchResults([]);
        setTotalToProcess(usernamesToFetch.length); setProcessingProgress(0);
        let results = [];
        for (let i = 0; i < usernamesToFetch.length; i++) {
            if (usernamesToFetch[i]) {
                results.push(await fetchUserData(usernamesToFetch[i]));
            }
            setProcessingProgress(prev => prev + 1);
        }
        setSearchResults(results);
        setIsLoading(false);
        setContestHighlights({}); // Reset highlights on new search
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
        setLastSearchedFile(file); // Store the file for refresh
        setLastSearchedUsernames([]); // Clear single username search memory
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
                // setLastSearchedUsernames(usernames); // This is now handled by storing the file
                await processUsernames(usernames);
            } catch (err) { console.error("File processing error:", err); setError('Failed to process file.'); setIsLoading(false); }
        };
        reader.readAsArrayBuffer(file); event.target.value = null;
    };

    const handleRefresh = async () => {
        if (lastSearchedFile) {
            // Re-process the last file
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
                    await processUsernames(usernames);
                } catch (err) { console.error("File processing error during refresh:", err); setError('Failed to re-process file.'); setIsLoading(false); }
            };
            reader.readAsArrayBuffer(lastSearchedFile);
        } else if (lastSearchedUsernames.length > 0) {
            await processUsernames(lastSearchedUsernames);
        } else {
            setError("No previous search to refresh. Please perform a search first.");
        }
    };
    
    const HeatmapGrid = ({ heatmapData, year }) => {
        if (!heatmapData || heatmapData.error) {
            return <p className="text-slate-400 text-sm">{heatmapData?.error || "No heatmap data available."}</p>;
        }
        if (Object.keys(heatmapData).length === 0 && !heatmapData.note) {
            return <p className="text-slate-400 text-sm">No submission activity recorded for {year}.</p>;
        }
        if (heatmapData.note) {
             return <p className="text-slate-400 text-sm">{heatmapData.note}</p>;
        }

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
        const firstDayOfMonth = (m, y) => new Date(y, m, 1).getDay(); 

        const submissionsByDate = {};
        Object.entries(heatmapData).forEach(([timestamp, count]) => {
            const date = new Date(parseInt(timestamp) * 1000);
            if (date.getFullYear() === year) {
                 const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                 submissionsByDate[dateString] = count;
            }
        });
        
        const getIntensityColor = (count) => {
            if (count === 0) return 'bg-slate-700'; 
            if (count <= 2) return 'bg-green-700';
            if (count <= 5) return 'bg-green-600';
            if (count <= 10) return 'bg-green-500';
            return 'bg-green-400'; 
        };

        return (
            <div className="space-y-4 text-xs">
                <div className="grid grid-cols-7 gap-px text-center mb-1 text-slate-400">
                    <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
                {monthNames.map((monthName, monthIndex) => (
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
                ))}
            </div>
        );
    };

    const ModalContent = ({ user }) => {
        if (!user) return null;
        const u = user;
        const isFullError = u.error && (!u.profile || getNestedValue(u, 'profile.realName') === 'N/A' && (getNestedValue(u, 'stats.All.solved', 0) === 0));

        if (isFullError) {
            return (<div className="text-center p-8"><AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-red-300 mb-2">Error Fetching Data</h2>
                    <p className="text-slate-200 text-lg">{u.username}</p><p className="text-slate-300 mt-3 text-sm">{u.error}</p></div>);
        }
        
        const formatLocation = (locationStr) => {
            if (!locationStr || locationStr === 'N/A') return 'N/A';
            const parts = locationStr.split('%').map(p => p.trim()).filter(p => p.length > 0);
            if (parts.length === 0) return 'N/A';
            if (parts.length === 3) return `${parts[2]}, ${parts[1]}, ${parts[0]}`;
            if (parts.length === 2) return `${parts[1]}, ${parts[0]}`;
            return parts.join(', ');
        };

        return (<>
            <div className="flex flex-col sm:flex-row items-center mb-6 pb-4 border-b border-slate-700">
                {u.profile.userAvatar ? <img src={u.profile.userAvatar} alt={u.username} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mr-0 sm:mr-6 mb-3 sm:mb-0 border-2 border-sky-500" />
                : <UserCircle className="w-20 h-20 sm:w-24 sm:h-24 text-slate-500 mr-0 sm:mr-6 mb-3 sm:mb-0" />}
                <div className="text-center sm:text-left flex-grow"><h2 className="text-3xl lg:text-4xl font-bold text-sky-400 break-all">{u.username}</h2>
                    <p className="text-lg text-slate-300">{getNestedValue(u, 'profile.realName') !== 'N/A' ? getNestedValue(u, 'profile.realName') : ''}</p>
                    <a href={`https://leetcode.com/${u.username}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center mt-1">View LeetCode Profile <ExternalLink size={14} className="ml-1.5" /></a></div></div>
            {u.error && (getNestedValue(u, 'profile.realName') !== 'N/A' || getNestedValue(u, 'stats.All.solved', 0) > 0) && (<div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-700 rounded-md text-yellow-300 text-sm">
                    <p><strong>Note:</strong> Some data might be incomplete. <span className="italic">{u.error}</span></p></div>)}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard title="Ranking" value={getNestedValue(u, 'profile.ranking')} icon={Star} color="text-yellow-400" />
                <StatCard title="Reputation" value={getNestedValue(u, 'profile.reputation')} icon={Trophy} color="text-amber-400"/>
                <StatCard title="Total Submissions" value={`${getNestedValue(u, 'stats.All.solved', 0)} / ${getNestedValue(u, 'stats.All.total', 'N/A')}`} icon={CheckCircle} color="text-green-400"/>
                <StatCard title="Contests Attended" value={getNestedValue(u, 'contests.summary.totalAttended', 0)} icon={Activity} color="text-purple-400"/>
                <StatCard title="Current Streak" value={getNestedValue(u, 'activity.streak', 0)} icon={CalendarDays} color="text-orange-400"/>
                <StatCard title="Total Active Days" value={getNestedValue(u, 'activity.totalActiveDays', 0)} icon={CalendarDays} color="text-teal-400"/></div>
            <Section title="Profile Details" icon={UserCircle} defaultOpen={true}><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><strong className="text-slate-400 w-28 inline-block">Location:</strong> <span className="text-slate-200">{formatLocation(getNestedValue(u, 'profile.location'))}</span></p>
                <p><strong className="text-slate-400 w-28 inline-block">School:</strong> <span className="text-slate-200">{getNestedValue(u, 'profile.school', 'N/A')}</span></p>
                <p><strong className="text-slate-400 w-28 inline-block">Active Years:</strong> <span className="text-slate-200">{getNestedValue(u, 'activity.activeYears', 'N/A')}</span></p></div></Section>
            <Section title="Problem Solving Stats" icon={BarChart2} defaultOpen={true}>{u.stats.error && <p className="text-red-400 text-sm mb-2">Stats incomplete: {u.stats.error}</p>}
                <div className="space-y-3">{['Easy', 'Medium', 'Hard', 'All'].map(diff => {const stat = u.stats[diff]; if (!stat || typeof getNestedValue(stat, 'solved', null) !== 'number') return null; const solved = getNestedValue(stat, 'solved', 0); const total = getNestedValue(stat, 'total', 0); const p = total > 0 ? (solved / total) * 100 : 0;
                    return (<div key={diff}><div className="flex justify-between items-center mb-1"><span className={`font-medium ${getDifficultyColorText(diff)}`}>{diff}</span><span className="text-xs text-slate-300">{solved} / {total || 'N/A'} {` (${getNestedValue(stat, 'submissions', 0)} subs)`}</span></div><div className="w-full bg-slate-700 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${getDifficultyColorBg(diff)}`} style={{ width: `${p}%` }} title={`${p.toFixed(1)}%`}></div></div></div>);})}</div></Section>
            <Section title="Badges" icon={Medal}>
                {u.badges?.error && <p className="text-red-400 text-sm mb-2">Badge Info: {u.badges.error}</p>}
                {u.badges && !u.badges.error && (<>
                    <p className="text-slate-300 mb-1"><strong className="text-slate-100">Ach. Level:</strong> {getNestedValue(u, 'badges.summary.level', 'N/A')}</p>
                    <p className="text-slate-400 text-sm mb-1">Earned: {getNestedValue(u, 'badges.summary.totalEarned', 0)} | Upcoming: {getNestedValue(u, 'badges.summary.totalUpcoming', 0)} | Possible: {getNestedValue(u, 'badges.summary.totalPossible', 0)}</p>
                    {u.badges.summary?.categories && Object.keys(u.badges.summary.categories).length > 0 && (<div className="mb-3 text-sm"><strong className="text-slate-300">Categories:</strong><ul className="list-disc list-inside ml-2 text-slate-400 marker:text-sky-400">{Object.entries(u.badges.summary.categories).map(([cat, count]) => (<li key={cat}>{cat}: {count}</li>))}</ul></div>)}
                    {u.badges.earned?.length > 0 && (<>
                        <h4 className="font-semibold text-slate-200 mt-3 mb-2">Earned Badges ({u.badges.earned.length}):</h4>
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">{u.badges.earned.map(b => (<div key={b.id || b.name} className="bg-slate-700 p-2.5 rounded-md text-center hover:bg-slate-600/70 flex flex-col items-center justify-start aspect-square" title={`${b.name}\nDesc: ${b.description}\nEarned: ${b.creationDate}\nCat: ${b.category || 'Gen'}\nStatus: ${b.status}`}>
                            {b.icon ? <img src={b.icon} alt={b.name} className="w-10 h-10 mx-auto mb-1.5 object-contain" style={{backgroundColor: b.iconGifBackground || 'transparent'}}/> : <Medal className="w-10 h-10 mx-auto mb-1.5 text-slate-500"/>}
                            <p className="text-xs text-slate-300 w-full px-1 leading-tight line-clamp-2">{b.name}</p>{b.creationDate && b.creationDate !== 'N/A' && (<p className="text-[10px] text-sky-300 mt-0.5">{b.creationDate}</p>)}</div>))}</div></>)}
                    {u.badges.upcoming?.length > 0 && (<>
                        <h4 className="font-semibold text-slate-200 mt-4 mb-2">Upcoming Badges ({u.badges.upcoming.length}):</h4>
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">{u.badges.upcoming.map((b, i) => (<div key={b.name + '-' + i} className="bg-slate-700 p-2.5 rounded-md text-center opacity-75 flex flex-col items-center justify-start aspect-square" title={`${b.name}\nProgress: ${b.progress}\nStatus: ${b.status}`}>
                            {b.icon ? <img src={b.icon} alt={b.name} className="w-10 h-10 mx-auto mb-1.5 object-contain" style={{backgroundColor: b.iconGifBackground || 'transparent'}}/> : <Medal className="w-10 h-10 mx-auto mb-1.5 text-slate-500"/>}
                            <p className="text-xs text-slate-400 w-full px-1 leading-tight line-clamp-2">{b.name}</p>{b.progress && b.progress !== 'N/A' && <p className="text-[10px] text-sky-400 mt-0.5">{b.progress}</p>}</div>))}</div></>)}
                    {(!u.badges.earned || u.badges.earned.length === 0) && (!u.badges.upcoming || u.badges.upcoming.length === 0) && (<p className="text-slate-400 text-sm mt-3">No badges found.</p>)}</>)}
                {!u.badges && <p className="text-slate-400 text-sm mt-3">Badge information unavailable.</p>}</Section>
            <Section title={`Submission Activity (${selectedHeatmapYear})`} icon={CalendarDays} defaultOpen={true}><HeatmapGrid heatmapData={u.heatmap} year={selectedHeatmapYear} /></Section>
            <Section title="Recent Submissions" icon={Code}>{u.submissions?.length > 0 ? (<ul className="space-y-2 text-sm max-h-80 overflow-y-auto pr-2 pretty-scrollbar">{u.submissions.map((s, i) => (<li key={`${s.titleSlug}-${s.timestamp}-${i}`} className="p-2.5 bg-slate-700/50 rounded hover:bg-slate-600/50"><a href={`https://leetcode.com/problems/${s.titleSlug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-400 hover:underline">{s.title}</a><div className="flex flex-wrap justify-between items-center text-xs text-slate-400 mt-1 gap-x-2"><span className={`font-semibold ${s.status === 'Accepted' ? 'text-green-400' : 'text-red-400'}`}>{s.status}</span><span className="text-purple-300">{s.language}</span><span>{s.timestamp}</span></div></li>))}</ul>) : <p className="text-slate-400 text-sm">No recent submissions.</p>}</Section>
            <Section title="Language Proficiency" icon={Brain}>{u.languages?.length > 0 ? (<ul className="list-disc list-inside text-sm text-slate-300 space-y-1 marker:text-sky-400">{u.languages.sort((a,b) => getNestedValue(b, 'solved', 0) - getNestedValue(a, 'solved', 0)).map(l => (<li key={l.name}>{l.name}: <span className="font-semibold text-slate-100">{getNestedValue(l, 'solved', 0)} solved</span></li>))}</ul>) : <p className="text-slate-400 text-sm">No language stats.</p>}</Section>
            <Section title="Topics / Tags (Most Solved)" icon={Briefcase}>{u.tags?.length > 0 ? (<div className="flex flex-wrap gap-2">{u.tags.map(t => (<span key={t.slug || t.name} className="bg-sky-700 text-sky-100 text-xs px-2.5 py-1 rounded-full hover:bg-sky-600">{t.name} ({getNestedValue(t, 'solved', 0)})</span>))}</div>) : <p className="text-slate-400 text-sm">No tag stats.</p>}</Section>
            <Section title="Contest History" icon={Trophy}><div className="text-sm mb-3"><p><strong className="text-slate-300">Total Attended:</strong> <span className="font-semibold text-slate-100">{getNestedValue(u, 'contests.summary.totalAttended', 0)}</span></p><p><strong className="text-slate-300">Weekly:</strong> <span className="font-semibold text-slate-100">{getNestedValue(u, 'contests.summary.weeklyAttended', 0)}</span> | <strong className="text-slate-300">Biweekly:</strong> <span className="font-semibold text-slate-100">{getNestedValue(u, 'contests.summary.biweeklyAttended', 0)}</span></p></div>{u.contests.history?.length > 0 ? (<ul className="space-y-2 text-sm max-h-80 overflow-y-auto pr-2 pretty-scrollbar">{u.contests.history.map((c, i) => (<li key={`${c.title}-${c.startTime}-${i}`} className="p-2.5 bg-slate-700/50 rounded hover:bg-slate-600/50"><p className="font-medium text-slate-200">{c.title}</p><div className="grid grid-cols-2 sm:grid-cols-3 text-xs text-slate-400 mt-1 gap-x-2"><span>Rank: <span className="text-slate-300">{c.rank}</span></span><span>Solved: <span className="text-slate-300">{c.solved}/{c.total}</span></span><span className="col-span-2 sm:col-span-1">{c.startTime}</span></div></li>))}</ul>) : <p className="text-slate-400 text-sm">No contest history.</p>}</Section>
        </>);
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
    
    const tableColumns = useMemo(() => [ // Memoize to prevent re-creation on every render
        { key: 'sno', label: 'S.No.', sortable: false },
        { key: 'username', label: 'Username', sortable: true, getValue: user => user.username?.toLowerCase() || '' },
        { key: 'realName', label: 'Real Name', sortable: true, getValue: user => getNestedValue(user, 'profile.realName', 'z').toLowerCase() }, // 'z' for N/A to sort last
        { key: 'ranking', label: 'Ranking', sortable: true, getValue: user => getNestedValue(user, 'profile.ranking', Infinity) === 'N/A' ? Infinity : parseInt(getNestedValue(user, 'profile.ranking', Infinity)) },
        { key: 'problemsSolved', label: 'Problems Solved', sortable: true, getValue: user => (getNestedValue(user, 'stats.Easy.solved', 0)) + (getNestedValue(user, 'stats.Medium.solved', 0)) + (getNestedValue(user, 'stats.Hard.solved', 0)) },
        { 
            key: 'solveRate', 
            label: 'Solve Rate (%)', 
            sortable: true, 
            getValue: user => {
                const solved = getNestedValue(user, 'stats.All.solved', 0);
                const total = getNestedValue(user, 'stats.All.total', 0);
                return (typeof solved === 'number' && typeof total === 'number' && total > 0) ? (solved / total) * 100 : -1;
            },
            displayValue: user => {
                const solved = getNestedValue(user, 'stats.All.solved', 0);
                const total = getNestedValue(user, 'stats.All.total', 0);
                if (typeof solved === 'number' && typeof total === 'number' && total > 0) {
                    return `${((solved / total) * 100).toFixed(1)}%`;
                }
                return 'N/A';
            }
        },
        { key: 'badgesEarned', label: 'Badges Earned', sortable: true, getValue: user => getNestedValue(user, 'badges.summary.totalEarned', 0) },
        { key: 'activeDays', label: 'Active Days', sortable: true, getValue: user => getNestedValue(user, 'activity.totalActiveDays', 0) },
        { key: 'contests', label: 'Contests', sortable: true, getValue: user => getNestedValue(user, 'contests.summary.totalAttended', 0) },
        { 
            key: 'status', 
            label: 'Status', 
            sortable: true, 
            getValue: user => {
                 const isFullError = user.error && (!user.profile || getNestedValue(user, 'profile.realName') === 'N/A' && (getNestedValue(user, 'stats.All.solved', 0) === 0));
                if (isFullError) return 0; // Full Error
                if (user.error) return 1; // Partial
                return 2; // OK
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

                const isANSpecial = valA === Infinity || valA === -1 || valA === 'z';
                const isBNSpecial = valB === Infinity || valB === -1 || valB === 'z';

                if (isANSpecial && isBNSpecial) return 0;
                if (isANSpecial) return 1; 
                if (isBNSpecial) return -1;

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
        
        const solveRateDisplay = tableColumns.find(c => c.key === 'solveRate').displayValue(user);

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
            'Solve Rate (%)': solveRateDisplay,
            'Badges Earned': getNestedValue(user, 'badges.summary.totalEarned', 0),
            'Active Days': getNestedValue(user, 'activity.totalActiveDays', 0),
            'Contests': getNestedValue(user, 'contests.summary.totalAttended', 0),
            'Status': statusText,
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
    
        searchResults.forEach(user => { // Iterate over all fetched users
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
        setError(''); // Clear any previous error messages
    };
    
    const handleDownloadNonParticipants = (contestType) => {
        const contestNum = contestType === 'weekly' ? weeklyContestQuery.trim() : biweeklyContestQuery.trim();
        if (!contestNum) {
            setError(`Please enter a ${contestType} contest number and apply highlights first.`);
            return;
        }
         // Ensure highlights are fresh if query changed since last apply
        if (Object.keys(contestHighlights).length === 0 && (weeklyContestQuery.trim() || biweeklyContestQuery.trim())) {
             setError(`Please click "Apply Contest Highlights" first after entering contest numbers.`);
             return;
        }

        const nonParticipantsUsers = processedResults.filter(user => {
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


    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
            <style jsx global>{`.pretty-scrollbar::-webkit-scrollbar {width:6px;height:6px;} .pretty-scrollbar::-webkit-scrollbar-track {background:transparent;} .pretty-scrollbar::-webkit-scrollbar-thumb {background:#475569;border-radius:10px;} .pretty-scrollbar::-webkit-scrollbar-thumb:hover {background:#334155;}`}</style>
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-sky-400">LeetCode Stats Viewer</h1>
            </header>
            <div className="max-w-xl mx-auto mb-8 p-6 bg-slate-800 rounded-xl shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-grow">
                        <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSingleSearch()} placeholder="Enter LeetCode Username" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"/>
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                    <button onClick={handleSingleSearch} disabled={isLoading || !usernameInput.trim()} className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800">
                        {isLoading && totalToProcess === 1 && lastSearchedUsernames.length === 1 && lastSearchedUsernames[0] === usernameInput.trim() ? <Loader2 className="animate-spin mr-2" size={20}/> : <Search className="mr-2" size={20}/>}Search
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                    <label htmlFor="bulk-upload" className={`cursor-pointer bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-2.5 rounded-lg inline-flex items-center justify-center transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <UploadCloud className="mr-2" size={20}/> Bulk Search (CSV/XLSX)
                    </label>
                    <input id="bulk-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleBulkSearch} disabled={isLoading} className="hidden"/>
                    <button onClick={handleRefresh} disabled={isLoading || (lastSearchedUsernames.length === 0 && !lastSearchedFile)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 w-full sm:w-auto">
                        {isLoading && (totalToProcess > 0 && (lastSearchedUsernames.length > 0 || lastSearchedFile)) ? <Loader2 className="animate-spin mr-2" size={20}/> : <RotateCcw className="mr-2" size={20}/>}Refresh Data
                    </button>
                </div>
                {error && <p className="text-red-400 mt-4 text-center text-sm">{error}</p>}
            </div>

            {isLoading && totalToProcess > 0 && (
                <div className="my-6 text-center">
                    <Loader2 className="animate-spin inline-block w-8 h-8 text-sky-400 mb-2" />
                    <p className="text-lg">Processing {processingProgress} of {totalToProcess} users...</p>
                    <div className="w-full max-w-md mx-auto bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
                        <div className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-linear" style={{width: `${totalToProcess > 0 ? (processingProgress / totalToProcess) * 100 : 0}%`}}></div>
                    </div>
                </div>
            )}
            
            {searchResults.length > 0 && !isLoading && (
                <div className="mt-10 max-w-7xl mx-auto bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-5 border-b border-slate-700 flex flex-wrap gap-4 items-center justify-between">
                        <h2 className="text-2xl font-semibold text-slate-100">Search Results ({processedResults.length})</h2>
                        <button onClick={handleDownloadTable} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm">
                            <Download size={18} className="mr-2"/> Download Table
                        </button>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-700">
                        <input type="text" placeholder="Filter by Username..." value={filterUsername} onChange={e => setFilterUsername(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm"/>
                        <input type="text" placeholder="Filter by Real Name..." value={filterRealName} onChange={e => setFilterRealName(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm"/>
                        <input type="text" placeholder="Weekly Contest No." value={weeklyContestQuery} onChange={e => setWeeklyContestQuery(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm"/>
                        <input type="text" placeholder="Biweekly Contest No." value={biweeklyContestQuery} onChange={e => setBiweeklyContestQuery(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 outline-none text-sm"/>
                    </div>
                     <div className="p-4 flex flex-wrap gap-3 border-b border-slate-700">
                        <button onClick={handleApplyContestHighlights} disabled={!weeklyContestQuery.trim() && !biweeklyContestQuery.trim()} className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <Filter size={18} className="mr-2"/> Apply Contest Highlights
                        </button>
                        <button onClick={() => handleDownloadNonParticipants('weekly')} disabled={!weeklyContestQuery.trim()} className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <Download size={18} className="mr-2"/> Export Non-Participants (Weekly)
                        </button>
                         <button onClick={() => handleDownloadNonParticipants('biweekly')} disabled={!biweeklyContestQuery.trim()} className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <Download size={18} className="mr-2"/> Export Non-Participants (Biweekly)
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px] text-sm text-left text-slate-300">
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
                                    const userHighlight = contestHighlights[user.username] || {};
                                    let contestRowClass = '';

                                    const weeklyQueryActive = weeklyContestQuery.trim() !== '';
                                    const biweeklyQueryActive = biweeklyContestQuery.trim() !== '';

                                    let rowIsRed = false;
                                    let rowIsGreen = false;

                                    if (weeklyQueryActive && userHighlight.weekly === 'red') rowIsRed = true;
                                    if (biweeklyQueryActive && userHighlight.biweekly === 'red') rowIsRed = true;
                                    
                                    if (!rowIsRed) { // Only consider green if not already red
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
                                    
                                    return (
                                        <tr 
                                            key={user.username + index} 
                                            onClick={() => { setSelectedUser(user); setSelectedHeatmapYear(new Date().getFullYear()); }} 
                                            className={`border-b border-slate-700 cursor-pointer transition-colors ${contestRowClass || baseErrorClass || 'hover:bg-slate-700/70'}`}
                                        >
                                            <td className="px-5 py-4">{index + 1}</td>
                                            <td className="px-5 py-4 font-medium text-sky-400 break-all">{user.username}</td>
                                            <td className="px-5 py-4">{getNestedValue(user, 'profile.realName')}</td>
                                            <td className="px-5 py-4">{getNestedValue(user, 'profile.ranking')}</td>
                                            <td className="px-5 py-4">{(getNestedValue(user, 'stats.Easy.solved', 0)) + (getNestedValue(user, 'stats.Medium.solved', 0)) + (getNestedValue(user, 'stats.Hard.solved', 0))}</td>
                                            <td className="px-5 py-4">{tableColumns.find(c => c.key === 'solveRate').displayValue(user)}</td>
                                            <td className="px-5 py-4">{getNestedValue(user, 'badges.summary.totalEarned', 0)}</td>
                                            <td className="px-5 py-4">{getNestedValue(user, 'activity.totalActiveDays', 0)}</td>
                                            <td className="px-5 py-4">{getNestedValue(user, 'contests.summary.totalAttended', 0)}</td>
                                            <td className="px-5 py-4">
                                                {isFullError
                                                    ? (<span className="text-red-400 flex items-center"><AlertTriangle size={14} className="mr-1.5"/> Error</span>) 
                                                    : user.error 
                                                        ? (<span className="text-yellow-400 flex items-center"><AlertTriangle size={14} className="mr-1.5"/> Partial</span>) 
                                                        : (<span className="text-green-400 flex items-center"><CheckCircle size={14} className="mr-1.5"/> OK</span>)
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

            {selectedUser && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null);}}>
                <div className="bg-slate-850 text-slate-200 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-slate-700 pretty-scrollbar" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setSelectedUser(null)} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-100 transition-colors z-[110] p-1 rounded-full hover:bg-slate-700" aria-label="Close modal"><X size={24}/></button>
                    <ModalContent user={selectedUser} />
                </div>
            </div>)}
        </div>);
}
export default LeetCodeProfileAnalyzer;