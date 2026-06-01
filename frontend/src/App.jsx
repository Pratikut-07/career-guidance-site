import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Purpose from "./pages/Purpose";
import RoadmapGenerator from "./components/roadmap/RoadmapGenerator";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

function App() {
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  );

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <div className="container">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route
                path="/login"
                element={
                  user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
                }
              />
              <Route
                path="/signup"
                element={user ? <Navigate to="/" /> : <Signup />}
              />
              <Route
                path="/purpose"
                element={user ? <Purpose /> : <Navigate to="/login" />}
              />
              <Route
                path="/roadmap"
                element={user ? <RoadmapGenerator /> : <Navigate to="/login" />}
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
