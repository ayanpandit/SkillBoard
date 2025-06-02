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
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from "./components/Home";
import LeetCodeLoader from "./components/leetcodeloder"; // Your LeetCode loader
import CodeChefLoader from "./components/codechefloder";   // Your CodeChef loader

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/LeetCodeProfileAnalyze" element={<LeetCodeLoader />} />
          <Route path="/codechefloder" element={<CodeChefLoader />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;