import React, { useState } from "react";
import "../styles/Purpose.css";
import AssessmentSteps from "../components/assessment/AssessmentSteps";

function Purpose() {
  const [isStarted, setIsStarted] = useState(false);

  return (
    <div className="purpose-container">
      {!isStarted ? (
        <div className="purpose-intro">
          <h1>Find Your Career Purpose</h1>
          <div className="purpose-description">
            <p>
              Welcome to our Career Purpose Assessment! This interactive journey
              will help you discover career paths that align with your
              interests, skills, and aspirations.
            </p>
            <p>Through this assessment, we'll explore:</p>
            <ul>
              <li>Your preferred career location (India or International)</li>
              <li>Your current education level</li>
              <li>Your interests, skills, and personality traits</li>
            </ul>
            <p>
              Based on your responses, we'll provide personalized career
              recommendations that match your profile.
            </p>
          </div>
          <button
            className="start-assessment-btn"
            onClick={() => setIsStarted(true)}
          >
            Start Assessment
          </button>
        </div>
      ) : (
        <div className="assessment-container">
          <AssessmentSteps />
        </div>
      )}
    </div>
  );
}

export default Purpose;
