import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AppointmentCard from '../components/AppointmentCard'; 
import './DashboardStyles.css';
import { API_URL } from '../config';

const Patients = () => {
  const { user } = useAuth();
  
  // Data State
  const [patients, setPatients] = useState([]); // The Queue List
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  
  // UI State
  const [showModal, setShowModal] = useState(false);
  const [activeQueue, setActiveQueue] = useState('recent'); // 'recent' or 'today'
  
  // Form Data State
  const [formData, setFormData] = useState({ 
    full_name: '', phone_number: '', age: '', gender: 'Male', email: '',           
    blood_group: '', address_street: '', address_city: '', medical_history: ''  
  });

  // 1. FETCH QUEUE (Depends on activeQueue tab)
  useEffect(() => {
    fetchQueueData();
  }, [activeQueue]); // Re-run when tab changes

  const fetchQueueData = async () => {
    let url = `${API_URL}/patients`; // Default: Recent (All sorted by created_at)
    
    if (activeQueue === 'today') {
      url = `${API_URL}/queue/today`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setPatients(data);
        // Auto-select first if list not empty
        if (data.length > 0 && !selectedPatient) setSelectedPatient(data[0]);
        // If today list is empty, clear selection
        if (data.length === 0) setSelectedPatient(null);
      }
    } catch(err) { console.error(err); }
  };

  // 2. Load History when Patient Selected
  useEffect(() => {
    if (selectedPatient) {
      fetchHistory(selectedPatient.id);
    } else {
      setHistory([]); // Clear history if no patient selected
    }
  }, [selectedPatient]);

  const fetchHistory = async (id) => {
    try {
      const res = await fetch(`${API_URL}/patient-history/${id}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) { console.error("Failed to load history", err); }
  };

  // --- START NEW VISIT ---
  const startNewVisit = async () => {
    if (!selectedPatient) return;
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          patient_id: selectedPatient.id, 
          doctor_name: user?.username || 'Doctor', 
          appointment_date: new Date() 
        })
      });
      if (!res.ok) throw new Error("Failed");
      
      const data = await res.json();
      if (data.success) {
        fetchHistory(selectedPatient.id); 
        // If we are on 'today' tab, refresh the queue too so this patient appears/stays there
        if(activeQueue === 'today') fetchQueueData();
      }
    } catch (err) { alert("Error starting visit"); }
  };

  // --- SAVE RECORD ---
  const handleSaveRecord = async (type, appointmentId, payload) => {
    let url = '';
    let body;

    if (type === 'vitals') {
      url = `${API_URL}/vitals`;
      body = { ...payload, appointment_id: appointmentId };
    } 
    else if (type === 'notes') {
      url = `${API_URL}/clinical-notes`;
      body = { ...payload, appointment_id: appointmentId };
    } 
    else if (type === 'rx') {
      url = `${API_URL}/prescriptions`;
      body = payload.map(drug => ({ ...drug, appointment_id: appointmentId }));
    }

    try {
      await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      fetchHistory(selectedPatient.id); 
    } catch(err) { alert("Failed to save record"); }
  };

  // --- SAVE NEW PATIENT ---
  const handleSavePatient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/patients`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData)
      });
      const data = await res.json();
      if(data.success) {
         // Switch to 'recent' tab to see the new patient
         setActiveQueue('recent');
         // Add to top of list manually to avoid refetch
         setPatients([data.patient, ...patients]);
         setSelectedPatient(data.patient);
         setShowModal(false);
         setFormData({ full_name: '', phone_number: '', age: '', gender: 'Male', email: '', blood_group: '', address_street: '', address_city: '', medical_history: '' });
      } else { alert("Error: " + data.message); }
    } catch(err) { alert("Server error."); }
  };

  // --- NEW: DELETE HANDLER ---
  const handleDeleteVisit = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this empty visit?")) return;

    try {
      const res = await fetch(`${API_URL}/appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        fetchHistory(selectedPatient.id); // Refresh list
        if (activeQueue === 'today') fetchQueueData(); // Refresh queue if needed
      } else {
        alert(data.message); // Show error if it wasn't empty
      }
    } catch (err) { alert("Error deleting visit"); }
  };

  return (
    <div className="dashboard-container">
      
      {/* 1. SIDEBAR (Queue) */}
      <div className="patient-queue">
         <div className="queue-header">
            <div className="search-wrapper">
               <span className="search-icon">🔍</span>
               <input className="search-input" placeholder="Search patients" />
            </div>
         </div>
         
         {/* TABS LOGIC */}
         <div className="queue-tabs">
            <button 
              className={`queue-tab ${activeQueue === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveQueue('recent')}
            >
              Recent
            </button>
            <button 
              className={`queue-tab ${activeQueue === 'today' ? 'active' : ''}`}
              onClick={() => setActiveQueue('today')}
            >
              Today
            </button>
         </div>

         {/* PATIENT LIST */}
         <div className="patient-list">
           {patients.length === 0 && (
             <div style={{padding:'20px', textAlign:'center', color:'#999', fontSize:'0.85rem'}}>
               {activeQueue === 'today' ? 'No appointments today.' : 'No patients found.'}
             </div>
           )}

           {patients.map(p => (
             <div 
               key={p.id} 
               className={`patient-card ${selectedPatient?.id === p.id ? 'active' : ''}`} 
               onClick={() => setSelectedPatient(p)}
             >
               <div className="p-name">{p.full_name}</div>
               <div className="p-meta">
                 {/* If showing Today's Queue, show Time. Else show Gender/Age */}
                 {activeQueue === 'today' && p.visit_time 
                    ? `🕒 ${new Date(p.visit_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                    : `${p.gender === 'Male'?'M':'F'} • ${p.age} Yrs`
                 }
               </div>
             </div>
           ))}
         </div>
         
         <div style={{padding:'10px', borderTop:'1px solid #eee'}}>
            <button className="btn-orange" style={{width:'100%'}} onClick={()=>setShowModal(true)}>+ Add Patient</button>
         </div>
      </div>

      {/* 2. MAIN CANVAS */}
      <div className="charting-area">
        {selectedPatient ? (
          <>
            <div className="patient-header">
               <div>
                 <div className="ph-name">{selectedPatient.full_name} <span style={{fontSize:'0.9rem', color:'#999'}}>(ID: {selectedPatient.id.slice(0,6)})</span></div>
                 <div className="ph-meta">+91 {selectedPatient.phone_number} • {selectedPatient.gender}, {selectedPatient.age} Years • {selectedPatient.blood_group || '-'}</div>
               </div>
               <button className="btn-cancel">Edit Profile</button>
            </div>
            
            <div style={{padding:'30px', background:'#fbfbfb', flex:1, overflowY:'auto'}}>
               
               <div style={{textAlign:'right', marginBottom:'20px'}}>
                  <button className="btn-orange" onClick={startNewVisit}>+ Start New Visit</button>
               </div>

               {history.length === 0 && <div style={{textAlign:'center', color:'#999', marginTop:'50px'}}>No visits found. Click "Start New Visit" to begin.</div>}
               
               {history.map((appt, index) => {
                 const visitNum = history.length - index;
                 return (
                   <AppointmentCard 
                      key={appt.id} 
                      appointment={appt} 
                      visitNumber={visitNum} 
                      patient={selectedPatient}
                      onSaveRecord={handleSaveRecord}
                      onDelete={handleDeleteVisit}
                   />
                 );
               })}
            </div>
          </>
        ) : (
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#aaa'}}>Select a patient from the queue</div>
        )}
      </div>

      {/* 3. WIDGETS */}
      <div style={{width:'240px', borderLeft:'1px solid #eee', background:'#fff', padding:'20px'}}>
         <div style={{fontSize:'0.8rem', fontWeight:'bold', color:'#999', marginBottom:'10px'}}>MEDICAL HISTORY</div>
         <div style={{fontSize:'0.85rem', color:'#2196f3', cursor:'pointer'}}>+ Click to Add</div>
      </div>

      {/* 4. MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="practo-modal">
            <div className="modal-header">New Patient Registration</div>
            
            <form onSubmit={handleSavePatient} className="modal-form-wrapper">
              <div className="modal-body">
                
                <div className="form-section-title">Patient Identity</div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Patient Name <span style={{color:'red'}}>*</span></label>
                    <input required placeholder="e.g. Rajesh Kumar" value={formData.full_name} onChange={e=>setFormData({...formData, full_name:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number <span style={{color:'red'}}>*</span></label>
                    <input required placeholder="10-digit number" value={formData.phone_number} onChange={e=>setFormData({...formData, phone_number:e.target.value})} />
                  </div>
                  <div className="form-group">
                     <label>Email</label>
                     <input placeholder="Optional" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
                  </div>
                  <div className="form-group">
                     <label>Gender</label>
                     <div className="radio-group">
                        <label className="radio-label"><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={e=>setFormData({...formData, gender:e.target.value})} /> Male</label>
                        <label className="radio-label"><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={e=>setFormData({...formData, gender:e.target.value})} /> Female</label>
                     </div>
                  </div>
                  <div className="form-group">
                     <label>Age</label>
                     <input type="number" placeholder="Years" style={{width:'100px'}} value={formData.age} onChange={e=>setFormData({...formData, age:e.target.value})} />
                  </div>
                </div>

                <div className="form-section-title">Medical Profile</div>
                <div className="form-grid">
                   <div className="form-group">
                     <label>Blood Group</label>
                     <select value={formData.blood_group} onChange={e=>setFormData({...formData, blood_group:e.target.value})}>
                       <option value="">Select</option><option value="O+">O+</option><option value="A+">A+</option><option value="B+">B+</option><option value="AB+">AB+</option>
                     </select>
                   </div>
                   <div className="form-group full-width">
                     <label>Existing Medical History / Allergies</label>
                     <textarea rows="2" placeholder="e.g. Diabetes, Penicillin Allergy..." value={formData.medical_history} onChange={e=>setFormData({...formData, medical_history:e.target.value})}></textarea>
                   </div>
                </div>

                <div className="form-section-title">Address & Contact</div>
                <div className="form-grid">
                   <div className="form-group full-width">
                     <label>Street Address</label>
                     <textarea rows="2" placeholder="Flat / House No / Building" value={formData.address_street} onChange={e=>setFormData({...formData, address_street:e.target.value})}></textarea>
                   </div>
                   <div className="form-group">
                     <label>City</label>
                     <input placeholder="City" value={formData.address_city} onChange={e=>setFormData({...formData, address_city:e.target.value})} />
                   </div>
                   <div className="form-group">
                     <label>Pincode</label>
                     <input placeholder="Pincode" />
                   </div>
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-orange">Save Patient Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Patients;