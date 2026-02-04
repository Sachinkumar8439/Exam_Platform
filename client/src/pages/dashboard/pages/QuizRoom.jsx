import React, { useEffect, useRef, useState } from "react";
import "./QuizRoom.css";
import { socket } from "../../../socket/socket";
import api from "../../../api/api";
import { 
  Users, 
  Trophy, 
  Clock, 
  MessageCircle, 
  Copy, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  LogOut, 
  Settings,
  User,
  Mail,
  Hash,
  PlusCircle,
  DoorOpen,
  Rocket,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  Send,
  Crown,
  Award,
  Star,
  Check,
  XCircle,
  Timer,
  Brain
} from "lucide-react";

const QuizRoom = () => {
  /* ================= STATES ================= */
  const [showRoomModal, setShowRoomModal] = useState(true);
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomAction, setRoomAction] = useState("create");
  const [roomData, setRoomData] = useState(null);

  const [members, setMembers] = useState([]);
  const [scores, setScores] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeQuestion, setActiveQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [timer, setTimer] = useState(0);

  // Question sending states
  const [questionInput, setQuestionInput] = useState("");
  const [optionsInput, setOptionsInput] = useState("");
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [timeLimit, setTimeLimit] = useState(30);

  const [notification, setNotification] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // New states for answer feedback
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  /* ================= REFS ================= */
  const hasJoinedRef = useRef(false);
  const timerRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);
  const answerFeedbackRef = useRef(null);

  /* ================= LOAD USER ================= */
  useEffect(() => {
    setUserName(localStorage.getItem("quizUserName") || "");
    setUserEmail(localStorage.getItem("quizUserEmail") || "");
  }, []);

  /* ================= SCROLL CHAT ================= */
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  /* ================= SOCKET JOIN (ONCE) ================= */
  useEffect(() => {
    if (!roomData?.code) return;
    if (hasJoinedRef.current) return;

    socket.connect();

    const onConnect = () => {
      setIsConnected(true);

      socket.emit("quiz-user-connected", {
        name: userName,
        email: userEmail
      });

      socket.emit("quiz-join-room", {
        roomCode: roomData.code,
        userName,
        userEmail
      });

      hasJoinedRef.current = true;
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("quiz-room-joined", (data) => {
      setRoomData(prev => ({
        ...prev,
        ...data.room
      }));
      setMembers(data.members || []);
      setIsAdmin(data.isAdmin || false);
      setOnlineCount(data.onlineCount || 1);

      if (data.scores) {
        setScores(
          Object.entries(data.scores).map(([email, score]) => ({
            email,
            score
          }))
        );
      }
      showNotification(`Joined ${data.room.name}!`);
    });

    socket.on("quiz-room-error", (data) => {
      showNotification(`Error: ${data.message}`);
      if (data.message.includes("not found")) {
        setShowRoomModal(true);
        setRoomData(null);
        hasJoinedRef.current = false;
      }
    });

    socket.on("quiz-member-joined", (d) => {
      setOnlineCount(d.onlineCount);
      setMembers(d.members || members);
      showNotification(`${d.name} joined`);
    });

    socket.on("quiz-member-left", (d) => {
      setOnlineCount(d.onlineCount);
      setMembers(d.members || members);
      showNotification(`${d.name} left`);
    });

    socket.on("quiz-new-question", (q) => {
      setActiveQuestion(q);
      setShowAnswer(false);
      setUserAnswer("");
      setCorrectAnswer("");
      setAnswerFeedback(null);
      setHasAnswered(false);
      startTimer(q.timeLimit || 30);
      showNotification(`New question from ${q.senderName}!`);
    });

    socket.on("quiz-answer-submitted", (data) => {
      showNotification("Answer submitted! Waiting for results...");
      setHasAnswered(true);
    });

    // 🔥 NEW: Individual answer result
    socket.on("quiz-answer-result", (data) => {
      setAnswerFeedback(data);
      if (data.isCorrect) {
        showNotification(`Correct! +${data.points} points 🎉`);
      } else {
        showNotification(`Incorrect! The correct answer was: ${data.correctAnswer}`);
      }
      
      // Update user's score
      setScores(prev => {
        const newScores = [...prev];
        const userScoreIndex = newScores.findIndex(s => s.email === userEmail);
        if (userScoreIndex >= 0) {
          newScores[userScoreIndex].score = data.totalScore;
        }
        return newScores;
      });
    });

    socket.on("quiz-answer-revealed", (d) => {
      setCorrectAnswer(d.correctAnswer);
      setShowAnswer(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        setTimer(0);
      }

      if (d.scores) {
        setScores(
          Object.entries(d.scores).map(([email, score]) => ({
            email,
            score
          }))
        );
      }

      showNotification(`Answer revealed by ${d.revealedBy}!`);

      setTimeout(() => {
        setActiveQuestion(null);
        setShowAnswer(false);
        setUserAnswer("");
        setCorrectAnswer("");
        setAnswerFeedback(null);
        setHasAnswered(false);
      }, 5000);
    });

    socket.on("quiz-chat-message", (msg) => {
      setChatMessages((p) => [...p, msg]);
    });

    return () => {
      socket.off();
    };
  }, [roomData?.code, userName, userEmail]);

  /* ================= NOTIFICATION ================= */
  const showNotification = (msg) => {
    clearTimeout(notificationTimeoutRef.current);
    setNotification(msg);
    notificationTimeoutRef.current = setTimeout(() => setNotification(""), 3000);
  };

  /* ================= TIMER FUNCTIONS ================= */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startTimer = (seconds) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setTimer(seconds);
    
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* ================= CREATE / JOIN ROOM ================= */
  const handleRoomSubmit = async (e) => {
    e.preventDefault();

    if (!userName || !userEmail) return showNotification("Enter name & email");
    if (roomAction === 'create' && !roomName) return showNotification("Enter room name");
    if (roomAction === 'join' && !roomCode) return showNotification("Enter room code");

    localStorage.setItem("quizUserName", userName);
    localStorage.setItem("quizUserEmail", userEmail);

    setIsLoading(true);

    try {
      if (roomAction === "create") {
        const res = await api.post("/room", {
          roomName,
          userName,
          userEmail
        });

        if (res.success) {
          setRoomData({
            id: res.room.id,
            code: res.room.code,
            name: res.room.name,
            createdBy: null
          });
          setShowRoomModal(false);
          showNotification("Room created! Joining...");
        } else {
          showNotification(res.message || "Failed to create room");
        }
      } else {
        setRoomData({
          code: roomCode.toUpperCase(),
          name: `Room ${roomCode.toUpperCase()}`,
          createdBy: null
        });
        setShowRoomModal(false);
        showNotification("Joining room...");
      }
    } catch {
      showNotification("Failed to connect");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= SEND QUESTION ================= */
  const handleSubmitQuestion = () => {
    if (!questionInput.trim() || !optionsInput.trim()) {
      return showNotification("Enter question and options");
    }
    
    const options = optionsInput.split(',,').map(opt => opt.trim()).filter(opt => opt);
    
    if (options.length < 2) return showNotification("Need at least 2 options");
    if (options.length > 6) return showNotification("Max 6 options");
    if (correctOptionIndex >= options.length) return showNotification("Invalid correct option");

    if (socket.connected && roomData) {
      socket.emit("quiz-send-question", {
        roomCode: roomData.code,
        question: {
          text: questionInput,
          options: options,
          correctAnswer: options[correctOptionIndex],
          timeLimit: parseInt(timeLimit)
        }
      });
      
      setQuestionInput("");
      setOptionsInput("");
      setCorrectOptionIndex(0);
      showNotification("Question sent!");
    } else {
      showNotification("Not connected");
    }
  };

  /* ================= SUBMIT ANSWER ================= */
  const handleSubmitAnswer = () => {
    if (!userAnswer) return showNotification("Select an answer");
    
    socket.emit("quiz-submit-answer", {
      roomCode: roomData.code,
      questionId: activeQuestion.id,
      answer: userAnswer
    });
    
    setUserAnswer("");
  };

  /* ================= REVEAL ANSWER ================= */
  const revealAnswer = () => {
    if (activeQuestion && socket.connected && roomData) {
      socket.emit("quiz-reveal-answer", {
        roomCode: roomData.code
      });
    }
  };

  /* ================= SEND CHAT MESSAGE ================= */
  const handleSendChat = () => {
    if (!chatMessage.trim() || !socket.connected) {
      return showNotification("Cannot send message");
    }
    
    socket.emit("quiz-send-chat", {
      roomCode: roomData.code,
      text: chatMessage
    });
    
    setChatMessage("");
  };

  /* ================= LEAVE ROOM ================= */
  const leaveRoom = () => {
    if (socket.connected && roomData?.code) {
      socket.emit("quiz-leave-room", { roomCode: roomData.code });
    }
    
    socket.disconnect();
    hasJoinedRef.current = false;
    setRoomData(null);
    setShowRoomModal(true);
    setActiveQuestion(null);
    setChatMessages([]);
    setMembers([]);
    setScores([]);
    setAnswerFeedback(null);
    setHasAnswered(false);
    setShowLeftSidebar(false);
    setShowRightSidebar(false);
  };

  /* ================= RECONNECT ================= */
  const reconnectSocket = () => {
    if (!socket.connected) {
      socket.connect();
      showNotification("Reconnecting...");
    }
  };

  /* ================= TOGGLE FULLSCREEN ================= */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /* ================= HANDLE ENTER KEY IN CHAT ================= */
  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  /* ================= REFRESH MEMBERS ================= */
  const refreshMembers = () => {
    if (roomData && socket.connected) {
      socket.emit("quiz-join-room", {
        roomCode: roomData.code,
        userName: userName,
        userEmail: userEmail
      });
      showNotification("Refreshing...");
    }
  };

  /* ================= COPY ROOM CODE ================= */
  const copyRoomCode = () => {
    if (roomData?.code) {
      navigator.clipboard.writeText(roomData.code);
      showNotification("Room code copied!");
    }
  };

  /* ================= GET USER SCORE ================= */
  const getUserScore = () => {
    const userScore = scores.find(s => s.email === userEmail);
    return userScore ? userScore.score : 0;
  };

  /* ================= GET LEADERBOARD ================= */
  const getLeaderboard = () => {
    return scores.sort((a, b) => b.score - a.score).slice(0, 5);
  };

  /* ================= GET USER INITIALS ================= */
  const getUserInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  };

  /* ================= GET ADMIN NAME ================= */
  const getAdminName = () => {
    if (!roomData?.createdBy) return 'Unknown';
    
    if (typeof roomData.createdBy === 'object') {
      return roomData.createdBy.name || 'Unknown';
    }
    
    const adminMember = members.find(m => m.email === roomData.createdBy);
    return adminMember ? adminMember.name : 'Unknown';
  };

  /* ================= CLOSE SIDEBAR ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showLeftSidebar && !e.target.closest('.quiz-room-members-sidebar')) {
        setShowLeftSidebar(false);
      }
      if (showRightSidebar && !e.target.closest('.quiz-room-chat-sidebar')) {
        setShowRightSidebar(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showLeftSidebar, showRightSidebar]);

  return (
    <div className="quiz-room-root quiz-room-container">
      {/* Notification Toast */}
      {notification && (
        <div className="quiz-room-notification-toast">
          <div className="quiz-room-notification-content">
            <CheckCircle size={16} />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="quiz-room-close-notification">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && roomData && (
        <div className="quiz-room-connection-banner">
          <div className="quiz-room-connection-warning">
            <AlertCircle size={16} />
            <span>Disconnected</span>
            <button onClick={reconnectSocket} className="quiz-room-reconnect-btn">
              <RefreshCw size={14} />
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="quiz-room-modal-overlay">
          <div className="quiz-room-modal-card">
            <div className="quiz-room-modal-header">
              <h2 className="quiz-room-modal-title">
                {roomAction === 'create' ? 'Create Quiz Room' : 'Join Quiz Room'}
              </h2>
              <div className="quiz-room-modal-subtitle">
                {roomAction === 'create' ? 'Start a new quiz session' : 'Join an existing room'}
              </div>
            </div>
            
            <form onSubmit={handleRoomSubmit} className="quiz-room-modal-form">
              <div className="quiz-room-form-group">
                <label>
                  <User size={14} />
                  Your Name *
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="quiz-room-form-group">
                <label>
                  <Mail size={14} />
                  Email *
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="quiz-room-form-group">
                <label>
                  <Settings size={14} />
                  Action
                </label>
                <div className="quiz-room-action-buttons">
                  <button
                    type="button"
                    className={`quiz-room-action-btn ${roomAction === 'create' ? 'quiz-room-action-active' : ''}`}
                    onClick={() => setRoomAction('create')}
                    disabled={isLoading}
                  >
                    <PlusCircle size={14} />
                    Create Room
                  </button>
                  <button
                    type="button"
                    className={`quiz-room-action-btn ${roomAction === 'join' ? 'quiz-room-action-active' : ''}`}
                    onClick={() => setRoomAction('join')}
                    disabled={isLoading}
                  >
                    <DoorOpen size={14} />
                    Join Room
                  </button>
                </div>
              </div>
              
              {roomAction === 'create' ? (
                <div className="quiz-room-form-group">
                  <label>
                    <Hash size={14} />
                    Room Name *
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name"
                    required
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="quiz-room-form-group">
                  <label>
                    <Hash size={14} />
                    Room Code *
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength="6"
                    style={{ textTransform: 'uppercase' }}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              <div className="quiz-room-modal-actions">
                <button 
                  type="submit" 
                  className="quiz-room-btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Clock size={16} />
                      <span>{roomAction === 'create' ? 'Creating...' : 'Joining...'}</span>
                    </>
                  ) : (
                    <>
                      <Rocket size={16} />
                      <span>{roomAction === 'create' ? 'Create Room' : 'Join Room'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Room Interface */}
      {roomData && !showRoomModal && (
        <div className="quiz-room-interface">
          {/* Header */}
          <header className="quiz-room-header">
            <div className="quiz-room-info">
              <div className="quiz-room-title-section">
                <h1 className="quiz-room-name">
                  {roomData.name || `Room ${roomData.code}`}
                </h1>
                <div className={`quiz-room-connection-status ${isConnected ? 'quiz-room-connected' : 'quiz-room-disconnected'}`}>
                  <div className="quiz-room-status-dot"></div>
                  <span>{isConnected ? 'Live' : 'Offline'}</span>
                </div>
              </div>
              
              <div className="quiz-room-code-container">
                <div className="quiz-room-code-display" onClick={copyRoomCode} title="Copy room code">
                  <span className="quiz-room-code-label">Room Code:</span>
                  <code className="quiz-room-code">{roomData.code}</code>
                  <button className="quiz-room-copy-btn">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="quiz-room-stats">
              <div className={`quiz-room-admin-badge ${isAdmin ? 'quiz-room-is-admin' : ''}`}>
                <Crown size={14} />
                <span>{isAdmin ? 'You are Admin' : `Admin: ${getAdminName()}`}</span>
              </div>
              
              <div className="quiz-room-stats-container">
                <div className="quiz-room-stat-item">
                  <Users size={14} />
                  <span>{onlineCount}</span>
                </div>
                <div className="quiz-room-stat-item">
                  <Trophy size={14} />
                  <span>{getUserScore()}</span>
                </div>
                <button onClick={refreshMembers} className="quiz-room-refresh-btn" title="Refresh" disabled={!isConnected}>
                  <RefreshCw size={14} />
                </button>
                <button onClick={toggleFullscreen} className="quiz-room-fullscreen-btn" title="Fullscreen">
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                {/* Left sidebar toggle for members */}
                <button 
                  onClick={() => setShowLeftSidebar(!showLeftSidebar)} 
                  className="quiz-room-sidebar-toggle"
                  data-sidebar="Members"
                  title="Members"
                >
                  <Users size={14} />
                </button>
                {/* Right sidebar toggle for chat */}
                <button 
                  onClick={() => setShowRightSidebar(!showRightSidebar)} 
                  className="quiz-room-sidebar-toggle"
                  data-sidebar="Chat"
                  title="Chat"
                >
                  <MessageCircle size={14} />
                </button>
                <button onClick={leaveRoom} className="quiz-room-leave-btn-header" title="Leave room">
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </header>

          {/* Left Sidebar - Members & Leaderboard */}
          <aside className={`quiz-room-members-sidebar ${showLeftSidebar ? 'quiz-room-sidebar-show' : ''}`}>
            <div className="quiz-room-sidebar-section">
              <div className="quiz-room-sidebar-header">
                <h3 className="quiz-room-sidebar-title">
                  <Users size={16} />
                  Members ({members.length})
                </h3>
                <div className="quiz-room-online-indicator">
                  <div className={`quiz-room-online-dot ${isConnected ? 'quiz-room-dot-active' : ''}`}></div>
                  <span>{onlineCount} online</span>
                </div>
              </div>
              
              <div className="quiz-room-members-list">
                {members.map((member, index) => (
                  <div key={index} className="quiz-room-member-item">
                    <div className="quiz-room-member-avatar">
                      {getUserInitials(member.name)}
                      {member.isAdmin && (
                        <span className="quiz-room-admin-indicator" title="Admin">
                          <Crown size={10} />
                        </span>
                      )}
                    </div>
                    <div className="quiz-room-member-info">
                      <div className="quiz-room-member-name">
                        {member.name || 'Unknown'}
                        {member.email === userEmail && <span className="quiz-room-you-tag"> (You)</span>}
                      </div>
                      <div className="quiz-room-member-email">{member.email || 'No email'}</div>
                    </div>
                    <div className="quiz-room-member-score">
                      <Star size={12} />
                      <span>{scores.find(s => s.email === member.email)?.score || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            {scores.length > 0 && (
              <div className="quiz-room-sidebar-section">
                <h4 className="quiz-room-leaderboard-title">
                  <Trophy size={16} />
                  Top Scores
                </h4>
                <div className="quiz-room-leaderboard-list">
                  {getLeaderboard().map((score, index) => (
                    <div key={index} className="quiz-room-leaderboard-item">
                      <div className="quiz-room-leaderboard-rank">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </div>
                      <div className="quiz-room-leaderboard-name">
                        {members.find(m => m.email === score.email)?.name || 'Anonymous'}
                      </div>
                      <div className="quiz-room-leaderboard-score">
                        <Award size={12} />
                        <span>{score.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Right Sidebar - Chat */}
          <aside className={`quiz-room-chat-sidebar ${showRightSidebar ? 'quiz-room-sidebar-show' : ''}`}>
            <div className="quiz-room-sidebar-section">
              <h4 className="quiz-room-chat-title">
                <MessageCircle size={16} />
                Chat
              </h4>
              <div className="quiz-room-chat-messages" ref={chatContainerRef}>
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`quiz-room-chat-message ${msg.sender === userName ? 'quiz-room-message-self' : ''}`}>
                    <div className="quiz-room-chat-sender">
                      <strong>{msg.sender}</strong>
                    </div>
                    <div className="quiz-room-chat-text">{msg.text}</div>
                    <div className="quiz-room-chat-time">
                      {msg.time ? new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="quiz-room-chat-input">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Type a message..."
                  disabled={!isConnected}
                />
                <button onClick={handleSendChat} disabled={!chatMessage.trim() || !isConnected}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="quiz-room-main-content">
            {/* Active Question */}
            {activeQuestion ? (
              <div className="quiz-room-active-question-card">
                <div className="quiz-room-question-header">
                  <h3 className="quiz-room-question-title">
                    Active Question
                    {activeQuestion.senderEmail === userEmail && (
                      <span className="quiz-room-your-question-badge">Your Question</span>
                    )}
                  </h3>
                  <div className="quiz-room-question-meta">
                    <span className="quiz-room-question-sender">
                      From: {activeQuestion.senderName || 'Unknown'}
                    </span>
                    <div className="quiz-room-timer-display">
                      <Timer size={14} />
                      <span className={`quiz-room-timer ${timer < 10 ? 'quiz-room-timer-warning' : ''}`}>
                        {formatTime(timer)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="quiz-room-question-text">
                  {activeQuestion.text}
                </div>
                
                {/* Answer Feedback (if available) */}
                {answerFeedback && (
                  <div className={`quiz-room-answer-feedback ${answerFeedback.isCorrect ? 'quiz-room-feedback-correct' : 'quiz-room-feedback-incorrect'}`}>
                    <div className="quiz-room-feedback-header">
                      {answerFeedback.isCorrect ? (
                        <>
                          <CheckCircle size={20} />
                          <strong>Correct Answer! +{answerFeedback.points} points 🎉</strong>
                        </>
                      ) : (
                        <>
                          <XCircle size={20} />
                          <strong>Incorrect</strong>
                        </>
                      )}
                    </div>
                    <div className="quiz-room-feedback-details">
                      <div>Your answer: <strong>{answerFeedback.yourAnswer}</strong></div>
                      <div>Correct answer: <strong>{answerFeedback.correctAnswer}</strong></div>
                      <div>Your total score: <strong>{answerFeedback.totalScore} points</strong></div>
                    </div>
                  </div>
                )}
                
                <div className="quiz-room-options-grid">
                  {activeQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      className={`quiz-room-option-btn ${userAnswer === option ? 'quiz-room-option-selected' : ''} ${showAnswer && option === correctAnswer ? 'quiz-room-option-correct' : ''} ${showAnswer && userAnswer === option && option !== correctAnswer ? 'quiz-room-option-wrong' : ''}`}
                      onClick={() => {
                        if (!showAnswer && !hasAnswered) {
                          setUserAnswer(option);
                        }
                      }}
                      disabled={showAnswer || !isConnected || hasAnswered}
                    >
                      <span className="quiz-room-option-letter">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="quiz-room-option-text">{option}</span>
                      {showAnswer && option === correctAnswer && (
                        <span className="quiz-room-correct-indicator"><Check size={16} /></span>
                      )}
                      {showAnswer && userAnswer === option && option !== correctAnswer && (
                        <span className="quiz-room-wrong-indicator"><XCircle size={16} /></span>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="quiz-room-question-actions">
                  {!showAnswer && !hasAnswered && userAnswer && activeQuestion.senderEmail !== userEmail && (
                    <button
                      onClick={handleSubmitAnswer}
                      className="quiz-room-btn-primary quiz-room-submit-btn"
                      disabled={!isConnected}
                    >
                      <Send size={16} />
                      Submit Answer
                    </button>
                  )}
                  
                  {hasAnswered && !showAnswer && (
                    <div className="quiz-room-waiting-feedback">
                      <Brain size={20} />
                      <span>Answer submitted! Waiting for results...</span>
                    </div>
                  )}
                  
                  {(activeQuestion.senderEmail === userEmail) && !showAnswer && (
                    <button
                      onClick={revealAnswer}
                      className="quiz-room-btn-primary quiz-room-reveal-btn"
                      disabled={!isConnected}
                    >
                      <Eye size={16} />
                      Reveal Answer
                    </button>
                  )}
                  
                  {showAnswer && (
                    <div className="quiz-room-correct-answer-reveal">
                      <CheckCircle size={16} />
                      <span>Correct Answer: <strong>{correctAnswer}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="quiz-room-no-active-question">
                <div className="quiz-room-empty-state">
                  <MessageCircle size={48} className="quiz-room-empty-icon" />
                  <h3>No active question</h3>
                  <p>Wait for someone to send a question or create one below!</p>
                  {!isConnected && (
                    <p className="quiz-room-connection-warning-text">
                      <AlertCircle size={14} />
                      Waiting for connection...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Send Question */}
            <div className="quiz-room-send-question-card">
              <h3 className="quiz-room-section-title">
                <PlusCircle size={18} />
                Send a Question
              </h3>
              
              <div className="quiz-room-question-form">
                <div className="quiz-room-form-group">
                  <label>Question *</label>
                  <textarea
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Enter your question here..."
                    rows="3"
                    disabled={!isConnected}
                  />
                </div>
                
                <div className="quiz-room-form-group">
                  <label>Options (separate with ,, ) *</label>
                  <input
                    type="text"
                    value={optionsInput}
                    onChange={(e) => setOptionsInput(e.target.value)}
                    placeholder="Option 1,, Option 2,, Option 3,, Option 4"
                    disabled={!isConnected}
                  />
                  <small className="quiz-room-input-hint">Use double commas (,,) to separate (2-6 options)</small>
                </div>
                
                <div className="quiz-room-form-row">
                  <div className="quiz-room-form-group">
                    <label>Correct Option</label>
                    <div className="quiz-room-correct-options">
                      {optionsInput.split(',,').map((opt, index) => (
                        opt.trim() && (
                          <button
                            key={index}
                            className={`quiz-room-correct-option-btn ${correctOptionIndex === index ? 'quiz-room-correct-option-selected' : ''}`}
                            onClick={() => setCorrectOptionIndex(index)}
                            disabled={!isConnected}
                          >
                            {String.fromCharCode(65 + index)}: {opt.trim()}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                  
                  <div className="quiz-room-form-group">
                    <label>Time Limit</label>
                    <select 
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      disabled={!isConnected}
                    >
                      <option value="15">15 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="45">45 seconds</option>
                      <option value="60">60 seconds</option>
                      <option value="90">90 seconds</option>
                      <option value="120">120 seconds</option>
                    </select>
                  </div>
                </div>
                
                <div className="quiz-room-form-actions">
                  <button
                    onClick={handleSubmitQuestion}
                    className="quiz-room-btn-primary quiz-room-send-btn"
                    disabled={!questionInput.trim() || !optionsInput.trim() || !isConnected}
                  >
                    <Send size={16} />
                    Send Question
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default QuizRoom;