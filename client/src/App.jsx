import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Patients from './pages/Patients';
import { API_URL } from './config';
import './App.css'; 

// 1. The Logic Component (Handles Routing)
const AppContent = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('patients');

  // Login Form State
  const [role, setRole] = useState('DOCTOR'); // Default role
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.user);
      } else {
        alert(data.message);
      }
    } catch (err) { 
      console.error(err);
      alert("Server Error. Is the backend running?"); 
    }
  };

  // IF LOGGED IN: Show Dashboard
  if (user) {
    return (
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'patients' && <Patients />}
        {activeTab === 'settings' && <div style={{padding:'40px'}}><h2>⚙️ Settings Page</h2><p>Coming Soon...</p></div>}
      </Layout>
    );
  }

  // IF NOT LOGGED IN: Show Login Form
  return (
    <div className="login-container">
      <div style={{textAlign:'center', marginBottom:'30px'}}>
        <h1 style={{color:'#283593', margin:0}}>🏥 ClinicSen</h1>
        <p style={{color:'#666', marginTop:'5px'}}>Medical Practice Management</p>
      </div>
      
      <div className="role-toggle">
        <button type="button" className={`role-btn ${role === 'DOCTOR' ? 'active' : ''}`} onClick={() => setRole('DOCTOR')}>Doctor</button>
        <button type="button" className={`role-btn ${role === 'RECEPTIONIST' ? 'active' : ''}`} onClick={() => setRole('RECEPTIONIST')}>Receptionist</button>
      </div>

      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Username</label>
          <input 
            type="text" 
            placeholder="Enter ID" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            placeholder="Enter Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
        </div>

        <button 
          type="submit" 
          className="login-btn"
          style={{backgroundColor: role === 'DOCTOR' ? '#2563eb' : '#059669'}}
        >
          Login as {role === 'DOCTOR' ? 'Doctor' : 'Receptionist'}
        </button>
      </form>
    </div>
  );
};

// 2. The Main Export (Required by main.jsx)
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}