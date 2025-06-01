// server.js
const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = 3000;

// CORS Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // In production, restrict this
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());

// --- Generic GraphQL Request Function (from your standalone script, slightly adapted) ---
function makeGraphQLRequest(queryObject) { // Renamed for clarity
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(queryObject);
        const options = {
            hostname: 'leetcode.com',
            port: 443,
            path: '/graphql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://leetcode.com/', // Referer is important
                'Origin': 'https://leetcode.com'  // Origin can also be important
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    // Basic check for GraphQL errors array, often present even with 200 OK
                    if (parsedData.errors) {
                        console.warn(`GraphQL query for ${queryObject?.variables?.username || 'unknown user'} returned errors:`, parsedData.errors);
                        // We still resolve, as partial data might be present or handled by caller
                    }
                    if (res.statusCode >= 400 && !parsedData.errors) { // HTTP error not caught by GraphQL errors
                        console.error(`LeetCode API HTTP Error ${res.statusCode}:`, data); // Log raw data on HTTP error
                        reject(new Error(`LeetCode API HTTP error: ${res.statusCode}`));
                        return;
                    }
                    resolve(parsedData);
                } catch (error) {
                    console.error('Failed to parse LeetCode API response:', data); // Log raw data
                    reject(new Error('Failed to parse LeetCode API response. ' + error.message));
                }
            });
        });
        req.on('error', (error) => {
            console.error('HTTPS request error to LeetCode:', error);
            reject(error);
        });
        req.write(postData);
        req.end();
    });
}


// --- BADGE SPECIFIC LOGIC (Directly from your provided script, with query correction) ---

const getBadgeQuery_Corrected = (username) => { // Using your query structure
    return {
        query: `
            query getUserBadges($username: String!) {
                matchedUser(username: $username) {
                    username
                    badges { # Earned badges
                        id
                        displayName
                        icon
                        creationDate
                        medal { # Medal field IS available for earned badges
                            slug
                            config {
                                iconGif
                                iconGifBackground
                            }
                        }
                        hoverText
                        category
                    }
                    upcomingBadges { # Upcoming badges
                        name
                        icon
                        progress
                        # CORRECTED: Removed medal field from here as it's not available on UpcomingBadgeNode
                    }
                }
            }
        `, // Removed allQuestionsCount as it's fetched separately if needed
        variables: { username }
    };
};

const getAlternativeBadgeQuery_Corrected = (username) => { // Using your query structure
    return {
        query: `
            query getUserProfileAltBadges($username: String!) { # Renamed GQL query name
                matchedUser(username: $username) {
                    username
                    badges {
                        id
                        displayName
                        icon
                        creationDate
                        # Medal is typically not in this simpler badge structure
                    }
                    profile { # Often useful to get avatar/name if primary fails
                        userAvatar 
                        realName
                    }
                }
            }
        `,
        variables: { username }
    };
};

// Using your fetchLeetCodeBadges function name and logic
async function fetchLeetCodeBadges(username, useAlternative = false) {
    const queryToUse = useAlternative 
        ? getAlternativeBadgeQuery_Corrected(username) 
        : getBadgeQuery_Corrected(username);
    return makeGraphQLRequest(queryToUse); // Use the generic request function
}

function getBadgeDescription(displayName) { // Your function
    const descriptions = {
        'Annual Badge 2024': 'Awarded for active participation throughout 2024',
        'Annual Badge 2023': 'Awarded for active participation throughout 2023',
        'Annual Badge 2022': 'Awarded for active participation throughout 2022',
        'Knight': 'Solved 1000+ problems', 'Guardian': 'Solved 500+ problems', 'Warrior': 'Solved 100+ problems',
        'Study Plan': 'Completed a study plan', 'DCC': 'Daily Coding Challenge participant',
        'Contest': 'Participated in contests', '50 Days Badge': 'Solved problems for 50 consecutive days',
        '100 Days Badge': 'Solved problems for 100 consecutive days', 'Premium': 'LeetCode Premium subscriber'
    };
    for (const [key, desc] of Object.entries(descriptions)) {
        if (displayName.toLowerCase().includes(key.toLowerCase())) return desc;
    }
    return 'Special achievement badge';
}

