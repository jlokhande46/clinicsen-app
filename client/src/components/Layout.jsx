// client/src/components/Layout.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../pages/DashboardStyles.css'; // Ensure this matches your file path

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close menu automatically
  };

  return (
    <div className="layout-container">
      
      {/* 1. MOBILE HEADER (Only visible on small screens) */}
      <div className="mobile-top-bar">
        <div className="brand-mobile">🏥 ClinicSen</div>
        <button 
          className="hamburger-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* 2. SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
           <div className="brand-desktop">
             <span className="nav-icon">🏥</span> 
             <span>ClinicSen</span>
           </div>
        </div>
        
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`} 
            onClick={() => handleTabClick('patients')}
          >
            <span className="nav-icon">👥</span> Patients
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => handleTabClick('settings')}
          >
            <span className="nav-icon">⚙️</span> Settings
          </button>
        </nav>

        <div className="user-profile">
          <div className="avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-info">
            <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{user?.username}</div>
            <button onClick={logout} className="logout-link">Logout</button>
          </div>
        </div>
      </aside>

      {/* 3. MAIN CONTENT */}
      <main className="main-content">
        {children}
      </main>

      {/* Overlay for closing menu */}
      {isMobileMenuOpen && (
        <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </div>
  );
};

export default Layout;