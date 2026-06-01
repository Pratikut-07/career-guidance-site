import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import logo from "./logo.png";

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="Life Compass Logo" className="nav-logo" />
          Life Compass
        </Link>
        <div className="nav-items">
          {user ? (
            <>
              <span className="welcome-text">Welcome, {user.username}!</span>
              <button onClick={onLogout} className="nav-button outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-button outline">
                Login
              </Link>
              <Link to="/signup" className="nav-button solid">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;