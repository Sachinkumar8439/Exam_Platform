import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Award, 
  Clock,
  BookOpen,
  Target,
  BarChart3,
  Eye,
  Calendar,
  ChevronRight,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useAppState } from '../../../hooks/useAppState';
import './dashboard.css';

const Dashboard = () => {
  const { user, api, isAuthenticated } = useAppState();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalPoints: 0,
    dayStreak: 0,
    testsCompleted: 0,
    roomsJoined: 0,
    totalTimeSpent: 0,
    accuracy: 0,
  });
  
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

//   useEffect(() => {
//     if (isAuthenticated) {
//       fetchDashboardData();
//     }
//   }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats
      const statsResponse = await api.get('/users/stats');
      setStats(statsResponse.data.data);
      
      // Fetch recent attempts
      const attemptsResponse = await api.get('/attempts/recent');
      setRecentAttempts(attemptsResponse.data.data);
      
      // Fetch upcoming tests
      const testsResponse = await api.get('/tests/upcoming');
      setUpcomingTests(testsResponse.data.data);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId) => {
    navigate(`/mainpage/test/${testId}`);
  };

  const handleViewAttempt = (attemptId) => {
    navigate(`/mainpage/attempt/${attemptId}`);
  };

  const handleJoinRoom = () => {
    navigate('/mainpage/room');
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'var(--color-success)';
    if (percentage >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="welcome-text">
            Welcome back, <span className="user-name">{user?.name}</span>!
          </h1>
          <p className="subtitle">
            Here's your learning overview and progress
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleJoinRoom}>
            <Plus size={16} />
            Join Room
          </button>
          <button className="btn btn-outline">
            <Search size={16} />
            Search Tests
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('tests')}
        >
          <BookOpen size={16} />
          My Tests
        </button>
        <button 
          className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <TrendingUp size={16} />
          Progress
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
            <Award color="var(--color-primary)" />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalPoints}</h3>
            <p className="stat-label">Total Points</p>
            <div className="stat-trend">
              <TrendingUp size={14} />
              <span>+12 this week</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(22, 163, 74, 0.1)' }}>
            <Target color="var(--color-success)" />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.dayStreak} days</h3>
            <p className="stat-label">Current Streak</p>
            <div className="stat-trend">
              <TrendingUp size={14} />
              <span>Keep it up!</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <BookOpen color="var(--color-warning)" />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.testsCompleted}</h3>
            <p className="stat-label">Tests Completed</p>
            <div className="stat-trend">
              <TrendingUp size={14} />
              <span>+2 this month</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
            <BarChart3 color="var(--color-info)" />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.accuracy}%</h3>
            <p className="stat-label">Overall Accuracy</p>
            <div className="stat-trend" style={{ color: getPerformanceColor(stats.accuracy) }}>
              <TrendingUp size={14} />
              <span>Good progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Column - Recent Activity */}
        <div className="content-column">
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <Clock size={20} />
                Recent Attempts
              </h3>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/mainpage/attempts')}
              >
                View All
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="attempts-list">
              {recentAttempts.length > 0 ? (
                recentAttempts.map((attempt) => (
                  <div key={attempt._id} className="attempt-item">
                    <div className="attempt-info">
                      <h4 className="attempt-title">{attempt.test?.title}</h4>
                      <div className="attempt-meta">
                        <span className="attempt-date">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </span>
                        <span className="attempt-score">
                          Score: {attempt.score}/{attempt.totalMarks}
                        </span>
                      </div>
                    </div>
                    <div className="attempt-actions">
                      <div className="accuracy-badge" 
                        style={{ 
                          background: getPerformanceColor((attempt.score/attempt.totalMarks)*100),
                          color: 'white'
                        }}
                      >
                        {Math.round((attempt.score/attempt.totalMarks)*100)}%
                      </div>
                      <button 
                        className="view-btn"
                        onClick={() => handleViewAttempt(attempt._id)}
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No attempts yet. Start your first test!</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/mainpage/tests')}
                  >
                    Browse Tests
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Time Spent */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <Clock size={20} />
                Time Spent
              </h3>
            </div>
            <div className="time-spent-card">
              <div className="time-display">
                <h2 className="time-value">{formatTime(stats.totalTimeSpent)}</h2>
                <p className="time-label">Total Learning Time</p>
              </div>
              <div className="time-breakdown">
                <div className="time-item">
                  <span className="time-type">Tests</span>
                  <span className="time-amount">{formatTime(stats.totalTimeSpent * 0.6)}</span>
                </div>
                <div className="time-item">
                  <span className="time-type">Revision</span>
                  <span className="time-amount">{formatTime(stats.totalTimeSpent * 0.3)}</span>
                </div>
                <div className="time-item">
                  <span className="time-type">Rooms</span>
                  <span className="time-amount">{formatTime(stats.totalTimeSpent * 0.1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Upcoming Tests */}
        <div className="content-column">
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <Calendar size={20} />
                Upcoming Tests
              </h3>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/mainpage/tests')}
              >
                View All
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="tests-list">
              {upcomingTests.length > 0 ? (
                upcomingTests.map((test) => (
                  <div key={test._id} className="test-item">
                    <div className="test-info">
                      <div className="test-badge">
                        {test.exam?.name || 'General'}
                      </div>
                      <h4 className="test-title">{test.title}</h4>
                      <div className="test-meta">
                        <span className="test-subject">
                          {test.subject?.name} • {test.chapter?.name}
                        </span>
                        <span className="test-duration">
                          {test.duration} mins
                        </span>
                      </div>
                      <div className="test-stats">
                        <span className="stat">
                          <BookOpen size={14} />
                          {test.questions?.length || 0} questions
                        </span>
                      </div>
                    </div>
                    <div className="test-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleStartTest(test._id)}
                      >
                        Start Test
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No upcoming tests scheduled</p>
                  <button 
                    className="btn btn-outline"
                    onClick={() => navigate('/mainpage/tests')}
                  >
                    <Search size={16} />
                    Explore Tests
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
              <button 
                className="quick-action-btn"
                onClick={() => navigate('/mainpage/tests')}
              >
                <BookOpen size={24} />
                <span>Take Test</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => navigate('/mainpage/room')}
              >
                <Users size={24} />
                <span>Join Room</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => navigate('/mainpage/leaderboard')}
              >
                <Award size={24} />
                <span>Leaderboard</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => navigate('/mainpage/profile')}
              >
                <Activity size={24} />
                <span>My Progress</span>
              </button>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">Performance Summary</h3>
            </div>
            <div className="performance-summary">
              <div className="performance-item">
                <div className="performance-label">Accuracy</div>
                <div className="performance-bar">
                  <div 
                    className="performance-fill" 
                    style={{ 
                      width: `${stats.accuracy}%`,
                      background: getPerformanceColor(stats.accuracy)
                    }}
                  ></div>
                </div>
                <div className="performance-value">{stats.accuracy}%</div>
              </div>
              
              <div className="performance-item">
                <div className="performance-label">Completion Rate</div>
                <div className="performance-bar">
                  <div 
                    className="performance-fill" 
                    style={{ 
                      width: `${Math.min(100, (stats.testsCompleted/10)*100)}%`,
                      background: 'var(--color-primary)'
                    }}
                  ></div>
                </div>
                <div className="performance-value">{stats.testsCompleted}/10</div>
              </div>
              
              <div className="performance-item">
                <div className="performance-label">Daily Goal</div>
                <div className="performance-bar">
                  <div 
                    className="performance-fill" 
                    style={{ 
                      width: `${stats.dayStreak * 10}%`,
                      background: 'var(--color-success)'
                    }}
                  ></div>
                </div>
                <div className="performance-value">{stats.dayStreak} days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;