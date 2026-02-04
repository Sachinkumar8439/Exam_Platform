import { useEffect, useState } from "react";
import {
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  Plus,
  Users,
  BarChart3,
  Edit,
  Trash2,
  Eye,
  Play,
  Copy,
  Filter,
  ChevronDown,
} from "lucide-react";
import "./tests.css";
import api from "../../../api/api";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../../api/toast";
import { copyToClipboard } from "../../../utils";

const YourTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Responsive breakpoints
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth < 480);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 480);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchMyTests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tests");
      console.log(res);
      setTests(res.tests || []);
    } catch {
      setError("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTests();
  }, []);

  // Calculate stats
  const stats = {
    total: tests.length,
    draft: tests.filter((t) => t.status === "draft").length,
    published: tests.filter((t) => t.isPublished).length,
    live: tests.filter((t) => t.status === "live").length,
    upcoming: tests.filter((t) => t.status === "upcoming").length,
    completed: tests.filter((t) => t.status === "completed").length,
  };

  // Filter tests based on status
  const filteredTests =
    filterStatus === "all"
      ? tests
      : tests.filter((test) => {
          if (filterStatus === "published") {
            return test.status === "published" || test.isPublished;
          }
          return test.status === filterStatus;
        });

  // Handle test actions
  const handleAction = async (action, testId, e) => {
    e?.stopPropagation();
    setDropdownOpen(null);
    console.log(testId);

    switch (action) {
      case "edit":
        console.log("Edit test:", testId);
        navigate(`/u/test-create/${testId}`);
        break;
      case "delete":
        if (window.confirm("Are you sure you want to delete this test?")) {
          try {
            await api.delete(`/tests/${testId}`);
            fetchMyTests();
            showSuccessToast("Test deleted successfully !");
          } catch {
            showErrorToast("Failed to delete test");
          }
        }
        break;
      case "view":
        console.log("View test:", testId);
        // Navigate to test report page
        navigate(`/u/tests/report/${testId}`);
        break;
      case "copy-test-link":
        console.log("test link:", testId);
        try {
          const link = `${window.location.origin}/t/attempt/${testId}`;
          await copyToClipboard(link);
          showSuccessToast("Test link copied !");
        } catch (err) {
          console.error(err);
          showErrorToast("Failed to copy link");
        }
        break;
      case "publish":
        try {
          const res = await api.put(`/tests/${testId}`, { isPublished: true });
          console.log(res);
          fetchMyTests();
          showSuccessToast("Test published successfully !");
        } catch {
          showErrorToast("Failed to Publish test");
        }
        break;
      default:
        break;
    }
  };

  // Format date for mobile
  const formatDate = (dateString, forMobile = false) => {
    const date = new Date(dateString);
    if (forMobile) {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    }
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={isMobile ? 12 : 14} />;
      case "draft":
        return <FileText size={isMobile ? 12 : 14} />;
      case "live":
        return <Play size={isMobile ? 12 : 14} />;
      case "upcoming":
        return <Clock size={isMobile ? 12 : 14} />;
      default:
        return <AlertCircle size={isMobile ? 12 : 14} />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "draft":
        return "muted";
      case "live":
        return "error";
      case "published":
        return "info";
      case "upcoming":
        return "warning";
      default:
        return "muted";
    }
  };

  // Check if edit button should be shown
  const canEditTest = (test) => {
    // Edit only allowed for draft, upcoming, and published (but not live)
    return ["draft", "upcoming", "published"].includes(test.status) && !test.isLive;
  };

  // Check if view results should be shown/enabled
  const canViewResults = (test) => {
    // View results only for completed tests
    return test.status === "completed";
  };

  return (
    <div className="your-tests-page">
      {/* ===== Stats Overview ===== */}
      <div
        className={`your-tests-stats-overview ${isMobile ? "mobile" : ""} ${isSmallMobile ? "small-mobile" : ""}`}
      >
        <div className="your-tests-stat-card">
          <div className="your-tests-stat-icon total">
            <BarChart3 size={isMobile ? 20 : 24} />
          </div>
          <div className="your-tests-stat-content">
            <h3>{stats.total}</h3>
            <p>{isMobile ? "Total" : "Total Tests"}</p>
          </div>
        </div>

        <div className="your-tests-stat-card">
          <div className="your-tests-stat-icon draft">
            <FileText size={isMobile ? 20 : 24} />
          </div>
          <div className="your-tests-stat-content">
            <h3>{stats.draft}</h3>
            <p>{isMobile ? "Draft" : "Draft"}</p>
          </div>
        </div>

        <div className="your-tests-stat-card">
          <div className="your-tests-stat-icon published">
            <Eye size={isMobile ? 20 : 24} />
          </div>
          <div className="your-tests-stat-content">
            <h3>{stats.published}</h3>
            <p>{isMobile ? "Pub" : "Published"}</p>
          </div>
        </div>

        <div className="your-tests-stat-card">
          <div className="your-tests-stat-icon live">
            <Users size={isMobile ? 20 : 24} />
          </div>
          <div className="your-tests-stat-content">
            <h3>{stats.live}</h3>
            <p>{isMobile ? "Live" : "Live Now"}</p>
          </div>
        </div>

        <div className="your-tests-stat-card">
          <div className="your-tests-stat-icon upcoming">
            <Calendar size={isMobile ? 20 : 24} />
          </div>
          <div className="your-tests-stat-content">
            <h3>{stats.upcoming}</h3>
            <p>{isMobile ? "Upcom" : "Upcoming"}</p>
          </div>
        </div>

        <div className="your-tests-stat-card">
          <div className="your-tests-stat-icon completed">
            <CheckCircle size={isMobile ? 20 : 24} />
          </div>
          <div className="your-tests-stat-content">
            <h3>{stats.completed}</h3>
            <p>{isMobile ? "Done" : "Completed"}</p>
          </div>
        </div>
      </div>
      <div className="your-tests-header">
        <button
          className="your-tests-btn your-tests-btn-primary your-tests-create-btn"
          onClick={() => navigate("/u/test-create")}
        >
          <Plus size={isMobile ? 16 : 20} />
          {isMobile ? "Create" : "Create Test"}
        </button>
      </div>

      {/* ===== Loading State ===== */}
      {loading && (
        <div className="your-tests-loading-state">
          <div className="your-tests-loading-spinner"></div>
          <p>Loading your tests...</p>
        </div>
      )}

      {/* ===== Error State ===== */}
      {!loading && error && (
        <div className="your-tests-error-state">
          <AlertCircle size={isMobile ? 32 : 48} color="var(--color-error)" />
          <h3>Failed to Load</h3>
          <p>{error}</p>
          <button className="your-tests-btn your-tests-btn-outline your-tests-mt-md" onClick={fetchMyTests}>
            Try Again
          </button>
        </div>
      )}

      {/* ===== Test List ===== */}
      {!loading && !error && (
        <div className="your-tests-section">
          <div className="your-tests-section-header">
            <h2>Recent Tests ({filteredTests.length})</h2>

            {isMobile ? (
              <div className="your-tests-mobile-filter">
                <button
                  className="your-tests-filter-toggle-btn"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} />
                  Filter
                  <ChevronDown
                    size={14}
                    className={showFilters ? "rotate" : ""}
                  />
                </button>

                {showFilters && (
                  <div className="your-tests-mobile-filter-dropdown">
                    <div className="your-tests-filter-options">
                      {[
                        "all",
                        "draft",
                        "published",
                        "live",
                        "upcoming",
                        "completed",
                      ].map((status) => (
                        <button
                          key={status}
                          className={`your-tests-filter-option ${filterStatus === status ? "active" : ""}`}
                          onClick={() => {
                            setFilterStatus(status);
                            setShowFilters(false);
                          }}
                        >
                          {status === "all"
                            ? "All Tests"
                            : status === "published"
                              ? "Published"
                              : status.charAt(0).toUpperCase() +
                                status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="your-tests-filter-controls">
                <select
                  className="your-tests-filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="live">Live</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          {filteredTests.length === 0 ? (
            <div className="your-tests-empty-state">
              <FileText size={isMobile ? 48 : 64} color="var(--text-muted)" />
              <h3>No Tests Found</h3>
              <p>
                {filterStatus === "all"
                  ? "Create your first test to get started"
                  : `No ${filterStatus} tests found`}
              </p>
              <button
                className="your-tests-btn your-tests-btn-primary your-tests-mt-md"
                onClick={() => navigate("/u/test-create")}
              >
                <Plus size={16} />
                Create Test
              </button>
            </div>
          ) : (
            <div className={`your-tests-grid ${isMobile ? "mobile" : ""}`}>
              {filteredTests.map((test) => (
                <TestCard
                  key={test._id}
                  test={test}
                  isMobile={isMobile}
                  dropdownOpen={dropdownOpen === test._id}
                  onToggleDropdown={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(
                      dropdownOpen === test._id ? null : test._id,
                    );
                  }}
                  onAction={handleAction}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  canEditTest={canEditTest}
                  canViewResults={canViewResults}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TestCard = ({
  test,
  isMobile,
  dropdownOpen,
  onToggleDropdown,
  onAction,
  formatDate,
  formatTime,
  getStatusIcon,
  getStatusColor,
  canEditTest,
  canViewResults,
}) => {
  const status = test.status;
  const statusColor = getStatusColor(status);
  const showEditButton = canEditTest(test);
  const showViewResults = canViewResults(test);

  // Check if test is currently live
  const isCurrentlyLive = test.status === "live";
  
  // Check if test is completed
  const isCompleted = test.status === "completed";

  return (
    <div className={`your-tests-test-card ${isMobile ? "mobile" : ""}`}>
      <div className="your-tests-test-card-header">
        <div className="your-tests-test-meta">
          <span className={`your-tests-test-status ${statusColor}`}>
            {getStatusIcon(status)}
            {isMobile
              ? status === "upcoming"
                ? "Upcom"
                : status === "published"
                  ? "Pub"
                  : status.charAt(0).toUpperCase() + status.slice(1)
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {!isMobile && (
            <span className="your-tests-test-date">
              <Clock size={12} />
              Created: {formatDate(test.createdAt)}
            </span>
          )}
        </div>

        <div className="your-tests-test-actions">
          <button className="your-tests-action-btn" onClick={onToggleDropdown}>
            <MoreVertical size={isMobile ? 18 : 20} />
          </button>

          {dropdownOpen && (
            <div className={`your-tests-dropdown-menu ${isMobile ? "mobile" : ""}`}>
              {/* View button - always shown but disabled if not completed */}
              <button 
                onClick={(e) => showViewResults && onAction("view", test._id, e)}
                className={!showViewResults ? "disabled" : ""}
                disabled={!showViewResults}
              >
                <Eye size={14} />
                View Results
                {!showViewResults && (
                  <span className="your-tests-dropdown-tooltip">
                    Available after test completion
                  </span>
                )}
              </button>
              
              {/* Edit button - hidden for live tests */}
              {showEditButton && (
                <button onClick={(e) => onAction("edit", test._id, e)}>
                  <Edit size={14} />
                  Edit
                </button>
              )}
              
              <button onClick={(e) => onAction("copy-test-link", test._id, e)}>
                <Copy size={14} />
                Test Link
              </button>
              <div className="divider"></div>
              <button
                className="delete-btn"
                onClick={(e) => onAction("delete", test._id, e)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="your-tests-test-card-body">
        <h3 className="your-tests-test-title">{test.title}</h3>

        {isMobile ? (
          <div className="your-tests-mobile-test-info">
            <div className="your-tests-mobile-info-row">
              <span className="your-tests-mobile-info-label">
                {test.exam?.name || "N/A"}
              </span>
              <span className="your-tests-mobile-info-dot">•</span>
              <span className="your-tests-mobile-info-label">
                {test.subject?.name || "N/A"}
              </span>
            </div>
            <div className="your-tests-mobile-info-row">
              <span className="your-tests-mobile-info-value">
                {test.chapter?.name || "N/A"}
              </span>
            </div>
          </div>
        ) : (
          <div className="your-tests-test-info">
            <div className="your-tests-info-row">
              <span className="your-tests-info-label">Exam:</span>
              <span className="your-tests-info-value">{test.exam?.name || "N/A"}</span>
            </div>
            <div className="your-tests-info-row">
              <span className="your-tests-info-label">Subject:</span>
              <span className="your-tests-info-value">{test.subject?.name || "N/A"}</span>
            </div>
            <div className="your-tests-info-row">
              <span className="your-tests-info-label">Chapter:</span>
              <span className="your-tests-info-value">{test.chapter?.name || "N/A"}</span>
            </div>
          </div>
        )}

        <div className={`your-tests-test-stats ${isMobile ? "mobile" : ""}`}>
          <div className="your-tests-stat">
            <FileText size={isMobile ? 14 : 16} />
            <span>{test.questionsCount || 0} Qs</span>
          </div>
          <div className="your-tests-stat">
            <Clock size={isMobile ? 14 : 16} />
            <span>{test.duration || 0} Min</span>
          </div>
          {isMobile && (
            <div className="your-tests-stat">
              <Calendar size={14} />
              <span>{formatDate(test.startTime, true)}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`your-tests-test-card-footer ${isMobile ? "mobile" : ""}`}>
        {!isMobile ? (
          <>
            <div className="your-tests-schedule-info">
              <div className="your-tests-schedule-item">
                <span className="your-tests-schedule-label">Starts:</span>
                <span className="your-tests-schedule-time">
                  {formatDate(test.startTime)} at {formatTime(test.startTime)}
                </span>
              </div>
              <div className="your-tests-schedule-item">
                <span className="your-tests-schedule-label">Ends:</span>
                <span className="your-tests-schedule-time">
                  {formatDate(test.endTime)} at {formatTime(test.endTime)}
                </span>
              </div>
            </div>

            <button
              className={`your-tests-btn your-tests-btn-sm ${isCurrentlyLive ? "your-tests-btn-live" : isCompleted ? "your-tests-btn-primary" : "your-tests-btn-outline"}`}
              onClick={(e) => {
                if (isCompleted) {
                  onAction("view", test._id, e);
                } else if (test.status === "draft") {
                  onAction("publish", test._id, e);
                } else {
                  // For other statuses, show appropriate action
                  onAction("view", test._id, e);
                }
              }}
              disabled={isCurrentlyLive || (!isCompleted && test.status !== "draft")}
            >
              {isCurrentlyLive ? "Live Now" : 
               isCompleted ? "View Results" : 
               test.status === "draft" ? "Publish" : 
               test.status.charAt(0).toUpperCase() + test.status.slice(1)}
              {isCurrentlyLive && <span className="live-pulse"></span>}
            </button>
          </>
        ) : (
          <>
            <div className="your-tests-mobile-schedule">
              <div className="your-tests-mobile-schedule-time">
                <Clock size={12} />
                <span>
                  {formatTime(test.startTime)} - {formatTime(test.endTime)}
                </span>
              </div>
            </div>

            <button
              className={`your-tests-btn your-tests-btn-sm ${isCurrentlyLive ? "your-tests-btn-live" : isCompleted ? "your-tests-btn-primary" : "your-tests-btn-outline"}`}
              onClick={(e) => {
                if (isCompleted) {
                  onAction("view", test._id, e);
                } else if (test.status === "draft") {
                  onAction("publish", test._id, e);
                } else {
                  onAction("view", test._id, e);
                }
              }}
              disabled={isCurrentlyLive || (!isCompleted && test.status !== "draft")}
            >
              {isCurrentlyLive ? "Live" : 
               isCompleted ? "Results" : 
               test.status === "draft" ? "Publish" : 
               "View"}
              {isCurrentlyLive && <span className="live-pulse"></span>}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default YourTests;