// Adapts your displayBadgeInfo logic to format JSON for the frontend
function formatBadgesForAPI(graphqlResponse, username) {
    const formatted = {
        username: username,
        earned: [],
        upcoming: [],
        summary: { totalEarned: 0, totalUpcoming: 0, categories: {}, level: 'Future Badge Earner 🚀', totalPossible: 0 },
        error: null
    };

    if (graphqlResponse.errors) {
        formatted.error = graphqlResponse.errors[0].message;
        return formatted; // Return early if GraphQL itself reports an error
    }

    const user = graphqlResponse.data?.matchedUser;
    if (!user) {
        // This case can happen if GraphQL response is valid but matchedUser is null (e.g., user not found)
        formatted.error = `User "${username}" not found or no badge data available.`;
        // Check if the original GQL response had a more specific error message.
        if (graphqlResponse.data && Object.keys(graphqlResponse.data).length === 1 && graphqlResponse.data.matchedUser === null) {
             // This often means user not found.
        } else if (!graphqlResponse.data) {
            formatted.error = "No data returned from badge query.";
        }
        return formatted;
    }

    const earnedBadgesRaw = user.badges || [];
    const upcomingBadgesRaw = user.upcomingBadges || [];

    formatted.earned = earnedBadgesRaw.map(b => ({
        id: b.id,
        name: b.displayName,
        description: b.hoverText || getBadgeDescription(b.displayName),
        status: 'UNLOCKED',
        creationDate: b.creationDate ? new Date(b.creationDate * 1000).toLocaleDateString() : 'N/A',
        icon: b.icon || b.medal?.config?.iconGif || '',
        iconGifBackground: b.medal?.config?.iconGifBackground || '',
        medalSlug: b.medal?.slug || 'N/A',
        category: b.category || 'General'
    }));

    formatted.upcoming = upcomingBadgesRaw.map(b => ({
        name: b.name,
        status: 'LOCKED',
        progress: b.progress || 'Not available',
        icon: b.icon || '', // No medal info for upcoming
        iconGifBackground: '', // Default, as no medal.config
        medalSlug: 'N/A'       // Default, as no medal
    }));

    formatted.summary.totalEarned = formatted.earned.length;
    formatted.summary.totalUpcoming = formatted.upcoming.length;
    formatted.summary.totalPossible = formatted.summary.totalEarned + formatted.summary.totalUpcoming;
    const categories = {};
    formatted.earned.forEach(b => { categories[b.category] = (categories[b.category] || 0) + 1; });
    formatted.summary.categories = categories;
    const count = formatted.summary.totalEarned;
    if (count >= 10) formatted.summary.level = 'Badge Master 🌟';
    else if (count >= 5) formatted.summary.level = 'Badge Collector 🎖️';
    else if (count >= 1) formatted.summary.level = 'Badge Beginner 🎯';
    
    return formatted;
}
// --- END OF BADGE SPECIFIC LOGIC ---


