import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Search, Loader2, X, GitBranch, Star, GitFork, Eye, AlertCircle,
  Download, UploadCloud, CheckCircle, AlertTriangle, Code, Calendar,
  Users, Package, FileText, Lock, ExternalLink, Tag, TrendingUp, Activity
} from 'lucide-react';

const API_REPO_URL = import.meta.env.VITE_GITHUB_REPO_API_URL || import.meta.env.VITE_GITHUB_API_URL?.replace('/api/github', '/api/github/repo') || 'http://localhost:3003/api/github/repo';
const API_BULK_REPO_URL = import.meta.env.VITE_GITHUB_REPO_BULK_API_URL || import.meta.env.VITE_GITHUB_API_URL?.replace('/api/github', '/api/github/repos/bulk') || 'http://localhost:3003/api/github/repos/bulk';

function GithubRepoAnalyzer() {
  const [repoInput, setRepoInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  // Parse repository URL or owner/repo format
  const parseRepoInput = (input) => {
    if (input.includes('github.com')) {
      const match = input.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (match) {
        return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
      }
    } else if (input.includes('/')) {
      const [owner, repo] = input.split('/');
      return { owner: owner.trim(), repo: repo.trim() };
    }
    return null;
  };

  // Fetch single repository
  const fetchSingleRepo = async (owner, repo) => {
    try {
      const response = await axios.get(`${API_REPO_URL}/${owner}/${repo}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching ${owner}/${repo}:`, err);
      return { success: false, error: err.response?.data?.error || 'Failed to fetch data', owner, repo };
    }
  };

  // Fetch bulk repositories
  const fetchBulkRepos = async (repositories) => {
    try {
      const response = await axios.post(API_BULK_REPO_URL, { repositories });
      return response.data.results || [];
    } catch (err) {
      console.error('Error fetching bulk repos:', err);
      throw err;
    }
  };

  // Handle single search
  const handleSingleSearch = async () => {
    const trimmed = repoInput.trim();
    if (!trimmed) return;

    const parsed = parseRepoInput(trimmed);
    if (!parsed) {
      setError('Invalid repository format. Use "owner/repo" or full GitHub URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResults([]);
    setTotalToProcess(1);
    setProcessingProgress(0);

    const result = await fetchSingleRepo(parsed.owner, parsed.repo);
    
    // Transform single repo response to match bulk format for table display
    const transformedResult = result.success && !result.isPrivate ? {
      ...result,
      owner: parsed.owner,
      repo: parsed.repo,
      name: result.basic?.fullName || `${parsed.owner}/${parsed.repo}`,
      description: result.basic?.description || 'N/A',
      stars: result.stats?.stars || 0,
      forks: result.stats?.forks || 0,
      watchers: result.stats?.watchers || 0,
      language: result.languages?.[0]?.language || 'N/A',
      license: result.basic?.license || 'N/A',
      url: result.basic?.url || `https://github.com/${parsed.owner}/${parsed.repo}`
    } : result.isPrivate ? {
      ...result,
      owner: parsed.owner,
      repo: parsed.repo,
      name: result.basic?.fullName || `${parsed.owner}/${parsed.repo}`,
      description: 'Private Repository',
      stars: 0,
      forks: 0,
      watchers: 0,
      language: 'N/A',
      license: 'N/A',
      url: result.basic?.url || `https://github.com/${parsed.owner}/${parsed.repo}`
    } : {
      ...result,
      owner: parsed.owner,
      repo: parsed.repo,
      name: `${parsed.owner}/${parsed.repo}`,
      description: result.error || 'Error',
      stars: 0,
      forks: 0,
      watchers: 0,
      language: 'N/A',
      license: 'N/A',
      url: `https://github.com/${parsed.owner}/${parsed.repo}`
    };
    
    setSearchResults([transformedResult]);
    setProcessingProgress(1);
    setIsLoading(false);
    setRepoInput('');
  };

  // Handle bulk search (file upload)
  const handleBulkSearch = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsLoading(true);
        setError('');
        setSearchResults([]);

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const repositories = jsonData
          .flat()
          .map(val => String(val).trim())
          .filter(val => val && val.toLowerCase() !== 'repository' && val.toLowerCase() !== 'repo');

        if (repositories.length === 0) {
          setError('No valid repositories found in file');
          setIsLoading(false);
          return;
        }

        setTotalToProcess(repositories.length);
        setProcessingProgress(0);

        const results = await fetchBulkRepos(repositories);
        setSearchResults(results);
        setProcessingProgress(repositories.length);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to parse file. Ensure it\'s a valid CSV or Excel file.');
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = null;
  };

  // Download table as Excel
  const handleDownloadTable = () => {
    const exportData = searchResults.map((repo, index) => ({
      'S.No.': index + 1,
      'Repository': repo.name || `${repo.owner}/${repo.repo}`,
      'Owner': repo.owner,
      'Description': repo.description || 'N/A',
      'Stars': repo.stars || 0,
      'Forks': repo.forks || 0,
      'Watchers': repo.watchers || 0,
      'Open Issues': repo.openIssues || 0,
      'Language': repo.language || 'N/A',
      'License': repo.license || 'N/A',
      'Size (KB)': repo.size || 0,
      'Private': repo.isPrivate ? 'Yes' : 'No',
      'Fork': repo.fork ? 'Yes' : 'No',
      'Archived': repo.archived ? 'Yes' : 'No',
      'URL': repo.url || 'N/A',
      'Status': repo.success ? 'Success' : 'Error'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GitHub Repositories');
    XLSX.writeFile(wb, 'github_repositories.xlsx');
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
        <h1 className="text-4xl md:text-5xl font-bold text-purple-400">GitHub Repository Analyzer</h1>
        <p className="text-slate-400 mt-2">Comprehensive GitHub repository analytics and insights</p>
      </header>

      {/* Search Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">Search Repository</h2>
          
          {/* Single Search */}
          <div className="mb-6">
            <label className="block text-sm text-slate-300 mb-2">Repository URL or owner/repo</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSingleSearch()}
                placeholder="e.g., facebook/react or https://github.com/facebook/react"
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-100 placeholder-slate-400 border border-slate-600/50 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                onClick={handleSingleSearch}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Search size={18} />
                Search
              </button>
            </div>
          </div>

          {/* Bulk Search */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Bulk Upload (CSV/Excel)</label>
            <label className="flex items-center justify-center px-4 py-3 bg-slate-700/50 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700 transition-all">
              <UploadCloud size={20} className="mr-2 text-purple-400" />
              <span className="text-slate-300">Upload file with repository URLs</span>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleBulkSearch}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-300">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Loading Progress */}
      {isLoading && (
        <div className="max-w-4xl mx-auto mb-8 bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin text-purple-400" size={20} />
              <span className="text-slate-200 font-medium">Processing Repositories...</span>
            </div>
            <span className="text-slate-400">
              Processed: <strong className="text-purple-400">{processingProgress}</strong> / 
              Total: <strong className="text-purple-400">{totalToProcess}</strong>
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${totalToProcess > 0 ? (processingProgress / totalToProcess) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {searchResults.length > 0 && (
        <div className="max-w-7xl mx-auto bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-slate-700/50">
          <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-slate-100">
              Repository Results ({searchResults.length})
            </h2>
            <button
              onClick={handleDownloadTable}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Download size={18} className="mr-2" /> Download Table
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm text-left text-slate-300">
              <thead className="text-xs text-purple-300 uppercase bg-slate-700/50">
                <tr>
                  <th className="px-5 py-3">S.No.</th>
                  <th className="px-5 py-3">Repository</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">⭐ Stars</th>
                  <th className="px-5 py-3">🍴 Forks</th>
                  <th className="px-5 py-3">👀 Watchers</th>
                  <th className="px-5 py-3">Language</th>
                  <th className="px-5 py-3">License</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((repo, index) => (
                  <tr
                    key={index}
                    className="bg-slate-800/20 border-b border-slate-700/50 hover:bg-slate-700/40 cursor-pointer transition-colors"
                    onClick={async () => {
                      if (repo.isPrivate === false && repo.success) {
                        // Fetch full data if not already available
                        if (!repo.basic) {
                          setIsLoading(true);
                          const fullData = await fetchSingleRepo(repo.owner, repo.repo);
                          setIsLoading(false);
                          setSelectedRepo(fullData);
                        } else {
                          setSelectedRepo(repo);
                        }
                      } else {
                        setSelectedRepo(repo);
                      }
                    }}
                  >
                    <td className="px-5 py-4 font-medium">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {repo.isPrivate ? <Lock size={16} className="text-yellow-400" /> : <GitBranch size={16} className="text-purple-400" />}
                        <span className="font-medium text-purple-300">{repo.name || `${repo.owner}/${repo.repo}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-xs truncate">{repo.description || 'N/A'}</td>
                    <td className="px-5 py-4 font-semibold text-yellow-400">{repo.stars || 0}</td>
                    <td className="px-5 py-4 font-semibold text-blue-400">{repo.forks || 0}</td>
                    <td className="px-5 py-4 font-semibold text-purple-400">{repo.watchers || 0}</td>
                    <td className="px-5 py-4">{repo.language || 'N/A'}</td>
                    <td className="px-5 py-4">{repo.license || 'N/A'}</td>
                    <td className="px-5 py-4">
                      {repo.success ? (
                        repo.isPrivate ? (
                          <span className="flex items-center text-yellow-400">
                            <Lock size={16} className="mr-1" /> Private
                          </span>
                        ) : (
                          <span className="flex items-center text-green-400">
                            <CheckCircle size={16} className="mr-1" /> Public
                          </span>
                        )
                      ) : (
                        <span className="flex items-center text-red-400">
                          <AlertTriangle size={16} className="mr-1" /> Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Repository Details Modal */}
      {selectedRepo && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRepo(null)}
        >
          <div
            className="bg-slate-800 text-slate-200 p-6 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-slate-700 pretty-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedRepo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors p-2 rounded-full hover:bg-slate-700"
            >
              <X size={24} />
            </button>

            {selectedRepo.isPrivate ? (
              <div className="text-center py-12">
                <Lock size={64} className="mx-auto text-yellow-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Private Repository</h2>
                <p className="text-slate-400 mb-4">This repository is private. Limited information available.</p>
                {selectedRepo.basic && (
                  <div className="inline-block text-left bg-slate-700/50 p-6 rounded-lg">
                    <p><strong>Name:</strong> {selectedRepo.basic.name}</p>
                    <p><strong>Full Name:</strong> {selectedRepo.basic.fullName}</p>
                    <a href={selectedRepo.basic.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline flex items-center gap-1 mt-2">
                      View on GitHub <ExternalLink size={16} />
                    </a>
                  </div>
                )}
              </div>
            ) : !selectedRepo.success ? (
              <div className="text-center py-12">
                <AlertCircle size={64} className="mx-auto text-red-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Error Loading Repository</h2>
                <p className="text-slate-400">{selectedRepo.error || 'Failed to load repository data'}</p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="mb-6 pb-4 border-b border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-purple-400">{selectedRepo.basic?.name}</h2>
                      <p className="text-slate-400 mt-1">{selectedRepo.basic?.description}</p>
                    </div>
                    <a 
                      href={selectedRepo.basic?.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      View on GitHub <ExternalLink size={16} />
                    </a>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700/40 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-400 mb-1">
                        <Star size={18} />
                        <span className="text-sm">Stars</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedRepo.stats?.stars?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-700/40 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <GitFork size={18} />
                        <span className="text-sm">Forks</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedRepo.stats?.forks?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-700/40 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-400 mb-1">
                        <Eye size={18} />
                        <span className="text-sm">Watchers</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedRepo.stats?.watchers?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-700/40 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 mb-1">
                        <Users size={18} />
                        <span className="text-sm">Contributors</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedRepo.stats?.totalContributors || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText size={18} className="text-purple-400" />
                      Basic Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Owner:</strong> {selectedRepo.basic?.owner}</p>
                      <p><strong>Default Branch:</strong> {selectedRepo.basic?.defaultBranch}</p>
                      <p><strong>License:</strong> {selectedRepo.basic?.license}</p>
                      <p><strong>Size:</strong> {selectedRepo.basic?.size} KB</p>
                      <p><strong>Created:</strong> {new Date(selectedRepo.basic?.createdAt).toLocaleDateString()}</p>
                      <p><strong>Last Updated:</strong> {new Date(selectedRepo.basic?.updatedAt).toLocaleDateString()}</p>
                      {selectedRepo.basic?.homepage && (
                        <p><strong>Homepage:</strong> <a href={selectedRepo.basic.homepage} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">{selectedRepo.basic.homepage}</a></p>
                      )}
                    </div>
                  </div>

                  {/* Languages */}
                  {selectedRepo.languages && selectedRepo.languages.length > 0 && (
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Code size={18} className="text-purple-400" />
                        Languages
                      </h3>
                      <div className="space-y-2">
                        {selectedRepo.languages.slice(0, 5).map((lang, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{lang.language}</span>
                              <span className="text-slate-400">{lang.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                style={{ width: `${lang.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  {selectedRepo.topics && selectedRepo.topics.length > 0 && (
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Tag size={18} className="text-purple-400" />
                        Topics
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedRepo.topics.map((topic, idx) => (
                          <span key={idx} className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {selectedRepo.features && (
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Package size={18} className="text-purple-400" />
                        Features
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>Issues: {selectedRepo.features.hasIssues ? '✅' : '❌'}</p>
                        <p>Wiki: {selectedRepo.features.hasWiki ? '✅' : '❌'}</p>
                        <p>Projects: {selectedRepo.features.hasProjects ? '✅' : '❌'}</p>
                        <p>Pages: {selectedRepo.features.hasPages ? '✅' : '❌'}</p>
                        <p>Discussions: {selectedRepo.features.hasDiscussions ? '✅' : '❌'}</p>
                        <p>Fork: {selectedRepo.features.fork ? '✅' : '❌'}</p>
                        <p>Template: {selectedRepo.features.template ? '✅' : '❌'}</p>
                        <p>Archived: {selectedRepo.features.archived ? '⚠️ Yes' : '✅ No'}</p>
                      </div>
                    </div>
                  )}

                  {/* Top Contributors */}
                  {selectedRepo.contributors && selectedRepo.contributors.length > 0 && (
                    <div className="bg-slate-700/30 p-4 rounded-lg md:col-span-2">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Users size={18} className="text-purple-400" />
                        Top Contributors
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedRepo.contributors.slice(0, 8).map((contributor, idx) => (
                          <a
                            key={idx}
                            href={contributor.profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-slate-600/30 rounded-lg hover:bg-slate-600/50 transition-colors"
                          >
                            <img src={contributor.avatar} alt={contributor.username} className="w-8 h-8 rounded-full" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{contributor.username}</p>
                              <p className="text-xs text-slate-400">{contributor.contributions} commits</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Commits */}
                  {selectedRepo.recentCommits && selectedRepo.recentCommits.length > 0 && (
                    <div className="bg-slate-700/30 p-4 rounded-lg md:col-span-2">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Activity size={18} className="text-purple-400" />
                        Recent Commits
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto pretty-scrollbar">
                        {selectedRepo.recentCommits.slice(0, 10).map((commit, idx) => (
                          <div key={idx} className="p-3 bg-slate-600/20 rounded-lg border border-slate-600/30">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-sm font-medium">{commit.message}</p>
                              <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-xs hover:underline">
                                {commit.sha}
                              </a>
                            </div>
                            <p className="text-xs text-slate-400">{commit.author} • {new Date(commit.date).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues & PRs */}
                  {selectedRepo.issues && (
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Issues & Pull Requests</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-slate-600/20 rounded">
                          <span>Open Issues</span>
                          <span className="font-bold text-green-400">{selectedRepo.issues.open}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-600/20 rounded">
                          <span>Closed Issues</span>
                          <span className="font-bold text-slate-400">{selectedRepo.issues.closed}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-600/20 rounded">
                          <span>Open PRs</span>
                          <span className="font-bold text-blue-400">{selectedRepo.pullRequests?.open || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-600/20 rounded">
                          <span>Closed PRs</span>
                          <span className="font-bold text-slate-400">{selectedRepo.pullRequests?.closed || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Releases */}
                  {selectedRepo.releases && selectedRepo.releases.length > 0 && (
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Package size={18} className="text-purple-400" />
                        Latest Releases
                      </h3>
                      <div className="space-y-2">
                        {selectedRepo.releases.slice(0, 5).map((release, idx) => (
                          <a
                            key={idx}
                            href={release.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 bg-slate-600/20 rounded hover:bg-slate-600/40 transition-colors"
                          >
                            <p className="text-sm font-medium">{release.name}</p>
                            <p className="text-xs text-slate-400">{release.tagName} • {new Date(release.publishedAt).toLocaleDateString()}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GithubRepoAnalyzer;
