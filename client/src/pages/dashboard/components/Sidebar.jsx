import { NavLink } from 'react-router-dom';
import { 
  Home, 
  User, 
  FileText, 
  ClipboardCheck, 
  Users, 
  Settings,
  LogOut,
  Brain,
  Trophy,
  Target,
  Crown
} from 'lucide-react';
import '../styles/sidebar.css';
import { useAppState } from '../../../hooks/useAppState';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAppState();
  
  const navItems = [
    { path: '/u', label: 'Dashboard', icon: Home },
    { path: '/u/profile', label: 'Profile', icon: User },
    { path: '/u/tests', label: 'Tests', icon: FileText },
    { path: '/u/attempts', label: 'Attempts', icon: ClipboardCheck },
    { path: '/u/room', label: 'Play', icon: Users },
    { path: '/u/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    onClose();
    // Add logout logic here
    console.log('Logging out...');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="logo-icon">
              <Brain size={22} />
            </div>
            <h2 className="logo-text">QuizMaster</h2>
          </div>
          
          <button 
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile */}
        <div className="sidebar-user">
          <div className="user-avatar-large">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user?.name || 'User'} />
            ) : (
              <div className="avatar-fallback">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="user-info">
            <h3 className="user-name">
              {user?.name || 'User Name'}
            </h3>
            <p className="user-email">
              {user?.email || 'user@example.com'}
            </p>
            <span className="user-badge">
              <Crown size={12} />
              Premium User
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/u'}
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={onClose}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with Stats and Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-stats">
            <div className="stat">
              <div className="stat-icon points">
                <Trophy size={16} />
              </div>
              <div className="stat-content">
                <span className="stat-value">245</span>
                <span className="stat-label">Points</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon streak">
                <Target size={16} />
              </div>
              <div className="stat-content">
                <span className="stat-value">12</span>
                <span className="stat-label">Day Streak</span>
              </div>
            </div>
          </div>
          
          <button 
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;