import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  Award, 
  User, 
  Calendar,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Download,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import "./testReport.css"
import api from '../../../api/api';

const TestReport = () => {
  const { testId } = useParams();
  
  // State for data
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100); // Default value, will update when data loads
  const [sortBy, setSortBy] = useState('score'); // 'score', 'time', 'name', 'date'
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Fetch test report data
  useEffect(() => {
    const fetchTestReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/tests/report/${testId}`);
        
        if (response.success) {
          setData(response);
          // Set max score based on actual test total marks
          setMaxScore(response.test.totalMarks);
        } else {
          setError(response.message || 'Failed to fetch test report');
        }
      } catch (err) {
        setError(err.response?.message || 'Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchTestReport();
    }
  }, [testId]);

  // Filter and sort attempts
  const filteredAttempts = useMemo(() => {
    if (!data || !data.attempts) return [];
    
    let filtered = [...data.attempts];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(attempt =>
        attempt.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply score range filter
    filtered = filtered.filter(attempt =>
      attempt.score >= minScore && attempt.score <= maxScore
    );

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'score':
          aVal = a.score;
          bVal = b.score;
          break;
        case 'time':
          aVal = a.timeTakenMinutes;
          bVal = b.timeTakenMinutes;
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'date':
          aVal = new Date(a.startedAt);
          bVal = new Date(b.startedAt);
          break;
        default:
          aVal = a.score;
          bVal = b.score;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [data, searchQuery, minScore, maxScore, sortBy, sortOrder]);

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Select all filtered users
  const selectAllFiltered = () => {
    const allFilteredIds = new Set(filteredAttempts.map(attempt => attempt.userId));
    setSelectedUsers(allFilteredIds);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle export data
  const handleExport = () => {
    // Implement export functionality here
    console.log('Exporting selected users:', Array.from(selectedUsers));
    // You can use libraries like XLSX or jsPDF for export
  };

  // Loading State
  if (loading) {
    return (
      <div className="test-report-page-container">
        <div className="test-report-loading-state">
          <Loader2 className="test-report-loading-icon" size={48} />
          <h3>Loading test report...</h3>
          <p>Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="test-report-page-container">
        <div className="test-report-error-state">
          <AlertCircle className="test-report-error-icon" size={48} />
          <h3>Error Loading Report</h3>
          <p>{error}</p>
          <button 
            className="test-report-btn test-report-btn-primary test-report-mt-md"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No Data State
  if (!data || !data.test) {
    return (
      <div className="test-report-page-container">
        <div className="test-report-empty-state">
          <div className="test-report-empty-state-icon">📊</div>
          <h3>No Test Data Found</h3>
          <p>The test report could not be loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="test-report-page-container">
      {/* Page Header */}
      <header className="test-report-header">
        <div>
          <h1 className="test-report-title">{data.test.title}</h1>
          <div className="test-report-meta">
            <span className="test-report-meta-item">
              <Clock size={16} />
              Duration: {data.test.duration} minutes
            </span>
            <span className="test-report-meta-item">
              <Award size={16} />
              Total Marks: {data.test.totalMarks}
            </span>
            <span className="test-report-meta-item">
              <User size={16} />
              Total Attempts: {data.totalAttempts || 0}
            </span>
          </div>
        </div>
        <button 
          className="test-report-btn test-report-btn-primary"
          onClick={handleExport}
          disabled={selectedUsers.size === 0}
        >
          <Download size={18} />
          Export Data
        </button>
      </header>

      {/* Filters Section - Only show if there are attempts */}
      {data.attempts && data.attempts.length > 0 && (
        <div className="test-report-filters-section">
          <div className="test-report-filters-grid">
            {/* Search Filter */}
            <div className="test-report-filter-group">
              <label className="test-report-filter-label">
                <Search size={18} />
                Search Student
              </label>
              <input
                type="text"
                placeholder="Enter student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="test-report-filter-input"
              />
            </div>

            {/* Score Range Filters */}
            <div className="test-report-filter-group">
              <label className="test-report-filter-label">Score Range</label>
              <div className="test-report-score-range">
                <div className="test-report-range-input-group">
                  <span>Min:</span>
                  <input
                    type="number"
                    min="0"
                    max={data.test.totalMarks}
                    value={minScore}
                    onChange={(e) => setMinScore(parseInt(e.target.value) || 0)}
                    className="test-report-range-input"
                  />
                </div>
                <div className="test-report-range-input-group">
                  <span>Max:</span>
                  <input
                    type="number"
                    min="0"
                    max={data.test.totalMarks}
                    value={maxScore}
                    onChange={(e) => setMaxScore(parseInt(e.target.value) || data.test.totalMarks)}
                    className="test-report-range-input"
                  />
                </div>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="test-report-filter-group">
              <label className="test-report-filter-label">Selection</label>
              <div className="test-report-selection-buttons">
                <button 
                  onClick={selectAllFiltered}
                  className="test-report-btn test-report-btn-outline test-report-selection-btn"
                  disabled={filteredAttempts.length === 0}
                >
                  <CheckSquare size={16} />
                  Select All ({filteredAttempts.length})
                </button>
                <button 
                  onClick={clearSelection}
                  className="test-report-btn test-report-btn-outline test-report-selection-btn"
                >
                  <Square size={16} />
                  Clear Selection
                </button>
              </div>
              {selectedUsers.size > 0 && (
                <div className="test-report-selected-count">
                  <CheckCircle size={16} />
                  {selectedUsers.size} student(s) selected
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="test-report-results-section">
        <div className="test-report-results-header">
          <h2 className="test-report-results-title">Test Attempts</h2>
          <div className="test-report-results-count">
            Showing {filteredAttempts.length} of {data.totalAttempts || 0} attempts
          </div>
        </div>

        {/* No Attempts Message */}
        {(!data.attempts || data.attempts.length === 0) && (
          <div className="test-report-empty-state">
            <div className="test-report-empty-state-icon">📝</div>
            <h3>No Attempts Yet</h3>
            <p>No students have attempted this test yet.</p>
          </div>
        )}

        {/* Table for Desktop - Only show if there are filtered attempts */}
        {filteredAttempts.length > 0 && (
          <>
            <div className="test-report-table-container">
              <table className="test-report-attempts-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={filteredAttempts.length > 0 && 
                                 filteredAttempts.every(a => selectedUsers.has(a.userId))}
                        onChange={() => {
                          if (filteredAttempts.every(a => selectedUsers.has(a.userId))) {
                            clearSelection();
                          } else {
                            selectAllFiltered();
                          }
                        }}
                      />
                    </th>
                    <th onClick={() => handleSort('name')} className="test-report-sortable">
                      Student Name
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </th>
                    <th onClick={() => handleSort('score')} className="test-report-sortable">
                      Score
                      {sortBy === 'score' && (
                        sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </th>
                    <th>Percentage</th>
                    <th onClick={() => handleSort('time')} className="test-report-sortable">
                      Time Taken
                      {sortBy === 'time' && (
                        sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </th>
                    <th onClick={() => handleSort('date')} className="test-report-sortable">
                      Attempt Date
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map((attempt) => (
                    <tr 
                      key={attempt.userId}
                      className={selectedUsers.has(attempt.userId) ? 'test-report-selected-row' : ''}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(attempt.userId)}
                          onChange={() => toggleUserSelection(attempt.userId)}
                        />
                      </td>
                      <td className="test-report-student-cell">
                        <div className="test-report-student-info">
                          <div className="test-report-student-avatar">
                            {attempt.name.charAt(0)}
                          </div>
                          <div className="test-report-student-details">
                            <div className="test-report-student-name">{attempt.name}</div>
                            <small className="test-report-student-id">ID: {attempt.userId.slice(-6)}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="test-report-score-display">
                          <span className="test-report-score-value">{attempt.score}</span>
                          <span className="test-report-score-total">/{data.test.totalMarks}</span>
                        </div>
                      </td>
                      <td>
                        <div className="test-report-percentage-container">
                          <div className="test-report-percentage-bar">
                            <div 
                              className="test-report-percentage-fill"
                              style={{ width: `${attempt.percentage}%` }}
                            ></div>
                          </div>
                          <span className="test-report-percentage-value">{attempt.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="test-report-time-display">
                          <Clock size={16} />
                          {attempt.timeTakenMinutes.toFixed(1)} min
                          <div className="test-report-time-status">
                            {attempt.timeTakenMinutes <= data.test.duration ? (
                              <span className="test-report-status-success">On Time</span>
                            ) : (
                              <span className="test-report-status-warning">Overtime</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="test-report-date-display">
                          <Calendar size={16} />
                          <div>
                            <div>{formatDate(attempt.startedAt)}</div>
                            <small>{formatTime(attempt.startedAt)}</small>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="test-report-mobile-cards">
              {filteredAttempts.map((attempt) => (
                <div 
                  key={attempt.userId} 
                  className={`test-report-mobile-card ${selectedUsers.has(attempt.userId) ? 'test-report-selected-card' : ''}`}
                >
                  <div className="test-report-mobile-card-header">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(attempt.userId)}
                      onChange={() => toggleUserSelection(attempt.userId)}
                    />
                    <div className="test-report-mobile-student-info">
                      <div className="test-report-mobile-student-name">{attempt.name}</div>
                      <small>ID: {attempt.userId.slice(-6)}</small>
                    </div>
                  </div>

                  <div className="test-report-mobile-card-content">
                    <div className="test-report-mobile-stat">
                      <span className="test-report-stat-label">Score:</span>
                      <span className="test-report-stat-value">{attempt.score}/{data.test.totalMarks}</span>
                    </div>
                    <div className="test-report-mobile-stat">
                      <span className="test-report-stat-label">Percentage:</span>
                      <span className="test-report-stat-value">{attempt.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="test-report-mobile-stat">
                      <span className="test-report-stat-label">Time Taken:</span>
                      <span className="test-report-stat-value">
                        {attempt.timeTakenMinutes.toFixed(1)} min
                        {attempt.timeTakenMinutes > data.test.duration && (
                          <span className="test-report-mobile-status-warning"> (Overtime)</span>
                        )}
                      </span>
                    </div>
                    <div className="test-report-mobile-stat">
                      <span className="test-report-stat-label">Attempt Date:</span>
                      <span className="test-report-stat-value">
                        {formatDate(attempt.startedAt)} at {formatTime(attempt.startedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Filter Results */}
        {data.attempts && data.attempts.length > 0 && filteredAttempts.length === 0 && (
          <div className="test-report-empty-state">
            <div className="test-report-empty-state-icon">🔍</div>
            <h3>No matching attempts</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestReport;