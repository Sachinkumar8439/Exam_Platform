import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Clock,
  Calendar,
  Eye,
  CheckCircle,
  Loader2,
  AlertCircle,
  BookOpen,
  Timer,
  BarChart3,
  SortAsc
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import "./myAttempts.css"
import api from '../../../api/api';

const MyAttempts = () => {
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('new');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchMyAttempts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/attempts/my');
        
        if (response.success) {
          setData(response);
        } else {
          setError('Failed to fetch attempts');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchMyAttempts();
  }, []);

  const uniqueExams = useMemo(() => {
    if (!data || !data.attempts) return [];
    
    const exams = new Set();
    data.attempts.forEach(attempt => {
      if (attempt.exam?.name) {
        exams.add(attempt.exam.name);
      }
    });
    
    return Array.from(exams).sort();
  }, [data]);

  const filteredAttempts = useMemo(() => {
    if (!data || !data.attempts) return [];
    
    let filtered = [...data.attempts];

    if (searchQuery) {
      filtered = filtered.filter(attempt =>
        attempt.testTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedExam !== 'all') {
      filtered = filtered.filter(attempt => 
        attempt.exam?.name === selectedExam
      );
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(attempt => {
        const attemptDate = new Date(attempt.startedAt);
        if (timeFilter === 'new') {
          return attemptDate >= sevenDaysAgo;
        } else {
          return attemptDate < sevenDaysAgo;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'new':
          return new Date(b.startedAt) - new Date(a.startedAt);
        case 'old':
          return new Date(a.startedAt) - new Date(b.startedAt);
        case 'score-high':
          return (b.score || 0) - (a.score || 0);
        case 'score-low':
          return (a.score || 0) - (b.score || 0);
        default:
          return new Date(b.startedAt) - new Date(a.startedAt);
      }
    });

    return filtered;
  }, [data, searchQuery, selectedExam, timeFilter, sortBy]);

  const formatTimeTaken = (seconds) => {
    if (!seconds) return 'N/A';
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewAttempt = (attemptId) => {
    navigate(`/attempts/${attemptId}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <Loader2 className="loading-icon" size={32} />
          <p>Loading attempts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <AlertCircle className="error-icon" size={32} />
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary mt-sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.attempts || data.attempts.length === 0) {
    return (
      <div className="page-container">
        <div className="header-section">
          <h1 className="page-title">My Attempts</h1>
        </div>
        
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No Attempts</h3>
          <p>You haven't attempted any tests</p>
          <button 
            className="btn btn-primary mt-sm"
            onClick={() => navigate('/u/tests')}
          >
            Browse Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <h1 className="page-title">My Attempts</h1>
          <div className="total-count">
            <BarChart3 size={16} />
            <span>{data.totalAttempts || 0} attempts</span>
          </div>
        </div>
      </div>

      {/* Desktop Filters - Corrected Alignment */}
      {!isMobile ? (
        <div className="desktop-filters-container">
          <div className="filters-row">
            {/* Search - Bigger width */}
            <div className="filter-group filter-search">
              <Search size={18} className="filter-icon" />
              <input
                type="text"
                placeholder="Search by test name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Other filters in single row */}
            <div className="filters-grid">
              <div className="filter-group">
                <BookOpen size={18} className="filter-icon" />
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Exams</option>
                  {uniqueExams.map(exam => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <Calendar size={18} className="filter-icon" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Time</option>
                  <option value="new">Last 7 days</option>
                  <option value="old">Older</option>
                </select>
              </div>

              <div className="filter-group">
                <SortAsc size={18} className="filter-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="new">Newest First</option>
                  <option value="old">Oldest First</option>
                  <option value="score-high">High Score</option>
                  <option value="score-low">Low Score</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mobile Filters */
        <div className="mobile-filters">
          {/* Search Bar - Full Width */}
          <div className="mobile-search">
            <div className="search-icon">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search test..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Other Filters in Single Row */}
          <div className="mobile-filter-row">
            <div className="mobile-filter-group">
              <BookOpen size={14} />
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="mobile-filter-select"
              >
                <option value="all">All Exams</option>
                {uniqueExams.map(exam => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
            </div>

            <div className="mobile-filter-group">
              <Calendar size={14} />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="mobile-filter-select"
              >
                <option value="all">All Time</option>
                <option value="new">Last 7 days</option>
                <option value="old">Older</option>
              </select>
            </div>

            <div className="mobile-filter-group">
              <SortAsc size={14} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mobile-filter-select"
              >
                <option value="new">New</option>
                <option value="old">Old</option>
                <option value="score-high">High</option>
                <option value="score-low">Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="results-count">
        Showing {filteredAttempts.length} of {data.totalAttempts} attempts
      </div>

      {/* Desktop Table View */}
      {!isMobile ? (
        <div className="desktop-table-container">
          <div className="table-wrapper">
            <table className="attempts-table">
              <thead>
                <tr>
                  <th>Test Title</th>
                  <th>Exam</th>
                  <th>Date & Time</th>
                  <th>Score</th>
                  <th>Time Taken</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.attemptId}>
                    <td className="test-title-cell">
                      <div className="test-title">{attempt.testTitle || 'Untitled Test'}</div>
                      <div className="test-id">ID: {attempt.attemptId?.slice(-6) || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="exam-cell">
                        <BookOpen size={14} />
                        <span>{attempt.exam?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <div className="date">{formatDate(attempt.startedAt)}</div>
                        <div className="time">{formatTime(attempt.startedAt)}</div>
                      </div>
                    </td>
                    <td>
                      <div className="score-cell">
                        <div className="score-value">{attempt.score || 0}/{attempt.totalMarks || 0}</div>
                        <div className="score-percentage">{attempt.percentage?.toFixed(1) || 0}%</div>
                      </div>
                    </td>
                    <td>
                      <div className="time-cell">
                        <Timer size={14} />
                        <span>{formatTimeTaken(attempt.timeTakenSeconds)}</span>
                      </div>
                    </td>
                    <td>
                      <div className={`status-cell ${attempt.status || 'unknown'}`}>
                        {attempt.status === 'submitted' ? 'Completed' : 'In Progress'}
                      </div>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewAttempt(attempt.attemptId)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mobile Cards View */
        <div className="mobile-cards">
          {filteredAttempts.map((attempt) => (
            <div key={attempt.attemptId} className="attempt-card">
              <div className="card-header">
                <div className="card-title-row">
                  <div className="card-left">
                    <div className="card-title">{attempt.testTitle || 'Untitled Test'}</div>
                    <div className="card-exam">
                      <BookOpen size={11} />
                      {attempt.exam?.name || 'N/A'}
                    </div>
                  </div>
                  <div className={`status-badge ${attempt.status || 'unknown'}`}>
                    {attempt.status === 'submitted' ? 'Done' : 'Progress'}
                  </div>
                </div>
                
                <div className="card-meta">
                  <span className="meta-item">
                    <Calendar size={11} />
                    {formatDate(attempt.startedAt)}
                  </span>
                  <span className="meta-item">
                    <Clock size={11} />
                    {formatTime(attempt.startedAt)}
                  </span>
                </div>
              </div>

              <div className="card-stats">
                <div className="stat-row">
                  <div className="stat-item">
                    <div className="stat-label">Score</div>
                    <div className="stat-value">
                      <span className="score-main">{attempt.score || 0}</span>
                      <span className="score-total">/{attempt.totalMarks || 0}</span>
                    </div>
                    <div className="stat-percent">{attempt.percentage?.toFixed(1) || 0}%</div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-label">Time Taken</div>
                    <div className="stat-value">
                      <Timer size={12} />
                      {formatTimeTaken(attempt.timeTakenSeconds)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button
                  className="btn btn-primary btn-sm full-width"
                  onClick={() => handleViewAttempt(attempt.attemptId)}
                >
                  <Eye size={12} />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredAttempts.length === 0 && (
        <div className="no-results">
          <Search size={24} />
          <p>No attempts found</p>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedExam('all');
              setTimeFilter('all');
              setSortBy('new');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default MyAttempts;