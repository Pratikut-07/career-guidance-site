import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Target, Clock, TrendingUp, Sparkles, History, Trash2, Eye, ChevronRight, Award, BookOpen, Rocket, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import "./RoadmapGenerator.css";

const KNOWLEDGE_LEVELS = [
  { value: "Beginner", label: "Beginner", icon: "🌱", description: "Just starting out" },
  { value: "Intermediate", label: "Intermediate", icon: "🚀", description: "Have some experience" },
  { value: "Advanced", label: "Advanced", icon: "⭐", description: "Expert level knowledge" }
];

const TIMELINES = [
  { value: "1 month (Quick Learning)", label: "1 Month", icon: "⚡", description: "Quick & Intensive" },
  { value: "2-3 months (Comprehensive Learning)", label: "2-3 Months", icon: "📚", description: "Comprehensive" },
  { value: "6 months (Deep Learning)", label: "6 Months", icon: "🎯", description: "Deep Dive" },
  { value: "1 year (Expert Level)", label: "1 Year", icon: "🏆", description: "Master Level" }
];

function RoadmapGenerator() {
  const location = useLocation();
  const initialCareerTitle = location.state?.careerTitle || "";

  const [careerTitle, setCareerTitle] = useState(initialCareerTitle);
  const [knowledgeLevel, setKnowledgeLevel] = useState("");
  const [timeline, setTimeline] = useState("");
  const [goal, setGoal] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapHistory, setRoadmapHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});

  useEffect(() => {
    fetchRoadmapHistory();
  }, []);

  const fetchRoadmapHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view roadmap history");
        return;
      }

      const response = await fetch("http://localhost:5000/roadmap/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch roadmap history");

      setRoadmapHistory(data.roadmaps);
    } catch (error) {
      setError(error.message);
    }
  };

  const generateRoadmap = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to generate a roadmap");
        return;
      }

      const response = await fetch("http://localhost:5000/roadmap/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          career_title: careerTitle,
          knowledge_level: knowledgeLevel,
          timeline,
          goal,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate roadmap");

      setRoadmap(data.roadmap);
      setCompletedSteps({});
      fetchRoadmapHistory();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoadmap = async (roadmapId) => {
    setDeleteLoading(roadmapId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to delete a roadmap");
        return;
      }

      const response = await fetch(`http://localhost:5000/roadmap/delete/${roadmapId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete roadmap");

      fetchRoadmapHistory();
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleStepCompletion = (phaseIndex, stepIndex) => {
    const key = `${phaseIndex}-${stepIndex}`;
    setCompletedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const parseRoadmapContent = (content) => {
    if (!content) return [];
    
    const lines = content.split('\n').filter(line => line.trim());
    const phases = [];
    let currentPhase = null;

    lines.forEach((line, index) => {
      // Check if it's a header (starts with #, ##, or looks like a phase/week)
      if (line.match(/^#{1,3}\s/) || 
          line.match(/^(Phase|Week|Month|Step|Stage)\s*\d+/i) ||
          line.match(/^\d+\.\s*[A-Z]/)) {
        
        // Save previous phase
        if (currentPhase && currentPhase.steps.length > 0) {
          phases.push(currentPhase);
        }

        // Start new phase
        const title = line.replace(/^#{1,3}\s*/, '').replace(/^\d+\.\s*/, '').trim();
        currentPhase = {
          title: title,
          steps: [],
          duration: estimateDuration(index, phases.length)
        };
      } else if (currentPhase && line.trim()) {
        // Add as step to current phase
        const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (cleanLine && !cleanLine.startsWith('(http')) {
          currentPhase.steps.push(cleanLine);
        }
      }
    });

    // Add last phase
    if (currentPhase && currentPhase.steps.length > 0) {
      phases.push(currentPhase);
    }

    // If no phases detected, create a simple structure
    if (phases.length === 0) {
      const allSteps = lines
        .map(line => line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
        .filter(line => line && !line.startsWith('(http'));
      
      // Group into phases of 5 steps each
      for (let i = 0; i < allSteps.length; i += 5) {
        phases.push({
          title: `Phase ${Math.floor(i / 5) + 1}`,
          steps: allSteps.slice(i, i + 5),
          duration: estimateDuration(i / 5, Math.ceil(allSteps.length / 5))
        });
      }
    }

    return phases;
  };

  const estimateDuration = (index, total) => {
    const durations = ['1-2 weeks', '2-3 weeks', '3-4 weeks', '1 month', '2 months'];
    return durations[Math.min(index, durations.length - 1)];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <Sparkles className="sparkle-icon" size={48} />
          <h2>Crafting Your Perfect Roadmap</h2>
          <p>Our AI is analyzing your goals and creating a personalized learning path...</p>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="roadmap-generator">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">
            <Rocket size={48} />
          </div>
          <h1 className="hero-title">Your Learning Journey Starts Here</h1>
          <p className="hero-subtitle">
            Get a personalized roadmap tailored to your goals, experience, and timeline
          </p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">✕</button>
        </div>
      )}

      <div className="main-content">
        <div className="controls-bar">
          <button
            className={`history-toggle-btn ${showHistory ? "active" : ""}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={20} />
            <span>{showHistory ? "Create New Roadmap" : "View History"}</span>
            <ChevronRight size={16} className={`chevron ${showHistory ? "rotate" : ""}`} />
          </button>
        </div>

        {showHistory ? (
          <div className="history-section">
            <div className="history-header">
              <h2>
                <History size={28} />
                Your Roadmap History
              </h2>
              <p>Review and revisit your previous learning paths</p>
            </div>

            {roadmapHistory.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={64} className="empty-icon" />
                <h3>No Roadmaps Yet</h3>
                <p>Create your first personalized learning roadmap to get started!</p>
                <button onClick={() => setShowHistory(false)} className="cta-button">
                  Create Roadmap
                </button>
              </div>
            ) : (
              <div className="history-grid">
                {roadmapHistory.map((item) => (
                  <div key={item.id} className="history-card">
                    <div className="history-card-header">
                      <Award className="card-icon" size={24} />
                      <h3>{item.career_title}</h3>
                    </div>
                    <div className="history-card-body">
                      <div className="history-info">
                        <span className="info-badge">
                          <TrendingUp size={16} />
                          {item.knowledge_level}
                        </span>
                        <span className="info-badge">
                          <Clock size={16} />
                          {item.timeline}
                        </span>
                      </div>
                      <p className="history-date">
                        Created on {new Date(item.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="history-card-actions">
                      <button onClick={() => { setRoadmap(item); setCompletedSteps({}); }} className="view-btn">
                        <Eye size={16} />
                        View
                      </button>
                      <button 
                        onClick={() => handleDeleteRoadmap(item.id)} 
                        className="delete-btn"
                        disabled={deleteLoading === item.id}
                      >
                        {deleteLoading === item.id ? (
                          "Deleting..."
                        ) : (
                          <>
                            <Trash2 size={16} />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={generateRoadmap} className="roadmap-form">
            <div className="form-card">
              <div className="form-section">
                <div className="section-header">
                  <Target size={24} />
                  <h3>Career Goal</h3>
                </div>
                <div className="form-group">
                  <label htmlFor="careerTitle">What career path are you pursuing?</label>
                  <input
                    type="text"
                    id="careerTitle"
                    value={careerTitle}
                    onChange={(e) => setCareerTitle(e.target.value)}
                    placeholder="e.g., Full Stack Developer, Data Scientist, UI/UX Designer..."
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <TrendingUp size={24} />
                  <h3>Current Level</h3>
                </div>
                <div className="form-group">
                  <label>Where are you in your learning journey?</label>
                  <div className="card-options">
                    {KNOWLEDGE_LEVELS.map((level) => (
                      <label key={level.value} className={`option-card ${knowledgeLevel === level.value ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="knowledge"
                          value={level.value}
                          checked={knowledgeLevel === level.value}
                          onChange={(e) => setKnowledgeLevel(e.target.value)}
                          required
                        />
                        <div className="option-content">
                          <span className="option-icon">{level.icon}</span>
                          <span className="option-label">{level.label}</span>
                          <span className="option-description">{level.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <Clock size={24} />
                  <h3>Timeline</h3>
                </div>
                <div className="form-group">
                  <label>How much time can you dedicate?</label>
                  <div className="card-options timeline-options">
                    {TIMELINES.map((time) => (
                      <label key={time.value} className={`option-card ${timeline === time.value ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="timeline"
                          value={time.value}
                          checked={timeline === time.value}
                          onChange={(e) => setTimeline(e.target.value)}
                          required
                        />
                        <div className="option-content">
                          <span className="option-icon">{time.icon}</span>
                          <span className="option-label">{time.label}</span>
                          <span className="option-description">{time.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <Sparkles size={24} />
                  <h3>Your Vision</h3>
                </div>
                <div className="form-group">
                  <label htmlFor="goal">Describe your ideal role or dream position</label>
                  <textarea
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="I want to become a senior software engineer at a tech company, specializing in cloud architecture and leading development teams..."
                    required
                    className="form-textarea"
                    rows="4"
                  />
                </div>
              </div>

              <button type="submit" className="generate-button">
                <Sparkles size={20} />
                Generate My Roadmap
                <ChevronRight size={20} />
              </button>
            </div>
          </form>
        )}

        {roadmap && (
          <div className="roadmap-display">
            <div className="roadmap-header">
              <div className="roadmap-title-section">
                <Rocket size={32} />
                <div>
                  <h2>Your Personalized Learning Roadmap</h2>
                  <p>Follow this path to achieve your career goals</p>
                </div>
              </div>
            </div>

            <div className="roadmap-meta">
              <div className="meta-card">
                <Target size={20} />
                <div>
                  <span className="meta-label">Career Path</span>
                  <span className="meta-value">{roadmap.career_title}</span>
                </div>
              </div>
              <div className="meta-card">
                <TrendingUp size={20} />
                <div>
                  <span className="meta-label">Your Level</span>
                  <span className="meta-value">{roadmap.knowledge_level}</span>
                </div>
              </div>
              <div className="meta-card">
                <Clock size={20} />
                <div>
                  <span className="meta-label">Timeline</span>
                  <span className="meta-value">{roadmap.timeline}</span>
                </div>
              </div>
            </div>

            <div className="roadmap-goal-card">
              <Sparkles size={24} />
              <div>
                <h3>Your Goal</h3>
                <p>{roadmap.goal}</p>
              </div>
            </div>

            {/* Visual Flowchart Roadmap */}
            <div className="flowchart-container">
              <h3 className="flowchart-title">
                <Award size={24} />
                Your Learning Path
              </h3>
              
              <div className="flowchart-wrapper">
                {parseRoadmapContent(roadmap.content).map((phase, phaseIndex) => (
                  <div key={phaseIndex} className="phase-container">
                    {/* Phase Header */}
                    <div className="phase-header">
                      <div className="phase-number">{phaseIndex + 1}</div>
                      <div className="phase-info">
                        <h4 className="phase-title">{phase.title}</h4>
                        <div className="phase-duration">
                          <Clock size={14} />
                          <span>{phase.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Steps in Phase */}
                    <div className="steps-container">
                      {phase.steps.map((step, stepIndex) => {
                        const stepKey = `${phaseIndex}-${stepIndex}`;
                        const isCompleted = completedSteps[stepKey];
                        
                        return (
                          <div key={stepIndex} className="step-wrapper">
                            <div 
                              className={`step-card ${isCompleted ? 'completed' : ''}`}
                              onClick={() => toggleStepCompletion(phaseIndex, stepIndex)}
                            >
                              <div className="step-checkbox">
                                {isCompleted ? (
                                  <CheckCircle2 size={20} className="check-icon" />
                                ) : (
                                  <Circle size={20} className="circle-icon" />
                                )}
                              </div>
                              <div className="step-content">
                                <p className="step-text">{step}</p>
                              </div>
                            </div>
                            
                            {/* Connector Arrow */}
                            {stepIndex < phase.steps.length - 1 && (
                              <div className="step-connector">
                                <ArrowRight size={20} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Phase Connector */}
                    {phaseIndex < parseRoadmapContent(roadmap.content).length - 1 && (
                      <div className="phase-connector">
                        <div className="connector-line"></div>
                        <div className="connector-arrow">
                          <ArrowRight size={28} />
                        </div>
                      </div>
                    )}

                    {/* Milestone Marker */}
                    {phaseIndex === parseRoadmapContent(roadmap.content).length - 1 && (
                      <div className="milestone-marker">
                        <Award size={40} />
                        <p>Goal Achieved!</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoadmapGenerator;