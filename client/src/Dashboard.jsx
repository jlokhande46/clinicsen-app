import { useState } from 'react';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('patients');
  const [showAddForm, setShowAddForm] = useState(false);

  // Temporary State to store patients (since DB is down)
  const [patients, setPatients] = useState([]);
  
  // Form State
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', age: '', gender: 'Male' });

  const handleAddPatient = (e) => {
    e.preventDefault();
    // Add to local list for now
    const patient = { ...newPatient, id: Date.now() }; // Fake ID
    setPatients([...patients, patient]);
    setShowAddForm(false);
    setNewPatient({ name: '', phone: '', age: '', gender: 'Male' }); // Reset form
    alert("Patient Added Locally!");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f4f7f6' }}>
      
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#fff', borderRight: '1px solid #ddd', padding: '20px' }}>
        <h3 style={{ color: '#007bff', marginTop: 0 }}>ClinicManager</h3>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          User: <strong>{user.username}</strong> <br/>
          Role: <strong>{user.role}</strong>
        </p>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' }}>
          <button onClick={() => setActiveTab('patients')} style={navStyle(activeTab === 'patients')}>
            👥 Patients
          </button>
          
          {user.role === 'DOCTOR' && (
            <>
              <button onClick={() => setActiveTab('prescriptions')} style={navStyle(activeTab === 'prescriptions')}>
                💊 Prescriptions
              </button>
            </>
          )}

          <button onClick={onLogout} style={{ ...navStyle(false), marginTop: 'auto', color: 'red' }}>
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* PATIENTS TAB */}
        {activeTab === 'patients' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h1>Patient Management</h1>
                {!showAddForm && (
                    <button onClick={() => setShowAddForm(true)} style={btnStyle}>+ Add New Patient</button>
                )}
            </div>

            {/* ADD PATIENT FORM */}
            {showAddForm && (
                <div style={cardStyle}>
                    <h3>New Patient Details</h3>
                    <form onSubmit={handleAddPatient} style={{display:'grid', gap:'10px'}}>
                        <input 
                            placeholder="Full Name" 
                            value={newPatient.name} 
                            onChange={e => setNewPatient({...newPatient, name: e.target.value})} 
                            style={inputStyle} required 
                        />
                        <input 
                            placeholder="Phone Number" 
                            value={newPatient.phone} 
                            onChange={e => setNewPatient({...newPatient, phone: e.target.value})} 
                            style={inputStyle} required 
                        />
                        <div style={{display:'flex', gap:'10px'}}>
                            <input 
                                placeholder="Age" 
                                type="number"
                                value={newPatient.age} 
                                onChange={e => setNewPatient({...newPatient, age: e.target.value})} 
                                style={inputStyle} required 
                            />
                            <select 
                                value={newPatient.gender}
                                onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
                                style={inputStyle}
                            >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div style={{marginTop:'10px'}}>
                            <button type="submit" style={btnStyle}>Save Patient</button>
                            <button type="button" onClick={() => setShowAddForm(false)} style={{...btnStyle, background:'#6c757d', marginLeft:'10px'}}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* PATIENT LIST */}
            <div style={{ marginTop: '20px' }}>
                {patients.length === 0 ? (
                    <p>No patients found.</p>
                ) : (
                    patients.map(p => (
                        <div key={p.id} style={{...cardStyle, marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
                            <div>
                                <strong>{p.name}</strong> <br/>
                                <span style={{fontSize:'0.85rem', color:'#666'}}>{p.gender}, {p.age} yrs</span>
                            </div>
                            <div>
                                <span style={{color:'#007bff'}}>{p.phone}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// STYLES
const navStyle = (isActive) => ({
  padding: '12px', textAlign: 'left', background: isActive ? '#e6f2ff' : 'transparent',
  color: isActive ? '#007bff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal'
});
const btnStyle = { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const inputStyle = { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', width: '100%', boxSizing:'border-box' };

export default Dashboard;