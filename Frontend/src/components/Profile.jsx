import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [popupFile, setPopupFile] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      // Set email from currentUser object
      setEmail(currentUser.email);
      
      // Set name from user_metadata if available, otherwise use the email username
      setName(currentUser.user_metadata?.full_name || currentUser.email.split('@')[0] || '');
      
      // Fetch user files
      fetchUserFiles();
    }
  }, [currentUser]);
  const fetchUserFiles = async () => {
    if (!currentUser) return;
    try {      // Try to list files - make sure bucket name matches exactly what's in Supabase dashboard
      console.log("Attempting to list files from bucket 'user-files'");
      const { data, error } = await supabase
        .storage
        .from('user-files')
        .list(`${currentUser.id}/`); // List files in the user's folder

      if (error) {
        console.error("List files error:", error);
        if (error.message.includes('bucket') || error.statusCode === 404) {
          setMessage("Unable to access the 'user-files' bucket. Please verify it exists in your Supabase dashboard and has correct permissions.");
        } else {
          setMessage(`Error listing files: ${error.message || 'Unknown error'}`);
        }
        setUploadedFiles([]);
        return;
      }

      console.log("Files from bucket:", data);
      
      if (data && data.length > 0) {
        // Get URLs for each file
        const filesWithUrls = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = supabase
              .storage
              .from('user-files')
              .getPublicUrl(`${currentUser.id}/${file.name}`);
            
            return {
              name: file.name,
              url: urlData?.publicUrl || '#'
            };
          })
        );
        
        setUploadedFiles(filesWithUrls);
        setMessage(''); // Clear any previous error messages on success
      } else {
        setUploadedFiles([]);
        // If no files found but operation succeeded, clear error message
        setMessage('');
      }
    } catch (error) {
      console.error("Error fetching user files:", error);
      setMessage(`Error fetching files: ${error.message || 'Unknown error'}`);
      setUploadedFiles([]);
    }
  };

  const handleNameChange = (e) => setName(e.target.value);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    if (!currentUser) {
      setMessage('No user logged in.');
      setLoading(false);
      return;
    }

    try {
      // Update user metadata in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name }
      });

      if (error) {
        throw error;
      }

      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile: ", error);
      setMessage('Error updating profile.');
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleFileUpload = async () => {
    if (!file || !currentUser) {
      setMessage('Please select a file to upload.');
      return;
    }
    setLoading(true);
    setMessage('');
    
    try {      // Try to upload - make sure bucket name matches exactly what's in Supabase dashboard
      console.log("Attempting to upload to bucket 'user-files'");
      const filePath = `${currentUser.id}/${file.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from('user-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Overwrite if file exists
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        if (uploadError.message.includes('bucket') || uploadError.statusCode === 404) {
          setMessage("Unable to access the 'user-files' bucket. Please verify it exists in your Supabase dashboard and has correct permissions.");
        } else {
          setMessage(`Error uploading file: ${uploadError.message || 'Upload failed'}`);
        }
        return;
      }

      setMessage('File uploaded successfully!');
      setFile(null); // Clear file input
      fetchUserFiles(); // Refresh file list
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage(`Error uploading file: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileOptions = (file) => {
    setPopupFile(file);
    setShowPopup(true);
  };

  const handleDeleteFile = async () => {
    if (!popupFile || !currentUser) return;
    setLoading(true);
    setMessage('');
    
    try {
      // Delete file from Supabase Storage
      const { error } = await supabase
        .storage
        .from('user-files')
        .remove([`${currentUser.id}/${popupFile.name}`]);

      if (error) {
        throw error;
      }

      setMessage('File deleted successfully!');
      setShowPopup(false);
      fetchUserFiles(); // Refresh file list
    } catch (error) {
      console.error("Error deleting file:", error);
      setMessage(`Error deleting file: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-32 px-4">
        <div className="text-center bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-700">
          <p className="text-gray-300 text-lg">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3">
            Your Profile
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage your account and uploaded files</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg shadow-lg border ${
            message.includes('Error') 
              ? 'bg-red-500/20 border-red-500/50 text-red-300' 
              : 'bg-green-500/20 border-green-500/50 text-green-300'
          }`}>
            <p className="text-center text-sm sm:text-base">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                  {name.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-semibold text-white mb-1">{name || 'User'}</h2>
                <p className="text-gray-400 text-sm break-all text-center px-2">{email}</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input 
                    type="text" 
                    id="name" 
                    value={name} 
                    onChange={handleNameChange} 
                    className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 transition-all duration-200"
                    placeholder="Your Name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={email} 
                    readOnly 
                    className="w-full px-4 py-2.5 bg-gray-700/30 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - File Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Upload Files</h2>
                  <p className="text-gray-400 text-sm">CSV or Excel files</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-300 mb-2">
                    Select File
                  </label>
                  <input 
                    type="file" 
                    id="fileUpload"
                    onChange={handleFileChange} 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="w-full text-sm text-gray-400 
                      file:mr-4 file:py-2.5 file:px-6 
                      file:rounded-lg file:border-0 
                      file:text-sm file:font-semibold 
                      file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 
                      file:text-white hover:file:from-purple-700 hover:file:to-pink-700 
                      file:cursor-pointer file:transition-all file:duration-300
                      cursor-pointer bg-gray-700/30 rounded-lg p-2 border border-gray-600"
                  />
                  {file && (
                    <p className="text-sm text-green-400 mt-2">Selected: {file.name}</p>
                  )}
                </div>
                
                <button 
                  onClick={handleFileUpload} 
                  disabled={loading || !file}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload File
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Uploaded Files Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Your Files</h2>
                    <p className="text-gray-400 text-sm">{uploadedFiles.length} file(s) uploaded</p>
                  </div>
                </div>
              </div>

              {uploadedFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {uploadedFiles.map((f, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-200 truncate">{f.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">Click options to manage</p>
                        </div>
                        <button 
                          onClick={() => handleFileOptions(f)} 
                          className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-purple-500/50 transform group-hover:scale-105"
                        >
                          Options
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400 text-base">No files uploaded yet</p>
                  <p className="text-gray-500 text-sm mt-1">Upload your first file to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File Options Popup */}
        {showPopup && popupFile && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div 
              className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 animate-slideUp" 
              ref={popupRef}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">File Options</h3>
                  <p className="text-sm text-gray-400">Choose an action</p>
                </div>
              </div>
              
              <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <p className="text-gray-300 text-sm break-all">
                  <span className="font-medium text-purple-400">File:</span> {popupFile.name}
                </p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    try {
                      if (!popupFile?.url || popupFile.url === '#') {
                        setMessage('Error: File URL is not available');
                        return;
                      }
                      window.open(popupFile.url, '_blank', 'noopener,noreferrer');
                    } catch (error) {
                      console.error('Error opening file:', error);
                      setMessage('Error opening file');
                    }
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-blue-500/50 transform hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View File
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      if (!popupFile?.url || popupFile.url === '#') {
                        setMessage('Error: File URL is not available');
                        return;
                      }
                      
                      // Fetch the file and trigger download
                      const response = await fetch(popupFile.url);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = popupFile.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      setMessage('File downloaded successfully!');
                    } catch (error) {
                      console.error('Error downloading file:', error);
                      setMessage('Error downloading file. Trying alternative method...');
                      // Fallback: open in new tab
                      window.open(popupFile.url, '_blank');
                    }
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>

                <button 
                  onClick={() => {
                    try {
                      if (!popupFile?.url || popupFile.url === '#') {
                        setMessage('Error: File URL is not available');
                        return;
                      }
                      navigate('/codechefloder', { 
                        state: { 
                          fileUrl: popupFile.url, 
                          fileName: popupFile.name 
                        } 
                      });
                      setShowPopup(false);
                    } catch (error) {
                      console.error('Error navigating to CodeChef analyzer:', error);
                      setMessage('Error opening CodeChef analyzer');
                    }
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-orange-500/50 transform hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  CodeChef Analyzer
                </button>
                
                <button 
                  onClick={() => {
                    try {
                      if (!popupFile?.url || popupFile.url === '#') {
                        setMessage('Error: File URL is not available');
                        return;
                      }
                      navigate('/leetcodeloder', { 
                        state: { 
                          fileUrl: popupFile.url, 
                          fileName: popupFile.name 
                        } 
                      });
                      setShowPopup(false);
                    } catch (error) {
                      console.error('Error navigating to LeetCode analyzer:', error);
                      setMessage('Error opening LeetCode analyzer');
                    }
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-yellow-500/50 transform hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  LeetCode Analyzer
                </button>
                
                <button 
                  onClick={handleDeleteFile}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-red-500/50 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {loading ? 'Deleting...' : 'Delete File'}
                </button>
                
                <button 
                  onClick={() => setShowPopup(false)}
                  className="w-full py-3 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Profile;
