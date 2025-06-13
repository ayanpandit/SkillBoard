import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CodeChefProfileAnalyzer from './CodeChefProfileAnalyzer'; // Import the analyzer

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
  
  // Log for debugging
  useEffect(() => {
    console.log("CodeChefLoader received state:", location.state);
  }, [location.state]);

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
  }  // Show analyzer after loader completes with file parameters
  return <CodeChefProfileAnalyzer initialFileUrl={fileUrl} initialFileName={fileName} />;
}