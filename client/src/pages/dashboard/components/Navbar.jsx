import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  ClipboardCheck, 
  Users, 
  Settings,
  Brain,
  LogOut,
  User,
  Trophy
} from 'lucide-react';
import '../styles/navbar.css';
import { useAppState } from '../../../hooks/useAppState';

const Navbar = () => {
      const {user} = useAppState()
  
  const navItems = [
    { path: '/u', label: 'Dashboard', icon: Home },
    { path: '/u/profile', label: 'Profile', icon: User },
    { path: '/u/tests', label: 'Tests', icon: FileText },
    { path: '/u/attempts', label: 'Attempts', icon: ClipboardCheck },
    { path: '/u/room', label: 'Play', icon: Users },
    { path: '/u/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    console.log('Logging out...');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <div className="navbar-brand">
          <div className="logo-icon">
            <Brain size={20} />
          </div>
          <h1 className="logo-text">QuizMaster</h1>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/u'}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Profile & Logout */}
        <div className="navbar-right">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-status">Online</span>
          </div>
          
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;