async function fetchAllData(username) {
    const commonVariables = { username };
    const queries = { // Using more concise query definitions
        stats: { query: `query Q1($username: String!) { matchedUser(username: $username) { username, submitStats { acSubmissionNum { difficulty, count, submissions } } }, allQuestionsCount { difficulty, count } }`, variables: commonVariables },
        profile: { query: `query Q2($username: String!) { matchedUser(username: $username) { username, profile { realName, location, school, reputation, ranking, userAvatar } } }`, variables: commonVariables },
        submissions: { query: `query Q3($username: String!, $limit: Int) { recentSubmissionList(username: $username, limit: $limit) { title, titleSlug, timestamp, statusDisplay, lang } }`, variables: { ...commonVariables, limit: 20 } },
        calendar: { query: `query Q4($username: String!, $year: Int) { matchedUser(username: $username) { userCalendar(year: $year) { activeYears, streak, totalActiveDays, submissionCalendar } } }`, variables: { ...commonVariables, year: new Date().getFullYear() } },
        languages: { query: `query Q5($username: String!) { matchedUser(username: $username) { languageProblemCount { languageName, problemsSolved }, tagProblemCounts { advanced { tagName, tagSlug, problemsSolved }, intermediate { tagName, tagSlug, problemsSolved }, fundamental { tagName, tagSlug, problemsSolved } } } }`, variables: commonVariables },
        contests: { query: `query Q6($username: String!) { userContestRankingHistory(username: $username) { attended, contest { title, startTime }, problemsSolved, totalProblems, ranking } }`, variables: commonVariables }
    };

    const results = {};
    const promises = Object.entries(queries).map(async ([key, queryPayload]) => {
        try { results[key] = await makeGraphQLRequest(queryPayload); } 
        catch (error) { console.error(`Error fetching ${key} for ${username}:`, error.message); results[key] = { errors: [{message: error.message}], data: null }; } // Ensure errors is an array
    });
    await Promise.all(promises);
    
    // Fetch and format badges using your script's logic (now corrected and integrated)
    // console.log(`Fetching badges for ${username} using your provided logic structure...`);
    let rawBadgeGQLResponse = await fetchLeetCodeBadges(username, false);
    if (rawBadgeGQLResponse.errors || !rawBadgeGQLResponse.data?.matchedUser) {
        // console.log(`Primary badge fetch failed/no data for ${username}, trying alternative.`);
        rawBadgeGQLResponse = await fetchLeetCodeBadges(username, true);
    }
    results.badges = formatBadgesForAPI(rawBadgeGQLResponse, username);
    
    return results;
}

