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
import Profile from "./components/Profile"; // Import Profile component
import AuthRedirect from "./components/AuthRedirect"; // Import AuthRedirect component
import { useAuth } from "./context/AuthContext"; // Import useAuth
import { Navigate } from 'react-router-dom'; // Import Navigate for protected routes

// Helper component to apply conditional background
const AppWrapper = () => {
  const location = useLocation();
  const isAnalyzerPage = location.pathname === '/codechefloder' || location.pathname === '/LeetCodeProfileAnalyze';

  return (
    <div className={`App ${isAnalyzerPage ? 'bg-[rgb(15,22,41)]' : 'bg-gray-900'}`}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/LeetCodeProfileAnalyze" element={<LeetCodeLoader />} />
        <Route path="/codechefloder" element={<CodeChefLoader />} />
        <Route path="/About" element={<About />} />        <Route 
          path="/profile"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />
        {/* Auth redirect route to handle authentication callbacks */}
        <Route path="/auth/callback" element={<AuthRedirect />} />
        {/* Add a catch-all route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  );
}


// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // You can return a loading spinner here if you want
    return <div className="text-center text-white py-10">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router basename="/">
      <AppWrapper />
    </Router>
  );
}

export default App;