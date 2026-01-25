import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Lock,
  AlertCircle,
  Clock,
  CheckCircle,
  Play,
  ArrowRight,
  Shield,
  Info,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Send,
  Eye,
  Flag,
  HelpCircle,
  XCircle,
  Menu,
  X
} from "lucide-react";
import api from "../../../api/api";
import "./TestAttempt.css";

const TestAttempt = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [testData, setTestData] = useState(null);
  const [password, setPassword] = useState("");
  const [remainingTime, setRemainingTime] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStatus, setQuestionStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [testStartTime, setTestStartTime] = useState(null);
  const [isResuming, setIsResuming] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load from localStorage on component mount
  useEffect(() => {
    const savedAttempt = localStorage.getItem(`test_attempt_${testId}`);
    if (savedAttempt) {
      try {
        const data = JSON.parse(savedAttempt);
        
        // Check if test is still in progress (time left > 0)
        if (data.testStartTime && data.timeLeft && data.testData) {
          const elapsed = Math.floor((Date.now() - new Date(data.testStartTime).getTime()) / 1000);
          const newTimeLeft = Math.max(0, data.timeLeft - elapsed);
          
          if (newTimeLeft > 0) {
            // Load all saved data
            setAnswers(data.answers || {});
            setQuestionStatus(data.questionStatus || {});
            setTimeLeft(newTimeLeft);
            setAttemptId(data.attemptId || null);
            setTestStartTime(data.testStartTime || null);
            setTestData(data.testData || null);
            setTestStarted(true);
            setIsResuming(true);
            setDataLoaded(true);
            setStep(3);
            console.log("Resuming test from localStorage");
          } else {
            // Time's up, clear localStorage
            localStorage.removeItem(`test_attempt_${testId}`);
            setDataLoaded(true);
          }
        } else {
          setDataLoaded(true);
        }
      } catch (error) {
        console.error("Error loading saved attempt:", error);
        localStorage.removeItem(`test_attempt_${testId}`);
        setDataLoaded(true);
      }
    } else {
      setDataLoaded(true);
    }
  }, [testId]);

  useEffect(() => {
    setStep(1);
  }, [testId]);

  useEffect(() => {
    if (remainingTime !== null && remainingTime > 0 && !testStarted) {
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else if (remainingTime === 0 && !testStarted) {
      setTestStarted(true);
    }
  }, [remainingTime, testStarted]);

  // Timer for test in progress
  useEffect(() => {
    let timer;
    if (testStarted && step === 3 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          const newTime = prev - 1;
          saveToLocalStorage({ timeLeft: newTime });
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [testStarted, step, timeLeft]);

  // Save to localStorage whenever answers or status change
  useEffect(() => {
    if (testStarted && step === 3) {
      saveToLocalStorage();
    }
  }, [answers, questionStatus, attemptId, testStartTime, timeLeft, testStarted, step]);

  const saveToLocalStorage = (additionalData = {}) => {
    if (!testId || !testStarted) return;
    
    const data = {
      answers,
      questionStatus,
      timeLeft,
      attemptId,
      testStartTime,
      testId,
      testData,
      ...additionalData
    };
    
    localStorage.setItem(`test_attempt_${testId}`, JSON.stringify(data));
  };

  const clearLocalStorage = () => {
    localStorage.removeItem(`test_attempt_${testId}`);
  };

  const calculateRemainingTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffInSeconds = Math.floor((start - now) / 1000);
    
    if (diffInSeconds <= 0) {
      setTestStarted(true);
      setRemainingTime(0);
    } else {
      setRemainingTime(diffInSeconds);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter password");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const res = await api.post(`/tests/${testId}`, { password });
      
      if (res.success && res.data) {
        setTestData(res.data);
        calculateRemainingTime(res.data.startTime);
        setStep(2);
      } else {
        setError("Incorrect password or test not found");
      }
    } catch (error) {
      console.error("Password verification error:", error);
      setError(error.response?.data?.message || "Invalid password or test not accessible");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Start attempt on server
      const startRes = await api.post("/attempts/start", { testId });
      
      if (startRes.success && startRes.data) {
        setAttemptId(startRes.data._id);
        const currentTime = new Date().toISOString();
        setTestStartTime(currentTime);
        
        setTestStarted(true);
        const initialTime = testData.duration * 60;
        setTimeLeft(initialTime);
        setStep(3);
        
        // Check if we're resuming from localStorage
        if (isResuming) {
          // Already have data from localStorage, don't reinitialize
          console.log("Resuming from localStorage");
        } else if (startRes.isResume) {
          // Resuming from server - load attempt data if needed
          console.log("Resuming existing server attempt");
        } else {
          // New attempt - initialize answers
          const initialAnswers = {};
          const initialStatus = {};
          
          testData.questions.forEach((q, index) => {
            initialAnswers[q._id] = null;
            initialStatus[index] = "not-attempted";
          });
          
          setAnswers(initialAnswers);
          setQuestionStatus(initialStatus);
        }
        
        // Save to localStorage
        saveToLocalStorage({
          timeLeft: initialTime,
          attemptId: startRes.data._id,
          testStartTime: currentTime,
          testData
        });
        
      }
    } catch (error) {
      console.error("Error starting test:", error);
      
      // Handle specific errors
      if (error.response?.status === 400) {
        if (error.response?.data?.message?.includes("already attempted")) {
          setError("You have already attempted this test. Multiple attempts are not allowed.");
        } else if (error.response?.data?.message?.includes("active attempt")) {
          // This means we have an existing attempt - try to resume it
          setError("You have an existing attempt. Please refresh the page to resume.");
        } else {
          setError(error.response?.data?.message || "Failed to start test.");
        }
      } else {
        setError("Failed to start test. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    const newAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(newAnswers);
    
    const questionIndex = testData.questions.findIndex(q => q._id === questionId);
    if (questionIndex !== -1) {
      setQuestionStatus(prev => ({
        ...prev,
        [questionIndex]: "answered"
      }));
    }
  };

  const handleMarkForReview = () => {
    const newStatus = questionStatus[currentQuestion] === "review" ? "answered" : "review";
    setQuestionStatus(prev => ({
      ...prev,
      [currentQuestion]: newStatus
    }));
  };

  const handleSkipQuestion = () => {
    setQuestionStatus(prev => ({
      ...prev,
      [currentQuestion]: "skipped"
    }));
    
    if (currentQuestion < testData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleNavigateQuestion = (index) => {
    setCurrentQuestion(index);
    setIsSidebarOpen(false);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < testData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleAutoSubmit = async () => {
    // Auto submit when time ends
    if (attemptId) {
      await handleSubmitTest();
    }
  };

  const handleSubmitTest = async () => {
    if (!attemptId) {
      setError("No active attempt found");
      return;
    }

    setLoading(true);
    
    try {
      // Format answers for submission
      const formattedAnswers = Object.entries(answers)
        .filter(([_, selectedOptionIndex]) => selectedOptionIndex !== null)
        .map(([questionId, selectedOptionIndex]) => ({
          question: questionId,
          selectedOptionIndex: selectedOptionIndex
        }));

      const submissionData = {
        attemptId,
        answers: formattedAnswers
      };
      
      const res = await api.post("/attempts/submit", submissionData);
      
      if (res.success) {
        // Clear localStorage on successful submission
        clearLocalStorage();
        setStep(4);
      } else {
        setError("Failed to submit test");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.response?.data?.message || "Failed to submit test. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Define render functions first
  const renderTestStep = () => {
    const currentQ = testData?.questions[currentQuestion];
    const totalQuestions = testData?.questions?.length || 0;
    
    return (
      <div className="test-interface">
        {/* Mobile Header with Menu Button */}
        <div className="test-header-mobile">
          <button 
            className="menu-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="mobile-test-info">
            <h3>{testData?.title}</h3>
            <div className="question-counter-mobile">
              Q{currentQuestion + 1}/{totalQuestions}
            </div>
          </div>
          <div className="mobile-timer">
            <Clock size={16} />
            <span className="timer-display-mobile">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="test-header-desktop">
          <div className="test-info">
            <h2>{testData?.title}</h2>
            <div className="test-sub-info">
              <span>Question {currentQuestion + 1} of {totalQuestions}</span>
              <span>•</span>
              <span>{testData?.exam?.name} - {testData?.subject?.name}</span>
            </div>
          </div>
          
          <div className="test-timer">
            <Clock size={18} />
            <span className="timer-display">{formatTime(timeLeft)}</span>
            <div className="timer-label">
              {timeLeft <= 300 && timeLeft > 0 ? "Hurry up!" : "Time remaining"}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="test-main">
          {/* Question Sidebar */}
          <div className={`question-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3>Question Palette</h3>
              <span className="question-count">{totalQuestions}</span>
            </div>
            
            <div className="question-grid">
              {testData?.questions?.map((_, index) => {
                const status = questionStatus[index] || "not-attempted";
                let statusClass = "";
                
                switch(status) {
                  case "answered":
                    statusClass = "answered";
                    break;
                  case "review":
                    statusClass = "review";
                    break;
                  case "skipped":
                    statusClass = "skipped";
                    break;
                  default:
                    statusClass = "not-attempted";
                }
                
                return (
                  <button
                    key={index}
                    className={`question-button ${statusClass} ${currentQuestion === index ? "active" : ""}`}
                    onClick={() => handleNavigateQuestion(index)}
                    title={`Question ${index + 1} - ${status}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="sidebar-footer">
              <div className="sidebar-legend">
                <div className="legend-row">
                  <div className="legend-item">
                    <div className="legend-color answered"></div>
                    <span>Answered</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color review"></div>
                    <span>Review</span>
                  </div>
                </div>
                <div className="legend-row">
                  <div className="legend-item">
                    <div className="legend-color skipped"></div>
                    <span>Skipped</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color not-attempted"></div>
                    <span>Not Attempted</span>
                  </div>
                </div>
              </div>
              
              <div className="test-summary">
                <div className="summary-item">
                  <span className="summary-label">Total:</span>
                  <span className="summary-value">{totalQuestions}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Answered:</span>
                  <span className="summary-value">
                    {Object.values(questionStatus).filter(s => s === "answered").length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Review:</span>
                  <span className="summary-value">
                    {Object.values(questionStatus).filter(s => s === "review").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Question Area */}
          <div className="question-area">
            <div className="question-card">
              <div className="question-header">
                <div className="question-number">
                  Q - {currentQuestion + 1}
                  {currentQ?.difficulty && (
                    <span className={`difficulty-badge ${currentQ?.difficulty?.toLowerCase()}`}>
                      {currentQ?.difficulty}
                    </span>
                  )}
                </div>
                
                <div className="question-actions">
                  <button 
                    className={`action-btn ${questionStatus[currentQuestion] === "review" ? "active" : ""}`}
                    onClick={handleMarkForReview}
                    title="Mark for Review"
                  >
                    <Flag size={14} />
                    <span>{questionStatus[currentQuestion] === "review" ? "Marked" : "Mark for Review"}</span>
                  </button>
                </div>
              </div>
              
              <div className="question-text">
                {currentQ?.questionText}
              </div>
              
              {currentQ?.options && (
                <div className="options-list">
                  {currentQ.options.map((option, index) => {
                    const isSelected = answers[currentQ._id] === index;
                    return (
                      <div 
                        key={index}
                        className={`option-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleAnswerSelect(currentQ._id, index)}
                      >
                        <div className="option-selector">
                          {isSelected ? (
                            <div className="selected-indicator"></div>
                          ) : (
                            <div className="unselected-indicator"></div>
                          )}
                        </div>
                        <div className="option-content">
                          <span className="option-letter">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="option-text">{option.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Navigation Controls */}
            <div className="navigation-controls">
              <div className="nav-section">
                <button 
                  className="btn btn-outline"
                  onClick={handleSkipQuestion}
                  disabled={currentQuestion === totalQuestions - 1}
                >
                  <SkipForward size={16} />
                  Skip
                </button>
              </div>
              
              <div className="nav-section">
                <button 
                  className="btn btn-outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                
                <div className="question-counter">
                  {currentQuestion + 1} / {totalQuestions}
                </div>
                
                <button 
                  className="btn btn-outline"
                  onClick={handleNext}
                  disabled={currentQuestion === totalQuestions - 1}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="nav-section">
                <button 
                  className="btn btn-primary submit-btn"
                  onClick={handleSubmitTest}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Now the main component logic
  // If data is still loading from localStorage
  if (!dataLoaded) {
    return (
      <div className="test-attempt-container">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading your test data...</p>
        </div>
      </div>
    );
  }

  // If resuming and already in test step, show test interface directly
  if (isResuming && step === 3 && testData) {
    return renderTestStep();
  }

  const renderPasswordStep = () => (
    <div className="test-attempt-container">
      <div className="password-step">
        <div className="password-header">
          <div className="lock-icon">
            <Lock size={32} />
          </div>
          <h2>Enter Test Password</h2>
          <p>This test is password protected. Please enter the password to continue.</p>
        </div>
        
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter test password"
              disabled={loading}
              autoFocus
            />
          </div>
          
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Verifying...
              </>
            ) : (
              <>
                <Shield size={16} />
                Enter Test
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderInstructionsStep = () => {
    const formatRemainingTime = (seconds) => {
      if (seconds <= 0) return "0s";
      
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
      
      return parts.join(" ");
    };

    return (
      <div className="test-attempt-container">
        <div className="instructions-step">
          <div className="instructions-header">
            <h1>{testData?.title}</h1>
            <div className="test-meta">
              <span className="meta-item">
                <Clock size={14} />
                {testData?.duration} minutes
              </span>
              <span className="meta-item">
                <CheckCircle size={14} />
                {testData?.questions?.length} questions
              </span>
            </div>
          </div>
          
          <div className="instructions-content">
            <div className="rules-section">
              <h3>Test Instructions</h3>
              <div className="instructions-list">
                <div className="instruction-item">
                  <strong>Time Duration:</strong> {testData?.duration} minutes
                </div>
                <div className="instruction-item">
                  <strong>Total Questions:</strong> {testData?.questions?.length} questions
                </div>
                <div className="instruction-item">
                  <strong>Question Type:</strong> Multiple Choice (4 options each)
                </div>
                <div className="instruction-item">
                  <strong>Navigation:</strong> Use sidebar to jump between questions
                </div>
                <div className="instruction-item">
                  <strong>Mark for Review:</strong> Flag questions to revisit later
                </div>
                <div className="instruction-item">
                  <strong>Auto-Submit:</strong> Test will submit automatically when time ends
                </div>
                <div className="instruction-item">
                  <strong>Submission:</strong> Once submitted, answers cannot be changed
                </div>
              </div>
            </div>
            
            <div className="countdown-section">
              {remainingTime > 0 ? (
                <div className="countdown-card">
                  <div className="countdown-header">
                    <Clock size={20} />
                    <h4>Test Starts In</h4>
                  </div>
                  <div className="countdown-display">
                    <div className="time-units">
                      <div className="time-unit">
                        <span className="time-value">
                          {Math.floor(remainingTime / (3600 * 24))}
                        </span>
                        <span className="time-label">Days</span>
                      </div>
                      <div className="time-separator">:</div>
                      <div className="time-unit">
                        <span className="time-value">
                          {Math.floor((remainingTime % (3600 * 24)) / 3600)
                            .toString()
                            .padStart(2, '0')}
                        </span>
                        <span className="time-label">Hours</span>
                      </div>
                      <div className="time-separator">:</div>
                      <div className="time-unit">
                        <span className="time-value">
                          {Math.floor((remainingTime % 3600) / 60)
                            .toString()
                            .padStart(2, '0')}
                        </span>
                        <span className="time-label">Minutes</span>
                      </div>
                      <div className="time-separator">:</div>
                      <div className="time-unit">
                        <span className="time-value">
                          {(remainingTime % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="time-label">Seconds</span>
                      </div>
                    </div>
                    
                    <div className="time-summary">
                      <Clock size={12} />
                      {formatRemainingTime(remainingTime)} remaining
                    </div>
                  </div>
                  
                  <p className="countdown-message">
                    The test will begin automatically when the timer reaches zero.
                  </p>
                  
                  <button className="btn btn-outline" disabled>
                    <Clock size={16} />
                    Waiting for test to start
                  </button>
                </div>
              ) : (
                <div className="ready-card">
                  <div className="ready-header">
                    <Play size={20} />
                    <h4>Ready to Start</h4>
                  </div>
                  
                  <div className="ready-message">
                    <p>All checks passed! You can now begin the test.</p>
                    <div className="ready-checks">
                      <div className="check-item">
                        <CheckCircle size={14} />
                        <span>Password verified</span>
                      </div>
                      <div className="check-item">
                        <CheckCircle size={14} />
                        <span>Test loaded successfully</span>
                      </div>
                      <div className="check-item">
                        <CheckCircle size={14} />
                        <span>Start time reached</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-primary start-test-btn" 
                    onClick={handleStartTest}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-small"></div>
                        Starting Test...
                      </>
                    ) : (
                      <>
                        <ArrowRight size={16} />
                        {isResuming ? "Resume Test" : "Start Test Now"}
                      </>
                    )}
                  </button>
                  
                  <div className="test-stats">
                    <div className="stat">
                      <span className="stat-value">{testData?.duration}</span>
                      <span className="stat-label">Minutes</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{testData?.questions?.length}</span>
                      <span className="stat-label">Questions</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">4</span>
                      <span className="stat-label">Options each</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="instructions-footer">
            <div className="warning-note">
              <AlertTriangle size={16} />
              <div>
                <strong>Note:</strong> Do not refresh or close this window during the test.
                Your progress will be saved automatically.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

const renderResultsStep = () => {
  const shouldShowResults = testData?.showResultAfterSubmit;
  const answeredCount = Object.values(answers).filter(a => a !== null).length;
  const correctCount = Object.values(questionStatus).filter(s => s === "answered").length;
  const totalQuestions = testData?.questions?.length || 0;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  
  return (
    <div className="test-attempt-container">
      <div className="results-step">
        <div className="results-header">
          <CheckCircle size={48} className="success-icon" />
          <h1>Test Submitted Successfully!</h1>
          <p className="test-subtitle">
            {shouldShowResults 
              ? "Your results are available below." 
              : "Thank you for completing the test. Your results will be available once the test ends."
            }
          </p>
        </div>
        
        <div className="results-summary">
          <div className="summary-card">
            <h2>{shouldShowResults ? "Test Results" : "Test Summary"}</h2>
            <p className="test-title">{testData?.title}</p>
            
            {shouldShowResults ? (
              <>
                {/* Score Display - Show only when results are enabled */}
                <div className="score-display-wrapper">
                  <div className="score-circle-wrapper">
                    <div className="score-circle">
                      <div className="score-inner">
                        <span className="score-main">{correctCount}</span>
                        <span className="score-sub">Correct</span>
                      </div>
                    </div>
                    <div className="score-divider">of</div>
                    <div className="total-score">
                      <div className="total-main">{totalQuestions}</div>
                      <div className="total-sub">Total</div>
                    </div>
                  </div>
                  
                  <div className="percentage-display">
                    <div className="percentage-value">{percentage}%</div>
                    <div className="percentage-label">Score</div>
                  </div>
                </div>
                
                {/* Detailed Stats Grid */}
                <div className="detailed-stats-grid">
                  <div className="detailed-stat">
                    <div className="detailed-stat-icon correct-stat">
                      <CheckCircle size={20} />
                    </div>
                    <div className="detailed-stat-content">
                      <div className="detailed-stat-value">{correctCount}</div>
                      <div className="detailed-stat-label">Correct</div>
                    </div>
                  </div>
                  
                  <div className="detailed-stat">
                    <div className="detailed-stat-icon wrong-stat">
                      <XCircle size={20} />
                    </div>
                    <div className="detailed-stat-content">
                      <div className="detailed-stat-value">{answeredCount - correctCount}</div>
                      <div className="detailed-stat-label">Wrong</div>
                    </div>
                  </div>
                  
                  <div className="detailed-stat">
                    <div className="detailed-stat-icon review-stat">
                      <Flag size={20} />
                    </div>
                    <div className="detailed-stat-content">
                      <div className="detailed-stat-value">
                        {Object.values(questionStatus).filter(s => s === "review").length}
                      </div>
                      <div className="detailed-stat-label">Review</div>
                    </div>
                  </div>
                  
                  <div className="detailed-stat">
                    <div className="detailed-stat-icon skipped-stat">
                      <SkipForward size={20} />
                    </div>
                    <div className="detailed-stat-content">
                      <div className="detailed-stat-value">
                        {Object.values(questionStatus).filter(s => s === "skipped").length}
                      </div>
                      <div className="detailed-stat-label">Skipped</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Basic Summary - When results are disabled */
              <>
                <div className="summary-grid">
                  <div className="summary-stat">
                    <span className="stat-value">{totalQuestions}</span>
                    <span className="stat-label">Total Questions</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-value">{answeredCount}</span>
                    <span className="stat-label">Answered</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-value">
                      {Object.values(questionStatus).filter(s => s === "review").length}
                    </span>
                    <span className="stat-label">Marked for Review</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-value">
                      {Object.values(questionStatus).filter(s => s === "skipped").length}
                    </span>
                    <span className="stat-label">Skipped</span>
                  </div>
                </div>
                
                <div className="warning-note">
                  <Info size={20} />
                  <div>
                    <p><strong>Note:</strong> Results will be available once the test ends. The test creator has disabled immediate result display.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="results-actions">
          <button className="btn btn-outline" onClick={() => navigate("/u")}>
            <ChevronLeft size={16} />
            Back to Dashboard
          </button>
          
          {/* {shouldShowResults ? (
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/attempts/${attemptId}`)}
            >
              <Eye size={16} />
              View Detailed Results
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={() => navigate("/u/tests")}
            >
              <CheckCircle size={16} />
              View My Tests
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
};

  if (loading && step === 1) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Verifying password...</p>
      </div>
    );
  }

  return (
    <>
      {step === 1 && renderPasswordStep()}
      {step === 2 && renderInstructionsStep()}
      {step === 3 && renderTestStep()}
      {step === 4 && renderResultsStep()}
      
      {error && !loading && (
        <div className="error-overlay">
          <div className="error-content">
            <XCircle size={40} className="error-icon" />
            <h3>Error</h3>
            <p>{error}</p>
            <button 
              className="btn btn-outline" 
              onClick={() => {
                setError("");
                if (step === 1) {
                  navigate("/u");
                }
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TestAttempt;