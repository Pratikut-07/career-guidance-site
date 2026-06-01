import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { MapPin, Briefcase, GraduationCap, HelpCircle, Target, CheckCircle, ArrowRight, ArrowLeft, Sparkles, TrendingUp, Video } from "lucide-react";
import "/src/components/assessment/AssessmentSteps.css";
import RoadmapGenerator from "../roadmap/RoadmapGenerator";

function AssessmentSteps() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [categories, setCategories] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch location options
  const handleLocationStep = async () => {
    try {
      const response = await fetch("http://localhost:5000/purpose/location");
      const data = await response.json();
      return data.options;
    } catch (err) {
      setError("Failed to fetch location options");
      return [];
    }
  };

  // Fetch career categories based on location
  const fetchCategories = async (selectedLocation) => {
    try {
      const response = await fetch(
        `http://localhost:5000/purpose/categories?location=${selectedLocation}`
      );
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError("Failed to fetch career categories");
    }
  };

  // Fetch questions based on education level
  const fetchQuestions = async (level) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/purpose/questions?level=${encodeURIComponent(level)}`
      );
      const data = await response.json();
      const questionsList = data.questions.split("\n").filter((q) => q.trim());
      setQuestions(questionsList);
    } catch (err) {
      setError("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  // Submit answers and get recommendations
  const submitAssessment = async () => {
    try {
      setError(null);

      if (!location) {
        setError("Please select a location");
        return;
      }
      if (!selectedCategory) {
        setError("Please select a career category");
        return;
      }
      if (!educationLevel) {
        setError("Please select your education level");
        return;
      }

      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to submit the assessment");
        setLoading(false);
        return;
      }

      const answersArray = [];
      for (let i = 0; i < questions.length; i++) {
        const answer = answers[i];
        if (!answer || !answer.trim()) {
          setError(`Please answer question ${i + 1}`);
          setLoading(false);
          return;
        }
        answersArray.push(answer.trim());
      }

      const requestData = {
        location,
        educationLevel,
        selectedCategory,
        answers: answersArray,
      };

      const response = await fetch("http://localhost:5000/purpose/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          setError("Your session has expired. Please log in again.");
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to get recommendations");
      }

      if (data.recommended_careers && data.recommended_careers.length > 0) {
        setRecommendations(data.recommended_careers);
        setStep(5);
        setError(null);
      } else {
        throw new Error("No recommendations received");
      }
    } catch (error) {
      setError(error.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  // Location Selection Step
  const LocationStep = () => (
    <div className="assessment-step fade-in">
      <div className="step-icon">
        <MapPin size={48} />
      </div>
      <h2>Select Your Preferred Career Location</h2>
      <p className="step-description">Choose where you'd like to build your career</p>
      
      <div className="location-cards">
        <div 
          className={`location-card ${location === "India" ? "selected" : ""}`}
          onClick={() => {
            setLocation("India");
            fetchCategories("India");
          }}
        >
          <div className="location-icon">🇮🇳</div>
          <h3>India</h3>
          <p>Explore careers within India</p>
          {location === "India" && <CheckCircle className="check-icon" size={24} />}
        </div>
        
        <div 
          className={`location-card ${location === "International" ? "selected" : ""}`}
          onClick={() => {
            setLocation("International");
            fetchCategories("International");
          }}
        >
          <div className="location-icon">🌎</div>
          <h3>International</h3>
          <p>Explore global opportunities</p>
          {location === "International" && <CheckCircle className="check-icon" size={24} />}
        </div>
      </div>
      
      {location && (
        <button className="next-btn" onClick={() => setStep(2)}>
          Continue
          <ArrowRight size={20} />
        </button>
      )}
    </div>
  );

  // Career Category Selection Step
  const CategoryStep = () => (
    <div className="assessment-step fade-in">
      <div className="step-icon">
        <Briefcase size={48} />
      </div>
      <h2>Select Your Career Category</h2>
      <p className="step-description">Choose the field that interests you most</p>
      
      <div className="categories-grid">
        {Object.entries(categories).map(([key, category]) => (
          <div 
            key={key} 
            className={`category-card ${selectedCategory === key ? "selected" : ""}`}
          >
            <div className="category-header">
              <h3>{category.title}</h3>
              {selectedCategory === key && <CheckCircle className="check-icon" size={20} />}
            </div>
            <p className="category-description">{category.description}</p>
            <div className="category-actions">
              <button
                className={`select-btn ${selectedCategory === key ? "selected" : ""}`}
                onClick={() => setSelectedCategory(key)}
              >
                {selectedCategory === key ? "Selected" : "Select"}
              </button>
              <a
                href={category.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="know-more-btn"
              >
                <Video size={16} />
                Learn More
              </a>
            </div>
          </div>
        ))}
      </div>
      
      {selectedCategory && (
        <div className="navigation-buttons">
          <button className="back-btn" onClick={() => setStep(1)}>
            <ArrowLeft size={20} />
            Back
          </button>
          <button className="next-btn" onClick={() => setStep(3)}>
            Continue
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );

  // Education Level Step
  const EducationStep = () => {
    const educationLevels = [
      { value: "School Student", icon: "📚", description: "Currently in school" },
      { value: "College Student", icon: "🎓", description: "Pursuing undergraduate" },
      { value: "University Student", icon: "🏛️", description: "Higher education" },
      { value: "Graduate", icon: "🎯", description: "Completed graduation" }
    ];

    return (
      <div className="assessment-step fade-in">
        <div className="step-icon">
          <GraduationCap size={48} />
        </div>
        <h2>Select Your Education Level</h2>
        <p className="step-description">Tell us about your current educational status</p>
        
        <div className="education-grid">
          {educationLevels.map((level) => (
            <div
              key={level.value}
              className={`education-card ${educationLevel === level.value ? "selected" : ""}`}
              onClick={() => {
                setEducationLevel(level.value);
                fetchQuestions(level.value);
              }}
            >
              <div className="education-icon">{level.icon}</div>
              <h3>{level.value}</h3>
              <p>{level.description}</p>
              {educationLevel === level.value && <CheckCircle className="check-icon" size={24} />}
            </div>
          ))}
        </div>
        
        {educationLevel && (
          <div className="navigation-buttons">
            <button className="back-btn" onClick={() => setStep(2)}>
              <ArrowLeft size={20} />
              Back
            </button>
            <button className="next-btn" onClick={() => setStep(4)}>
              Continue
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Questions Step
  const QuestionsStep = () => (
    <div className="assessment-step fade-in">
      <div className="step-icon">
        <HelpCircle size={48} />
      </div>
      <h2>Answer These Questions</h2>
      <p className="step-description">Help us understand you better to provide personalized recommendations</p>
      
      {loading ? (
        <div className="loading-state">
          <Sparkles className="loading-icon" size={48} />
          <p>Loading questions...</p>
        </div>
      ) : (
        <div className="questions-container">
          {questions.map((question, index) => (
            <div key={index} className="question-card">
              <div className="question-number">Question {index + 1}</div>
              <p className="question-text">{question}</p>
              <textarea
                placeholder="Share your thoughts here..."
                defaultValue={answers[index] || ""}
                onBlur={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [index]: e.target.value,
                  }))
                }
                rows="4"
              />
            </div>
          ))}
          
          <div className="navigation-buttons">
            <button className="back-btn" onClick={() => setStep(3)}>
              <ArrowLeft size={20} />
              Back
            </button>
            <button
              className="submit-btn"
              onClick={submitAssessment}
              disabled={Object.keys(answers).length < questions.length || loading}
            >
              {loading ? "Analyzing..." : "Submit Assessment"}
              <Target size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Results Step
  const ResultsStep = () => {
    const [selectedCareer, setSelectedCareer] = useState(null);

    return (
      <div className="assessment-step results fade-in">
        {selectedCareer ? (
          <div className="career-roadmap">
            <button 
              className="back-to-results" 
              onClick={() => setSelectedCareer(null)}
            >
              <ArrowLeft size={20} />
              Back to Results
            </button>
            <RoadmapGenerator careerTitle={selectedCareer.title} />
          </div>
        ) : (
          <>
            <div className="step-icon success">
              <Target size={48} />
            </div>
            <h2>Your Career Recommendations</h2>
            <p className="step-description">Based on your responses, here are the best career matches for you</p>
            
            {loading ? (
              <div className="loading-state">
                <Sparkles className="loading-icon" size={48} />
                <p>Analyzing your responses...</p>
              </div>
            ) : (
              <div className="recommendations-grid">
                {recommendations?.map((career, index) => (
                  <div key={index} className="career-recommendation-card">
                    <div className="career-header">
                      <div className="career-rank">#{index + 1}</div>
                      <div className="match-badge">
                        <TrendingUp size={16} />
                        {career.match_percentage}% Match
                      </div>
                    </div>
                    <h3>{career.title}</h3>
                    <p className="career-description">{career.description}</p>
                    {career.roadmap_available && (
                      <button
                        className="roadmap-btn"
                        onClick={() => navigate("/roadmap", { state: { careerTitle: career.title } })}
                      >
                        <Sparkles size={16} />
                        Generate Learning Roadmap
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={() => window.location.reload()} className="start-over-btn">
              <ArrowLeft size={20} />
              Start New Assessment
            </button>
          </>
        )}
      </div>
    );
  };

  // Error display
  if (error && step !== 4) {
    return (
      <div className="assessment-steps-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return <LocationStep />;
      case 2:
        return <CategoryStep />;
      case 3:
        return <EducationStep />;
      case 4:
        return <QuestionsStep />;
      case 5:
        return <ResultsStep />;
      default:
        return null;
    }
  };

  const stepIcons = [
    { icon: MapPin, label: "Location" },
    { icon: Briefcase, label: "Category" },
    { icon: GraduationCap, label: "Education" },
    { icon: HelpCircle, label: "Questions" },
    { icon: Target, label: "Results" }
  ];

  return (
    <div className="assessment-steps-container">
      <div className="progress-stepper">
        {stepIcons.map((item, index) => {
          const StepIcon = item.icon;
          const stepNumber = index + 1;
          const isActive = step >= stepNumber;
          const isCurrent = step === stepNumber;
          
          return (
            <React.Fragment key={stepNumber}>
              <div className={`progress-step ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}`}>
                <div className="step-circle">
                  {isActive && step > stepNumber ? (
                    <CheckCircle size={20} />
                  ) : (
                    <StepIcon size={20} />
                  )}
                </div>
                <span className="step-label">{item.label}</span>
              </div>
              {stepNumber < 5 && (
                <div className={`progress-line ${step > stepNumber ? "completed" : ""}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {error && step === 4 && (
        <div className="inline-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      {renderStep()}
    </div>
  );
}

export default AssessmentSteps;