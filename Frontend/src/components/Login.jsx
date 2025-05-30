// src/components/Login.jsx
import React, { useEffect } from "react";

// Pulsating Loader Component (remains the same)
const PulsatingLoader = ({ text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center h-full">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-400 text-xs font-semibold">
                CodeChef
            </div>
        </div>
        <p className="mt-6 text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse">
            {text}
        </p>
    </div>
);

export default function InitialLoader({ onLoadingComplete }) { // Renamed for clarity, but you can keep Login if you prefer
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onLoadingComplete) {
                onLoadingComplete();
            }
        }, 1500); // 1.5-second loader

        return () => clearTimeout(timer); // Cleanup timer on component unmount
    }, [onLoadingComplete]);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col justify-center items-center">
            <PulsatingLoader text="Initializing Analyzer..." />
        </div>
    );
}