// src/App.jsx
/*import React, { useState } from "react";
import CodeChefProfileAnalyzer from "./components/CodeChefProfileAnalyzer";
import InitialLoader from "./components/Login"; // Or "./components/InitialLoader" if you renamed the file
import "./index.css";

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  return (
    <div>
      {isAppReady ? (
        <CodeChefProfileAnalyzer />
      ) : (
        <InitialLoader onLoadingComplete={() => setIsAppReady(true)} />
      )}
    </div>
  );
}*/
/*import MaintenancePage from "./components/MaintenancePage";
import "./index.css";
export default function App() {
  return (
    <div>
      <MaintenancePage />
    </div>
  );
}*/
import "./index.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from "./components/Home";
import LeetCodeLoader from "./components/leetcodeloder";
import CodeChefLoader from "./components/codechefloder";
import About from "./components/About";
import Navbar from "./components/Navbar";

// Helper component to apply conditional background
const AppWrapper = () => {
  const location = useLocation();
  const isAnalyzerPage = location.pathname === '/codechefloder' || location.pathname === '/LeetCodeProfileAnalyze';

  return (
    <div className={`App ${isAnalyzerPage ? 'bg-[rgb(15,22,41)]' : ''}`}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/LeetCodeProfileAnalyze" element={<LeetCodeLoader />} />
        <Route path="/codechefloder" element={<CodeChefLoader />} />
        <Route path="/About" element={<About />} />
        {/* Add a catch-all route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router basename="/">
      <AppWrapper />
    </Router>
  );
}

export default App;