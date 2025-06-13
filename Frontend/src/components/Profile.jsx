import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const Profile = () => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
              {uploadedFiles.map((f, index) => (
                <li key={index} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                  <span className="truncate text-gray-300">{f.name}</span>
                  <a 
                    href={f.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-purple-400 hover:text-purple-300 transition duration-200 text-sm"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center">No files uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
