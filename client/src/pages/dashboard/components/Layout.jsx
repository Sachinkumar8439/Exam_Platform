import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ContentArea from './ContentArea';
import { Menu } from 'lucide-react';
import '../styles/dashboard.css'; // New CSS file

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    const checkMobile = () => window.innerWidth < 740;
    setIsMobile(checkMobile());
    
    const handleResize = () => {
      const mobile = checkMobile();
      setIsMobile(mobile);
      
      // Close sidebar when switching to desktop
      if (!mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile: Sidebar toggle button */}
      {isMobile && !isSidebarOpen && (
        <button 
          className="dashboard-sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="dashboard-sidebar-toggle-icon" />
        </button>
      )}
      
      {/* Desktop: Navbar */}
      {!isMobile && <Navbar/>}
      
      {/* Mobile: Sidebar with overlay */}
      {isMobile && (
        <>
          <div 
            className={`dashboard-sidebar-overlay ${
              isSidebarOpen ? 'dashboard-sidebar-overlay-active' : ''
            }`}
            onClick={closeSidebar}
          />
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={toggleSidebar} 
          />
        </>
      )}
      
      {/* Content Area - Always visible */}
      <div className="dashboard-content-wrapper">
        <ContentArea />
      </div>
    </div>
  );
};

export default Layout;