import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Filter,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Save,
  Eye,
  Check,
  ChevronDown,
  Search,
  X,
  AlertCircle,
  FileText,
  Users,
  BarChart,
  Settings,
  Shuffle,
  Download,
  RefreshCw
} from "lucide-react";
import api from "../../../api/api";
import "./testCreate.css";
import { showSuccessToast } from "../../../api/toast";
import { useNavigate } from "react-router-dom";

const TestCreate = ({ onBack, onTestCreated }) => {
    const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Select Questions, 3: Settings
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Basic Info State
  const [formData, setFormData] = useState({
    title: "",
    examId: "",
    subjectId: "",
    chapterId: "",
    duration: 30,
    startTime: "",
    endTime: "",
    password: "",
    allowMultipleAttempts: false,
    showResultAfterSubmit: true,
    questionsCount: 30,
  });

  // Filter State
  const [filters, setFilters] = useState({
    examId: "",
    subjectId: "",
    chapterId: "",
    difficulty: "",
    approved: true
  });

  // Data States
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState(0);

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (formData.examId) {
      fetchSubjects(formData.examId);
      fetchChapters(formData.examId, formData.subjectId);
    }
  }, [formData.examId, formData.subjectId]);

  // Update selected questions when questionsCount changes
  useEffect(() => {
    if (questions.length > 0) {
      const needed = formData.questionsCount;
      const current = selectedQuestions.length;
      
      if (current > needed) {
        // Remove excess questions
        setSelectedQuestions(prev => prev.slice(0, needed));
      }
    }
  }, [formData.questionsCount, questions.length]);

  // Filter questions based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = questions.filter(q =>
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuestions(filtered);
    } else {
      setFilteredQuestions(questions);
    }
  }, [searchTerm, questions]);

  const fetchExams = async () => {
    try {
      const res = await api.get("/courses");
      setExams(res.data || []);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
    }
  };

  const fetchSubjects = async (examId) => {
    try {
      const res = await api.get(`/subjects?examId=${examId}`);
      setSubjects(res.data || []);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const fetchChapters = async (examId, subjectId) => {
    if (!subjectId) return;
    try {
      const res = await api.get(`/chapters?examId=${examId}&subjectId=${subjectId}`);
      setChapters(res.data || []);
    } catch (error) {
      console.error("Failed to fetch chapters:", error);
    }
  };

  const handleFetchQuestions = async () => {
    if (!formData.examId || !formData.subjectId) {
      setError("Please select exam and subject first");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Fetch double the required questions
      const requiredQuestions = formData.questionsCount * 2;
      
      const queryParams = new URLSearchParams({
        examId: formData.examId,
        subjectId: formData.subjectId,
        ...(formData.chapterId && { chapterId: formData.chapterId }),
        approved: "true",
        limit: requiredQuestions
      });

      const res = await api.get(`/questions?${queryParams}`);
      const fetchedQuestions = res.data || [];
      
      setQuestions(fetchedQuestions);
      setFilteredQuestions(fetchedQuestions);
      setAvailableQuestions(fetchedQuestions.length);
      
      // Clear previous selections
      setSelectedQuestions([]);
      
      // Move to question selection step
      setStep(2);
      
      // Show info about available questions
      if (fetchedQuestions.length < formData.questionsCount) {
        setError(`Only ${fetchedQuestions.length} questions available in database. Need at least ${formData.questionsCount} questions.`);
      } else if (fetchedQuestions.length < requiredQuestions) {
        console.log(`Requested ${requiredQuestions} questions but only ${fetchedQuestions.length} available.`);
      }
      
    } catch (error) {
      setError("Failed to fetch questions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = (questionId) => {
    // If already selected, remove it
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
      return;
    }
    
    // If limit reached, show error
    if (selectedQuestions.length >= formData.questionsCount) {
      setError(`Maximum ${formData.questionsCount} questions allowed. Deselect some questions first.`);
      return;
    }
    
    // Add the question
    setSelectedQuestions(prev => [...prev, questionId]);
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === Math.min(filteredQuestions.length, formData.questionsCount)) {
      // Deselect all
      setSelectedQuestions([]);
    } else {
      // Select up to the limit
      const available = filteredQuestions.slice(0, formData.questionsCount);
      setSelectedQuestions(available.map(q => q._id));
    }
  };

  const handleSelectRandom = () => {
    setIsRandomizing(true);
    setError("");
    
    setTimeout(() => {
      try {
        const totalNeeded = formData.questionsCount;
        const alreadySelected = selectedQuestions.length;
        const remainingNeeded = totalNeeded - alreadySelected;
        
        if (remainingNeeded <= 0) {
          setError("Already selected maximum number of questions");
          return;
        }
        
        // Get questions that are not already selected
        const unselectedQuestions = questions
          .filter(q => !selectedQuestions.includes(q._id))
          .map(q => q._id);
        
        if (unselectedQuestions.length === 0) {
          setError("No more questions available to select");
          return;
        }
        
        // Shuffle the unselected questions
        const shuffled = [...unselectedQuestions].sort(() => Math.random() - 0.5);
        
        // Take only as many as needed
        const toSelect = shuffled.slice(0, remainingNeeded);
        
        // Add to selected questions
        setSelectedQuestions(prev => [...prev, ...toSelect]);
        
      } catch (error) {
        setError("Failed to select random questions");
        console.error(error);
      } finally {
        setIsRandomizing(false);
      }
    }, 300);
  };

  const handleRandomAll = () => {
    setIsRandomizing(true);
    setError("");
    
    setTimeout(() => {
      try {
        const totalNeeded = formData.questionsCount;
        
        if (questions.length < totalNeeded) {
          setError(`Only ${questions.length} questions available. Need ${totalNeeded} questions.`);
          setIsRandomizing(false);
          return;
        }
        
        // Shuffle all questions
        const shuffled = [...questions]
          .sort(() => Math.random() - 0.5)
          .slice(0, totalNeeded)
          .map(q => q._id);
        
        // Set as selected
        setSelectedQuestions(shuffled);
        
      } catch (error) {
        setError("Failed to select random questions");
        console.error(error);
      } finally {
        setIsRandomizing(false);
      }
    }, 300);
  };

  const handleClearAll = () => {
    setSelectedQuestions([]);
    setError("");
  };

  const handleRefreshQuestions = () => {
    handleFetchQuestions();
  };

  const handleDifficultyFilter = (difficulty) => {
    setFilters(prev => ({ ...prev, difficulty }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const testData = {
        ...formData,
        questions: selectedQuestions,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString()
      };

      const res = await api.post("/tests", testData);
      showSuccessToast("Test Created");
      navigate("/u/tests")
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Test title is required");
      return false;
    }
    if (!formData.examId) {
      setError("Please select an exam");
      return false;
    }
    if (!formData.subjectId) {
      setError("Please select a subject");
      return false;
    }
    if (selectedQuestions.length !== formData.questionsCount) {
      setError(`Please select exactly ${formData.questionsCount} questions`);
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      setError("Please set start and end time");
      return false;
    }
    if (formData.duration <= 0) {
      setError("Duration must be greater than 0");
      return false;
    }
    if (!formData.password.trim()) {
      setError("Password must not be empty");
      return false;
    }
    return true;
  };

  // Step 1: Basic Info
  const renderStep1 = () => (
    <div className="create-step">
      <div className="step-header">
        <h2>Basic Information</h2>
        <p>Fill in the basic details of your test</p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="title">Test Title *</label>
          <input
            type="text"
            id="title"
            placeholder="e.g., Polity Mock Test - संविधान का निर्माण"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Test Password *</label>
          <input
            type="password"
            id="password"
            placeholder="Enter password for test"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="exam">Exam *</label>
          <select
            id="exam"
            value={formData.examId}
            onChange={(e) => setFormData({ ...formData, examId: e.target.value, subjectId: "", chapterId: "" })}
          >
            <option value="">Select Exam</option>
            {exams.map(exam => (
              <option key={exam._id} value={exam._id}>{exam.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject *</label>
          <select
            id="subject"
            value={formData.subjectId}
            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value, chapterId: "" })}
            disabled={!formData.examId}
          >
            <option value="">Select Subject</option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>{subject.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="chapter">Chapter (Optional)</label>
          <select
            id="chapter"
            value={formData.chapterId}
            onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
            disabled={!formData.subjectId}
          >
            <option value="">All Chapters</option>
            {chapters.map(chapter => (
              <option key={chapter._id} value={chapter._id}>{chapter.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="duration">Duration (minutes) *</label>
          <input
            type="number"
            id="duration"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="questionsCount">Number of questions *</label>
          <input
            type="number"
            id="questionsCount"
            min="1"
            max="100"
            value={formData.questionsCount}
            onChange={(e) => {
              const value = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
              setFormData({ ...formData, questionsCount: value });
            }}
          />
          <small className="helper-text">
            Will fetch {formData.questionsCount * 2} questions from database
          </small>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-outline" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleFetchQuestions}
          disabled={!formData.examId || !formData.subjectId || loading}
        >
          {loading ? (
            <>
              <div className="spinner-small"></div>
              Loading...
            </>
          ) : (
            <>
              <Download size={18} />
              Fetch Questions
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Step 2: Select Questions
  const renderStep2 = () => {
    const totalNeeded = formData.questionsCount;
    const selectedCount = selectedQuestions.length;
    const remaining = totalNeeded - selectedCount;
    const progress = Math.round((selectedCount / totalNeeded) * 100);
    
    return (
      <div className="create-step">
        <div className="step-header">
          <div className="step-header-main">
            <button className="back-btn" onClick={() => setStep(1)}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2>Select Questions</h2>
              <p>
                Choose {totalNeeded} questions ({availableQuestions} available)
              </p>
            </div>
          </div>
          
          <div className="selection-actions">
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleRefreshQuestions}
              title="Refresh Questions"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="selection-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-info">
            <span className="progress-text">
              {selectedCount} / {totalNeeded} selected
            </span>
            <span className={`progress-status ${remaining === 0 ? 'complete' : 'incomplete'}`}>
              {remaining === 0 ? '✓ Complete' : `${remaining} more needed`}
            </span>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="selection-controls">
          <div className="control-group">
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleSelectAll}
              disabled={filteredQuestions.length === 0}
            >
              {selectedCount === Math.min(filteredQuestions.length, totalNeeded) ? 
                "Deselect All" : "Select All"}
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleClearAll}
              disabled={selectedCount === 0}
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
          
          <div className="control-group">
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleRandomAll}
              disabled={questions.length < totalNeeded || isRandomizing}
            >
              {isRandomizing ? (
                <>
                  <div className="spinner-tiny"></div>
                  Randomizing...
                </>
              ) : (
                <>
                  <Shuffle size={16} />
                  Select All Random
                </>
              )}
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleSelectRandom}
              disabled={remaining <= 0 || isRandomizing}
              title="Fill remaining slots randomly"
            >
              <Shuffle size={16} />
              Fill {remaining > 0 ? remaining : ''} Random
            </button>
          </div>
        </div>

        {/* Question Filters */}
        <div className="question-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="difficulty-filters">
            <button
              className={`difficulty-btn ${filters.difficulty === "" ? "active" : ""}`}
              onClick={() => handleDifficultyFilter("")}
            >
              All
            </button>
            <button
              className={`difficulty-btn easy ${filters.difficulty === "easy" ? "active" : ""}`}
              onClick={() => handleDifficultyFilter("easy")}
            >
              Easy
            </button>
            <button
              className={`difficulty-btn medium ${filters.difficulty === "medium" ? "active" : ""}`}
              onClick={() => handleDifficultyFilter("medium")}
            >
              Medium
            </button>
            <button
              className={`difficulty-btn hard ${filters.difficulty === "hard" ? "active" : ""}`}
              onClick={() => handleDifficultyFilter("hard")}
            >
              Hard
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="questions-list">
          {loading ? (
            <div className="loading-questions">
              <div className="spinner"></div>
              <p>Loading questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="empty-questions">
              <FileText size={48} color="var(--text-muted)" />
              <h3>No Questions Found</h3>
              <p>Try changing your filters or search term</p>
            </div>
          ) : (
            filteredQuestions
              .filter(q => !filters.difficulty || q.difficulty === filters.difficulty)
              .map(question => (
                <QuestionCard
                  key={question._id}
                  question={question}
                  isSelected={selectedQuestions.includes(question._id)}
                  isDisabled={!selectedQuestions.includes(question._id) && selectedCount >= totalNeeded}
                  onSelect={handleQuestionSelect}
                />
              ))
          )}
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="step-actions">
          <button className="btn btn-outline" onClick={() => setStep(1)}>
            <ArrowLeft size={18} />
            Back
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              if (selectedCount === totalNeeded) {
                setStep(3);
                setError("");
              } else {
                setError(`Please select exactly ${totalNeeded} questions`);
              }
            }}
            disabled={selectedCount !== totalNeeded}
          >
            Continue to Settings
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  // Step 3: Settings
  const renderStep3 = () => (
    <div className="create-step">
      <div className="step-header">
        <div className="step-header-main">
          <button className="back-btn" onClick={() => setStep(2)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2>Test Settings</h2>
            <p>Configure timing and other settings</p>
          </div>
        </div>
        
        <button 
          className="btn btn-outline btn-sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye size={16} />
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      {showPreview && (
        <div className="test-preview card">
          <h3>Test Preview</h3>
          <div className="preview-content">
            <div className="preview-row">
              <strong>Title:</strong> {formData.title || "Untitled Test"}
            </div>
            <div className="preview-row">
              <strong>Exam:</strong> {exams.find(e => e._id === formData.examId)?.name || "N/A"}
            </div>
            <div className="preview-row">
              <strong>Subject:</strong> {subjects.find(s => s._id === formData.subjectId)?.name || "N/A"}
            </div>
            <div className="preview-row">
              <strong>Total Questions:</strong> {selectedQuestions.length}
            </div>
            <div className="preview-row">
              <strong>Duration:</strong> {formData.duration} minutes
            </div>
            <div className="preview-row">
              <strong>Password:</strong> {"•".repeat(formData.password.length)}
            </div>
            <div className="preview-row">
              <strong>Start Time:</strong> {formData.startTime ? new Date(formData.startTime).toLocaleString() : "Not set"}
            </div>
            <div className="preview-row">
              <strong>End Time:</strong> {formData.endTime ? new Date(formData.endTime).toLocaleString() : "Not set"}
            </div>
          </div>
        </div>
      )}

      <div className="settings-grid">
        <div className="form-group">
          <label htmlFor="startTime">
            <Calendar size={16} />
            Start Time *
          </label>
          <input
            type="datetime-local"
            id="startTime"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">
            <Clock size={16} />
            End Time *
          </label>
          <input
            type="datetime-local"
            id="endTime"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            min={formData.startTime || new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="form-group toggle-group">
          <div className="toggle-label">
            <Users size={16} />
            <div>
              <strong>Allow Multiple Attempts</strong>
              <p>Students can take this test multiple times</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={formData.allowMultipleAttempts}
              onChange={(e) => setFormData({ ...formData, allowMultipleAttempts: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="form-group toggle-group">
          <div className="toggle-label">
            <BarChart size={16} />
            <div>
              <strong>Show Results Immediately</strong>
              <p>Students see results immediately after submission</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={formData.showResultAfterSubmit}
              onChange={(e) => setFormData({ ...formData, showResultAfterSubmit: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-outline" onClick={() => setStep(2)}>
          <ArrowLeft size={18} />
          Back
        </button>
        <button 
          className="btn btn-primary create-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner-small"></div>
              Creating...
            </>
          ) : (
            <>
              <Save size={18} />
              Create Test
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="test-create-page">
      <div className="create-wizard">
        <div className="wizard-header">
          <h1>Create New Test</h1>
          <div className="wizard-steps">
            <div className={`step-indicator ${step >= 1 ? "active" : ""}`}>
              <span className="step-number">1</span>
              <span className="step-label">Basic Info</span>
            </div>
            <div className="step-connector"></div>
            <div className={`step-indicator ${step >= 2 ? "active" : ""}`}>
              <span className="step-number">2</span>
              <span className="step-label">Select Questions</span>
            </div>
            <div className="step-connector"></div>
            <div className={`step-indicator ${step >= 3 ? "active" : ""}`}>
              <span className="step-number">3</span>
              <span className="step-label">Settings</span>
            </div>
          </div>
        </div>

        <div className="wizard-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

// Question Card Component
const QuestionCard = ({ question, isSelected, isDisabled, onSelect }) => {
  return (
    <div className={`question-card ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}>
      <div className="question-header">
        <div className="question-meta">
          <span className={`difficulty-badge ${question.difficulty}`}>
            {question.difficulty}
          </span>
          <div className="question-tags">
            <span className="question-index">Q</span>
          </div>
        </div>
        <button 
          className="select-btn"
          onClick={() => !isDisabled && onSelect(question._id)}
          disabled={isDisabled && !isSelected}
          title={isDisabled && !isSelected ? "Maximum questions reached" : isSelected ? "Deselect" : "Select"}
        >
          {isSelected ? (
            <Check size={20} className="selected-icon" />
          ) : (
            <Plus size={20} className="add-icon" />
          )}
        </button>
      </div>
      
      <div className="question-body">
        <p className="question-text">{question.questionText}</p>
        
        <div className="options-grid">
          {question.options?.map((option, idx) => (
            <div 
              key={option._id} 
              className={`option ${idx === question.correctOptionIndex ? "correct" : ""}`}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className="option-text">{option.text}</span>
              {idx === question.correctOptionIndex && (
                <span className="correct-indicator">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestCreate;