import React, { useState } from "react";
import CodeChefProfileAnalyzer from "./components/CodeChefProfileAnalyzer";
import Login from "./components/Login";
import "./index.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div>
      {isLoggedIn ? (
        <CodeChefProfileAnalyzer />
      ) : (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}
