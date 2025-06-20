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
// ✅ FIXED App.jsx with proper lowercase routing and normalization
import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate
} from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from "./components/Home";
import LeetCodeLoader from "./components/leetcodeloder";
import CodeChefLoader from "./components/codechefloder";
import About from "./components/About";
import Navbar from "./components/Navbar";
import Profile from "./components/Profile";
import AuthRedirect from "./components/AuthRedirect";
import { useAuth } from "./context/AuthContext";
import { ToastProvider } from './context/ToastContext';
import SEO from './components/SEO';

const AppWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;
  const isAnalyzerPage = pathname.toLowerCase() === '/codechefloder' || 
                          pathname.toLowerCase() === '/leetcodeprofileanalyze';

  useEffect(() => {
    const path = location.pathname;
    if (path !== path.toLowerCase()) {
      navigate(path.toLowerCase(), { replace: true });
      return;
    }

    const params = new URLSearchParams(location.search);
    const routeParam = params.get('route');
    if (routeParam) {
      navigate(`/${routeParam.toLowerCase()}`, { replace: true });
      return;
    }

    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath && path === '/') {
      sessionStorage.removeItem('redirectPath');
      navigate(redirectPath.toLowerCase(), { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className={`App ${isAnalyzerPage ? 'bg-[rgb(15,22,41)]' : 'bg-gray-900'}`}>
      <Navbar />
      <SEO />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/leetcodeprofileanalyze" element={<LeetCodeLoader />} />
        <Route path="/codechefloder" element={<CodeChefLoader />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/auth/callback" element={<AuthRedirect />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
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
      <ToastProvider>
        <AppWrapper />
      </ToastProvider>
    </Router>
  );
}

export default App;
