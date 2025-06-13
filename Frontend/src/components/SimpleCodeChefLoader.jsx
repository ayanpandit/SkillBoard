import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Simplified CodeChef Profile Analyzer
const CodeChefAnalyzer = ({ fileUrl, fileName }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const processFile = async () => {
      if (fileUrl) {
        try {
          setIsLoading(true);
          setMessage(`Processing file: ${fileName || "uploaded file"}...`);
          
          // Simulate file processing
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Set mock results
          setResults([
            { username: "user1", rating: 1500, status: "success" },
            { username: "user2", rating: 1800, status: "success" },
            { username: "user3", rating: 1200, status: "success" }
          ]);
          
          setMessage("File processed successfully!");
        } catch (error) {
          console.error("Error processing file:", error);
          setMessage("Error processing file. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    processFile();
  }, [fileUrl, fileName]);

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">CodeChef Profile Analyzer</h1>
      
      {message && (
        <div className="bg-blue-600 p-4 rounded mb-6">
          {message}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {fileUrl && (
            <div className="bg-slate-800 p-4 rounded mb-6">
              <h2 className="text-xl font-bold mb-2">Processed File</h2>
              <p>Filename: {fileName}</p>
              <p>URL: {fileUrl}</p>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="bg-slate-800 p-4 rounded">
              <h2 className="text-xl font-bold mb-4">Results</h2>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700">
                    <th className="p-2 text-left">Username</th>
                    <th className="p-2 text-left">Rating</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((user, index) => (
                    <tr key={index} className="border-t border-slate-700">
                      <td className="p-2">{user.username}</td>
                      <td className="p-2">{user.rating}</td>
                      <td className="p-2">{user.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-slate-800 p-4 rounded">
              <h2 className="text-xl font-bold mb-4">Single User Search</h2>
              <input 
                type="text" 
                className="w-full bg-slate-700 border border-slate-600 rounded p-2 mb-2"
                placeholder="Enter CodeChef username"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Search
              </button>
            </div>
            
            <div className="bg-slate-800 p-4 rounded">
              <h2 className="text-xl font-bold mb-4">Bulk Upload</h2>
              <input 
                type="file"
                className="w-full bg-slate-700 border border-slate-600 rounded p-2 mb-2"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              />
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Upload
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Pulsating Loader Component
const PulsatingLoader = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400 text-xs font-semibold">
        CodeChef
      </div>
    </div>
    <p className="mt-6 text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-pulse">
      {text}
    </p>
  </div>
);

// Main Loader Component
export default function CodeChefLoader() {
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const location = useLocation();
  const { fileUrl, fileName } = location.state || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      // Start fade out animation
      setFadeOut(true);
      
      // After fade out completes, show analyzer
      setTimeout(() => {
        setShowLoader(false);
      }, 500); // 0.5s for fade out animation
      
    }, 1500); // 1.5-second loader

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  // Show loader first, then analyzer
  if (showLoader) {
    return (
      <div className={`min-h-screen bg-slate-900 text-slate-300 flex flex-col justify-center items-center transition-all duration-500 ${
        fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <PulsatingLoader text="Initializing CodeChef Analyzer..." />
      </div>
    );
  }

  // Show analyzer after loader completes with file parameters
  return <CodeChefAnalyzer fileUrl={fileUrl} fileName={fileName} />;
}
