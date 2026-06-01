import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";
const Home = ({ user }) => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="main-title">Welcome to Life Compass</h1>
        {user ? (
          <div className="content-section">
            <p className="welcome-text">Hello {user.username}!</p>
            <p className="description-text">
              Ready to continue your journey? Explore your career path and
              discover your potential.
            </p>
            <div className="button-group">
              <div className="button-container">
                <Link to="/purpose" className="cta-button">
                  Find Your Purpose
                  <span className="button-description">
                    Find out the career options aligned with you
                  </span>
                </Link>
              </div>
              <div className="button-container">
                <Link to="/roadmap" className="cta-button">
                  Generate Roadmap
                  <span className="button-description">
                    Plan your learning path for your chosen career option
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="content-section">
            <p className="hero-text">Discover Your Path, Shape Your Future</p>
            <p className="description-text">
              Life Compass helps you navigate your career journey with
              personalized guidance, expert insights, and practical roadmaps to
              success.
            </p>
            <Link to="/login" className="cta-button">
              Start Your Journey
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