function formatUserData(username, rawData) {
    // Initialize with defaults, especially for badges to ensure structure
    const formatted = {
        username: username,
        profile: { realName: 'N/A', location: 'N/A', school: 'N/A', reputation: 0, ranking: 'N/A', userAvatar: '' },
        stats: { Easy: { solved: 0, total: 0, submissions: 0 }, Medium: { solved: 0, total: 0, submissions: 0 }, Hard: { solved: 0, total: 0, submissions: 0 }, All: { solved: 0, total: 0, submissions: 0 } },
        activity: { streak: 0, totalActiveDays: 0, activeYears: 'N/A' },
        submissions: [], languages: [], tags: [],
        badges: rawData.badges || { username: username, earned: [], upcoming: [], summary: {}, error: "Badge data structure missing." }, // Critical: Use the pre-formatted badges
        contests: { summary: { totalAttended: 0, weeklyAttended: 0, biweeklyAttended: 0 }, history: [] },
        heatmap: {}, error: null
    };

    // Determine overall error / user existence
    let primaryError = null;
    const criticalDataKeys = ['profile', 'stats']; // If these fail, user likely doesn't exist or is private
    for (const key of criticalDataKeys) {
        if (rawData[key]?.errors && (!rawData[key]?.data || !rawData[key]?.data?.matchedUser)) {
            primaryError = rawData[key].errors[0].message;
            break;
        }
    }
     // If badge query explicitly says user not found, that's a strong indicator
    if (rawData.badges?.error && rawData.badges.error.toLowerCase().includes('user does not exist')) {
        primaryError = `User "${username}" does not exist.`;
    } else if (primaryError && primaryError.toLowerCase().includes('user does not exist')) {
         primaryError = `User "${username}" does not exist.`;
    }


    if (primaryError) {
        formatted.error = primaryError;
        // If user doesn't exist, we can return early, badge error will also reflect this.
        // Keep badges.error as is, since it might have specific "user not found" from badge query.
        return formatted;
    }
    

    // Profile
    const pProfile = rawData.profile?.data?.matchedUser?.profile;
    if (pProfile) {
        formatted.profile = { realName: pProfile.realName || 'N/A', location: pProfile.location || 'N/A', school: pProfile.school || 'N/A', reputation: pProfile.reputation || 0, ranking: pProfile.ranking > 0 ? pProfile.ranking : 'N/A', userAvatar: pProfile.userAvatar || '' };
    }

    // Stats
    const pStats = rawData.stats?.data?.matchedUser?.submitStats?.acSubmissionNum;
    const allQ = rawData.stats?.data?.allQuestionsCount;
    if (pStats && allQ) {
        let totalS = 0, totalSub = 0, totalO = 0;
        pStats.forEach(s => {
            const t = allQ.find(q => q.difficulty === s.difficulty)?.count || 0;
            formatted.stats[s.difficulty] = { solved: s.count || 0, total: t, submissions: s.submissions || 0 };
            totalS += s.count || 0; totalSub += s.submissions || 0;
        });
        const aqd = allQ.find(q => q.difficulty === "All");
        let calcTotalO = 0; allQ.forEach(q => { if (q.difficulty !== "All") calcTotalO += (q.count || 0); });
        totalO = aqd ? aqd.count : calcTotalO;
        formatted.stats.All = { solved: totalS, total: totalO, submissions: totalSub };
    } else if (rawData.stats?.errors) {
        formatted.stats.error = rawData.stats.errors[0].message;
    }


    // Activity & Heatmap
    const pCal = rawData.calendar?.data?.matchedUser?.userCalendar;
    if (pCal) {
        formatted.activity = { streak: pCal.streak || 0, totalActiveDays: pCal.totalActiveDays || 0, activeYears: pCal.activeYears?.join(', ') || 'N/A' };
        if (pCal.submissionCalendar) {
            try { formatted.heatmap = JSON.parse(pCal.submissionCalendar); } 
            catch (e) { console.error(`Heatmap parse error for ${username}:`, e); formatted.heatmap = { error: 'Parse error' }; }
        } else { formatted.heatmap = { note: 'No calendar string' }; }
    } else if (rawData.calendar?.errors) {
        formatted.activity.error = rawData.calendar.errors[0].message;
        formatted.heatmap = { error: `Calendar fetch error: ${rawData.calendar.errors[0].message}` };
    }

    // Submissions
    const pSubs = rawData.submissions?.data?.recentSubmissionList;
    if (pSubs) {
        formatted.submissions = pSubs.map(s => ({ title: s.title, titleSlug: s.titleSlug, status: s.statusDisplay, language: s.lang, timestamp: new Date(parseInt(s.timestamp) * 1000).toLocaleString() }));
    }

    // Languages & Tags
    const pLangs = rawData.languages?.data?.matchedUser;
    if (pLangs) {
        if (pLangs.languageProblemCount) formatted.languages = pLangs.languageProblemCount.map(l => ({ name: l.languageName, solved: l.problemsSolved }));
        if (pLangs.tagProblemCounts) {
            const tagsRaw = pLangs.tagProblemCounts;
            formatted.tags = [...(tagsRaw.fundamental || []), ...(tagsRaw.intermediate || []), ...(tagsRaw.advanced || [])]
                .map(t => ({ name: t.tagName, slug: t.tagSlug, solved: t.problemsSolved }))
                .filter(t => t.solved > 0).sort((a,b) => b.solved - a.solved);
        }
    }

    // Contests
    const pContests = rawData.contests?.data?.userContestRankingHistory;
    if (pContests) {
        const attended = pContests.filter(c => c?.attended);
        formatted.contests.summary = {
            totalAttended: attended.length,
            weeklyAttended: attended.filter(c => c.contest?.title?.toLowerCase().includes('weekly')).length,
            biweeklyAttended: attended.filter(c => c.contest?.title?.toLowerCase().includes('biweekly')).length,
        };
        formatted.contests.history = attended.map(c => ({ title: c.contest.title, solved: c.problemsSolved, total: c.totalProblems, rank: c.ranking, startTime: new Date(c.contest.startTime * 1000).toLocaleString() })).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }
    
    // console.log(`[DEBUG SERVER] Final formatted.badges for ${username}:`, JSON.stringify(formatted.badges, null, 2));
    return formatted;
}

// --- API Routes ---
app.post('/api/leetcode', async (req, res) => {
    const { username } = req.body;
    // console.log(`API: POST for username: '${username}'`);
    if (!username || typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ error: 'Username is required.' });
    }
    const trimmedUsername = username.trim();
    try {
        const rawData = await fetchAllData(trimmedUsername);
        const formattedData = formatUserData(trimmedUsername, rawData);
        res.json(formattedData);
    } catch (error) {
        console.error(`API: Server error for ${trimmedUsername}:`, error);
        res.status(500).json({ error: `Server error for ${trimmedUsername}. ${error.message}`, username: trimmedUsername });
    }
});

app.get('/api/test', (req, res) => res.json({ message: 'Backend test OK!' }));

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});