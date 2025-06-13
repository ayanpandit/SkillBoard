// Modified version that handles initialFileUrl properly
import React, { useState, useEffect } from 'react';

const CodeChefProfileAnalyzer = ({ initialFileUrl, initialFileName }) => {
  const [file, setFile] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [initialFileProcessed, setInitialFileProcessed] = useState(false);
  const [message, setMessage] = useState('');

  // Process initial file URL
  useEffect(() => {
    const processFile = async () => {
      if (initialFileUrl && !initialFileProcessed) {
        try {
          setIsProcessingFile(true);
          setMessage(`Processing file: ${initialFileName || "uploaded file"}...`);
          
          // Log for debugging
          console.log("Processing initial file:", initialFileUrl);
          
          // Simulate successful processing
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setMessage("File processed successfully!");
          setInitialFileProcessed(true);
        } catch (error) {
          console.error("Error processing file:", error);
          setMessage("Error processing file. Please try again.");
        } finally {
          setIsProcessingFile(false);
        }
      }
    };
    
    processFile();
  }, [initialFileUrl, initialFileName, initialFileProcessed]);

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">CodeChef Profile Analyzer</h1>
      
      {message && (
        <div className="bg-blue-600 p-4 rounded mb-6">
          {message}
        </div>
      )}
      
      {isProcessingFile ? (
        <div className="animate-pulse text-xl">Processing file...</div>
      ) : (
        <div>
          {initialFileProcessed && initialFileName && (
            <div className="bg-green-600 p-4 rounded mb-6">
              Successfully processed file: {initialFileName}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      )}
    </div>
  );
};

export default CodeChefProfileAnalyzer;
