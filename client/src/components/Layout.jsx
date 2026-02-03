import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <div className="layout-container">
      {/* 1. COLLAPSIBLE HOVER SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
           <span className="nav-icon">🏥</span> 
           <span>ClinicOS</span>
        </div>
        
        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
            <span className="nav-icon">👥</span> Patients
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <span className="nav-icon">⚙️</span> Settings
          </button>
        </nav>

        <div className="user-profile">
          <div className="avatar">{user?.username[0].toUpperCase()}</div>
          <div className="user-info">
            <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{user?.username}</div>
            <button onClick={logout} style={{background:'none', border:'none', color:'#fb9c0c', cursor:'pointer', padding:0, fontSize:'0.75rem'}}>Logout</button>
          </div>
        </div>
      </aside>

      {/* 2. PAGE CONTENT (Splits into 3 columns inside Patients.jsx) */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;