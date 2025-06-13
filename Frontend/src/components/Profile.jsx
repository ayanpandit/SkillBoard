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
    return <p className="text-center text-white py-10">Please log in to view your profile.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-purple-400 mb-8 text-center">Your Profile</h1>
        
        {message && <p className={`mb-4 text-center p-3 rounded-md ${message.includes('Error') ? 'bg-red-500/30 text-red-300' : 'bg-green-500/30 text-green-300'}`}>{message}</p>}

        <form onSubmit={handleUpdateProfile} className="space-y-6 mb-10">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input 
              type="text" 
              id="name" 
              value={name} 
              onChange={handleNameChange} 
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email (Cannot be changed here)</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              readOnly 
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400 cursor-not-allowed"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-md hover:from-purple-700 hover:to-pink-700 transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">Upload Files (CSV/Excel)</h2>
          <div>
            <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-300 mb-1">Select File</label>
            <input 
              type="file" 
              id="fileUpload"
              onChange={handleFileChange} 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition"
            />
          </div>
          <button 
            onClick={handleFileUpload} 
            disabled={loading || !file}
            className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-md hover:from-green-600 hover:to-teal-600 transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">Your Uploaded Files</h2>
          {uploadedFiles.length > 0 ? (
            <ul className="space-y-3">
              {uploadedFiles.map((f, index) => (                <li key={index} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                  <span className="truncate text-gray-300">{f.name}</span>
                  <button 
                    onClick={() => handleFileOptions(f)} 
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition text-sm"
                  >
                    Options
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center">No files uploaded yet.</p>
          )}
        </div>        {/* File Options Popup */}
        {showPopup && popupFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full" ref={popupRef}>
              <h3 className="text-lg font-semibold text-purple-400 mb-4">File Options</h3>
              <p className="text-gray-300 mb-4">What would you like to do with <span className="font-medium">{popupFile.name}</span>?</p>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    window.open(popupFile.url, '_blank');
                  }}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition flex items-center justify-center"
                >
                  <span>Open in View Mode</span>
                </button>
                
                <a 
                  href={popupFile.url} 
                  download
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-500 transition flex items-center justify-center"
                >
                  <span>Download File</span>
                </a>
                  <button 
                  onClick={() => {
                    // Navigate to CodeChef analyzer with file URL for bulk upload
                    navigate('/codechefloder', { 
                      state: { 
                        fileUrl: popupFile.url, 
                        fileName: popupFile.name 
                      } 
                    });
                    setShowPopup(false);
                  }}
                  className="w-full py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-500 transition flex items-center justify-center"
                >
                  <span>Open in CodeChef Analyzer</span>
                </button>
                
                <button 
                  onClick={() => {
                    // Navigate to LeetCode analyzer with file URL for bulk upload
                    navigate('/LeetCodeProfileAnalyze', { state: { fileUrl: popupFile.url, fileName: popupFile.name } });
                    setShowPopup(false);
                  }}
                  className="w-full py-2 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-500 transition flex items-center justify-center"
                >
                  <span>Open in LeetCode Analyzer</span>
                </button>
                
                <button 
                  onClick={handleDeleteFile}
                  className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-500 transition flex items-center justify-center"
                >
                  <span>{loading ? 'Deleting...' : 'Delete File'}</span>
                </button>
                
                <button 
                  onClick={() => setShowPopup(false)}
                  className="w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition flex items-center justify-center mt-2"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
