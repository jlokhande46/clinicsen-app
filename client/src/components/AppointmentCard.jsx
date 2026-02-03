import { useState, useEffect, useRef } from 'react';

const Icons = {
  Print: '🖨️',
  Share: '🔗',
  Time: '⏰'
  // Trash removed completely
};

const AppointmentCard = ({ appointment, visitNumber, patient, onSaveRecord, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [activeForm, setActiveForm] = useState(null); 
  const menuRef = useRef(null);

  // --- FORM STATES ---
  const [vitalsData, setVitalsData] = useState({ 
    weight_kg: '', bp_systolic: '', bp_diastolic: '', pulse_bpm: '', temperature_c: '', resp_rate_per_min: '' 
  });
  
  const [notesData, setNotesData] = useState({ 
    complaints: '', observations: '', diagnoses: '', notes: '' 
  });
  
  const [rxList, setRxList] = useState([]);
  const [currentRx, setCurrentRx] = useState({ 
    drug_name: '', 
    dosage_count: '1', dosage_type: 'Tablet',  
    frequency: '1-0-1', 
    duration_count: '5', duration_type: 'Days', 
    instructions: 'After Food' 
  });

  // Check Existence
  const hasVitals = appointment.vitals && appointment.vitals.length > 0;
  const hasNotes = appointment.clinical_notes && appointment.clinical_notes.length > 0;
  const hasRx = appointment.prescriptions && appointment.prescriptions.length > 0;
  
  // Safe Delete Check (Only if empty)
  const isEmptyVisit = !hasVitals && !hasNotes && !hasRx;

  const visitLabel = visitNumber === 1 ? "First Consultation" : `Follow-up Visit #${visitNumber}`;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // --- HANDLERS ---
  const handleAddDrugToList = () => {
    if (!currentRx.drug_name) return alert("Please enter a drug name");
    
    const formattedDosage = `${currentRx.dosage_count} ${currentRx.dosage_type}`;
    const formattedDuration = `${currentRx.duration_count} ${currentRx.duration_type}`;

    setRxList([...rxList, {
      drug_name: currentRx.drug_name,
      dosage: formattedDosage,
      frequency: currentRx.frequency,
      duration: formattedDuration,
      instructions: currentRx.instructions
    }]);
    
    setCurrentRx({ 
      drug_name: '', dosage_count: '1', dosage_type: 'Tablet', 
      frequency: '1-0-1', duration_count: '5', duration_type: 'Days', 
      instructions: 'After Food' 
    });
  };

  const removeDrugFromList = (index) => {
    const newList = [...rxList];
    newList.splice(index, 1);
    setRxList(newList);
  };

  const handleSave = (type) => {
    let payload = {};

    if(type === 'vitals') {
      payload = Object.fromEntries(Object.entries(vitalsData).map(([k, v]) => [k, v === '' ? null : v]));
    }
    
    if(type === 'notes') payload = notesData;
    
    if(type === 'rx') {
      let finalRxList = [...rxList];
      if (currentRx.drug_name.trim() !== "") {
        const formattedDosage = `${currentRx.dosage_count} ${currentRx.dosage_type}`;
        const formattedDuration = `${currentRx.duration_count} ${currentRx.duration_type}`;
        finalRxList.push({
          drug_name: currentRx.drug_name,
          dosage: formattedDosage,
          frequency: currentRx.frequency,
          duration: formattedDuration,
          instructions: currentRx.instructions
        });
      }

      if (finalRxList.length === 0) return alert("Please enter at least one drug.");
      payload = finalRxList;
    }

    onSaveRecord(type, appointment.id, payload);
    setActiveForm(null);
    setShowMenu(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Prescription - ${patient?.full_name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 3px solid #fb9c0c; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .clinic-logo { font-size: 28px; font-weight: 800; color: #283593; letter-spacing: -1px; }
            .clinic-meta { font-size: 12px; color: #666; text-align: right; line-height: 1.4; }
            .doc-section { margin-bottom: 30px; }
            .doc-name { font-size: 18px; font-weight: bold; color: #333; }
            .doc-deg { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
            .patient-strip { background: #f8f9fa; border: 1px solid #eee; border-radius: 6px; padding: 15px; display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 30px; }
            .p-label { color: #888; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
            .p-val { font-weight: 600; color: #000; }
            .section-header { font-size: 14px; font-weight: 700; color: #fb9c0c; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; margin-top: 25px; }
            .vitals-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
            .vital-box { text-align: center; border: 1px solid #eee; padding: 10px; border-radius: 4px; }
            .rx-table { width: 100%; border-collapse: collapse; font-size: 13px; }
            .rx-table th { text-align: left; background: #f1f5f9; padding: 8px; font-weight: 600; color: #444; }
            .rx-table td { padding: 10px 8px; border-bottom: 1px solid #f1f1f1; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { body { -webkit-print-color-adjust: exact; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-logo">🏥 Clinicsen</div>
            <div class="clinic-meta">Date: ${new Date(appointment.appointment_date).toLocaleDateString()}<br/>Visit ID: #${visitNumber}</div>
          </div>
          <div class="doc-section"><div class="doc-name">Dr. ${appointment.doctor_name || 'Doctor'}</div><div class="doc-deg">General Physician • MBBS, MD</div></div>
          <div class="patient-strip">
            <div><div class="p-label">Patient Name</div><div class="p-val">${patient?.full_name}</div></div>
            <div><div class="p-label">Age / Gender</div><div class="p-val">${patient?.age} Yrs / ${patient?.gender}</div></div>
            <div><div class="p-label">Phone</div><div class="p-val">${patient?.phone_number}</div></div>
             <div><div class="p-label">ID</div><div class="p-val">${patient?.id?.slice(0,6)}</div></div>
          </div>
          ${hasVitals ? `<div class="section-header">Vital Signs</div><div class="vitals-grid">
               <div class="vital-box"><div class="p-label">BP</div><div class="p-val">${appointment.vitals[0].bp_systolic}/${appointment.vitals[0].bp_diastolic}</div></div>
               <div class="vital-box"><div class="p-label">Pulse</div><div class="p-val">${appointment.vitals[0].pulse_bpm}</div></div>
               <div class="vital-box"><div class="p-label">Weight</div><div class="p-val">${appointment.vitals[0].weight_kg} kg</div></div>
               <div class="vital-box"><div class="p-label">Temp</div><div class="p-val">${appointment.vitals[0].temperature_c} °C</div></div>
               <div class="vital-box"><div class="p-label">Resp</div><div class="p-val">${appointment.vitals[0].resp_rate_per_min}</div></div>
            </div>` : ''}
          ${hasNotes ? `<div class="section-header">Clinical Notes</div><div style="font-size: 14px; line-height: 1.6;">
               ${appointment.clinical_notes[0].complaints ? `<div><strong>Complaints:</strong> ${appointment.clinical_notes[0].complaints}</div>` : ''}
               ${appointment.clinical_notes[0].diagnoses ? `<div><strong>Diagnosis:</strong> ${appointment.clinical_notes[0].diagnoses}</div>` : ''}
               ${appointment.clinical_notes[0].observations ? `<div><strong>Observations:</strong> ${appointment.clinical_notes[0].observations}</div>` : ''}
             </div>` : ''}
          ${hasRx ? `<div class="section-header">Prescription (Rx)</div><table class="rx-table"><thead><tr><th>Medicine Name</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>
                ${appointment.prescriptions.map(p => `<tr><td style="font-weight:bold; color:#283593">${p.drug_name}</td><td>${p.dosage}</td><td>${p.frequency}</td><td>${p.duration}</td><td>${p.instructions}</td></tr>`).join('')}
              </tbody></table>` : ''}
          <div class="footer"><p>This is a computer generated prescription. No signature required.</p><p>Generated by Clinicsen • ${new Date().toLocaleString()}</p></div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="appt-card">
      <div className="appt-header">
        <div className="appt-meta">
          <div className="doctor-icon" style={{background: visitNumber===1 ? '#2563eb':'#689f38'}}>
            {visitNumber}
          </div>
          <div className="appt-info">
             <h4>{visitLabel}</h4>
             <span>{new Date(appointment.appointment_date).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="appt-actions">
           
           <span className="action-icon" title="Print Prescription" onClick={handlePrint}>{Icons.Print}</span>
           
           <div style={{position:'relative'}} ref={menuRef}>
             <button className="btn-add-record" onClick={() => setShowMenu(!showMenu)}>Add Records ▼</button>
             {showMenu && (
               <div className="record-dropdown">
                 <button className="dropdown-item" disabled={hasVitals} onClick={()=>{setActiveForm('vitals'); setShowMenu(false)}}>Vital Signs {hasVitals && '✓'}</button>
                 <button className="dropdown-item" disabled={hasNotes} onClick={()=>{setActiveForm('notes'); setShowMenu(false)}}>Clinical Notes {hasNotes && '✓'}</button>
                 <button className="dropdown-item" disabled={hasRx} onClick={()=>{setActiveForm('rx'); setShowMenu(false)}}>Prescriptions {hasRx && '✓'}</button>
               </div>
             )}
           </div>

           {/* === DELETE 'X' (PLACED AFTER ADD RECORDS) === */}
           {isEmptyVisit && (
             <div 
               className="btn-action-delete" 
               onClick={() => onDelete(appointment.id)} 
               title="Cancel Empty Visit"
               style={{marginLeft: '15px'}} // Spacing from dropdown
             >
               ×
             </div>
           )}

        </div>
      </div>

      <div className="appt-body">
        {hasVitals && (
          <div className="section-container">
            <div className="section-title">Vital Signs</div>
            <div className="vitals-display-row">
               <div className="vital-item"><span className="vital-label">BP</span><span className="vital-value">{appointment.vitals[0].bp_systolic}/{appointment.vitals[0].bp_diastolic} mmHg</span></div>
               <div className="vital-item"><span className="vital-label">Pulse</span><span className="vital-value">{appointment.vitals[0].pulse_bpm} bpm</span></div>
               <div className="vital-item"><span className="vital-label">Weight</span><span className="vital-value">{appointment.vitals[0].weight_kg} kg</span></div>
               <div className="vital-item"><span className="vital-label">Temp</span><span className="vital-value">{appointment.vitals[0].temperature_c} °C</span></div>
               <div className="vital-item"><span className="vital-label">Resp</span><span className="vital-value">{appointment.vitals[0].resp_rate_per_min} /min</span></div>
            </div>
          </div>
        )}

        {hasNotes && (
           <div className="section-container">
             <div className="section-title">Clinical Notes</div>
             <div style={{fontSize:'0.9rem', display:'flex', flexDirection:'column', gap:'8px'}}>
               <div><span style={{color:'#555', fontWeight:'600'}}>Complaints: </span> {appointment.clinical_notes[0].complaints}</div>
               {appointment.clinical_notes[0].observations && <div><span style={{color:'#555', fontWeight:'600'}}>Observations: </span> {appointment.clinical_notes[0].observations}</div>}
               <div><span style={{color:'#555', fontWeight:'600'}}>Diagnosis: </span> {appointment.clinical_notes[0].diagnoses}</div>
             </div>
           </div>
        )}

        {hasRx && (
          <div className="section-container">
            <div className="section-title">Prescriptions</div>
            <table className="rx-table">
              <thead><tr><th>Drug Name</th><th>Dosage</th><th>Frequency</th><th>Intake</th><th>Duration</th></tr></thead>
              <tbody>
                {appointment.prescriptions.map((p, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:'600', color:'#2563eb'}}>{p.drug_name}</td>
                    <td>{p.dosage}</td>
                    <td>{p.frequency}</td>
                    <td>{p.instructions}</td>
                    <td>{p.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- FORMS --- */}
      {activeForm === 'vitals' && (
        <div className="chart-form-box">
           <div className="cyan-banner"><span>Add Vitals</span><span style={{cursor:'pointer'}} onClick={()=>setActiveForm(null)}>✖</span></div>
           <div className="form-content">
              <div className="vitals-grid-container">
                 <div className="vital-input-group"><label>BP (Systolic)</label><input type="number" placeholder="120" value={vitalsData.bp_systolic} onChange={e=>setVitalsData({...vitalsData, bp_systolic:e.target.value})} /></div>
                 <div className="vital-input-group"><label>BP (Diastolic)</label><input type="number" placeholder="80" value={vitalsData.bp_diastolic} onChange={e=>setVitalsData({...vitalsData, bp_diastolic:e.target.value})} /></div>
                 <div className="vital-input-group"><label>Pulse</label><input type="number" placeholder="72" value={vitalsData.pulse_bpm} onChange={e=>setVitalsData({...vitalsData, pulse_bpm:e.target.value})} /></div>
                 <div className="vital-input-group"><label>Weight</label><input type="number" placeholder="0" value={vitalsData.weight_kg} onChange={e=>setVitalsData({...vitalsData, weight_kg:e.target.value})} /></div>
                 <div className="vital-input-group"><label>Temp</label><input type="number" placeholder="36.5" value={vitalsData.temperature_c} onChange={e=>setVitalsData({...vitalsData, temperature_c:e.target.value})} /></div>
                 <div className="vital-input-group"><label>Resp. Rate</label><input type="number" placeholder="18" value={vitalsData.resp_rate_per_min} onChange={e=>setVitalsData({...vitalsData, resp_rate_per_min:e.target.value})} /></div>
              </div>
           </div>
           <div className="form-footer"><button className="btn-cancel" onClick={()=>setActiveForm(null)}>Cancel</button><button className="btn-orange" onClick={() => handleSave('vitals')}>Save Vitals</button></div>
        </div>
      )}

      {activeForm === 'notes' && (
         <div className="chart-form-box">
            <div className="cyan-banner"><span>Clinical Notes</span><span style={{cursor:'pointer'}} onClick={()=>setActiveForm(null)}>✖</span></div>
            <div className="form-content notes-grid">
               <div><label className="practo-input-label">Complaints</label><textarea className="practo-textarea" rows="2" placeholder="e.g. Fever, Headache" value={notesData.complaints} onChange={e=>setNotesData({...notesData, complaints:e.target.value})} /></div>
               <div><label className="practo-input-label">Observations</label><textarea className="practo-textarea" rows="2" placeholder="e.g. Throat inflammation" value={notesData.observations} onChange={e=>setNotesData({...notesData, observations:e.target.value})} /></div>
               <div><label className="practo-input-label">Diagnosis</label><input className="practo-input wide" placeholder="e.g. Viral Pyrexia" value={notesData.diagnoses} onChange={e=>setNotesData({...notesData, diagnoses:e.target.value})} /></div>
               <div><label className="practo-input-label">Additional Notes</label><textarea className="practo-textarea" rows="1" placeholder="Private notes..." value={notesData.notes} onChange={e=>setNotesData({...notesData, notes:e.target.value})} /></div>
            </div>
            <div className="form-footer"><button className="btn-cancel" onClick={()=>setActiveForm(null)}>Cancel</button><button className="btn-orange" onClick={()=>handleSave('notes')}>Save Notes</button></div>
         </div>
      )}

      {activeForm === 'rx' && (
         <div className="chart-form-box">
            <div className="cyan-banner"><span>Add Prescriptions</span><span style={{cursor:'pointer'}} onClick={()=>setActiveForm(null)}>✖</span></div>
            <div className="form-content">
               <div style={{background:'#f9f9f9', padding:'15px', borderRadius:'4px', border:'1px solid #eee'}}>
                  <div style={{marginBottom:'10px'}}>
                     <label className="practo-input-label">Drug Name</label>
                     <input className="practo-input wide" placeholder="Search medicine..." value={currentRx.drug_name} onChange={e=>setCurrentRx({...currentRx, drug_name:e.target.value})} />
                  </div>
                  <div style={{display:'flex', gap:'15px', marginBottom:'10px'}}>
                     <div style={{flex:1.5}}>
                        <label className="practo-input-label">Dosage</label>
                        <div style={{display:'flex', gap:'5px'}}>
                           <input className="practo-input" style={{width:'60px'}} type="number" value={currentRx.dosage_count} onChange={e=>setCurrentRx({...currentRx, dosage_count:e.target.value})} />
                           <select className="practo-input" style={{flex:1}} value={currentRx.dosage_type} onChange={e=>setCurrentRx({...currentRx, dosage_type:e.target.value})}>
                              <option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option><option>Cream</option><option>Sachet</option><option>Drops</option>
                           </select>
                        </div>
                     </div>
                     <div style={{flex:1}}>
                        <label className="practo-input-label">Frequency</label>
                        <select className="practo-input wide" value={currentRx.frequency} onChange={e=>setCurrentRx({...currentRx, frequency:e.target.value})}>
                           <option>1-0-1</option><option>1-0-0</option><option>0-0-1</option><option>1-1-1</option><option>0-1-0</option>
                           <option>Once a day</option><option>Twice a day</option><option>Thrice a day</option><option>SOS (As needed)</option>
                        </select>
                     </div>
                  </div>
                  <div style={{display:'flex', gap:'15px'}}>
                     <div style={{flex:1.5}}>
                        <label className="practo-input-label">Duration</label>
                        <div style={{display:'flex', gap:'5px'}}>
                           <input className="practo-input" style={{width:'60px'}} type="number" value={currentRx.duration_count} onChange={e=>setCurrentRx({...currentRx, duration_count:e.target.value})} />
                           <select className="practo-input" style={{flex:1}} value={currentRx.duration_type} onChange={e=>setCurrentRx({...currentRx, duration_type:e.target.value})}>
                              <option>Days</option><option>Weeks</option><option>Months</option><option>Years</option>
                           </select>
                        </div>
                     </div>
                     <div style={{flex:1}}>
                        <label className="practo-input-label">Intake</label>
                        <select className="practo-input wide" value={currentRx.instructions} onChange={e=>setCurrentRx({...currentRx, instructions:e.target.value})}>
                           <option>After Food</option><option>Before Food</option><option>With Food</option><option>Empty Stomach</option>
                        </select>
                     </div>
                     <div style={{display:'flex', alignItems:'flex-end'}}>
                        <button className="btn-add-record" style={{height:'38px', padding:'0 20px'}} onClick={handleAddDrugToList}>+ Add</button>
                     </div>
                  </div>
               </div>

               {rxList.length > 0 && (
                 <div style={{marginTop:'15px'}}>
                    <div style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'5px', color:'#666'}}>MEDICINES TO SAVE:</div>
                    <table className="rx-table" style={{border:'1px solid #eee'}}>
                       <thead style={{background:'#fcfcfc'}}>
                          <tr><th>Drug</th><th>Dosage</th><th>Freq</th><th>Duration</th><th>Action</th></tr>
                       </thead>
                       <tbody>
                          {rxList.map((rx, idx) => (
                             <tr key={idx}>
                                <td>{rx.drug_name}</td>
                                <td>{rx.dosage}</td>
                                <td>{rx.frequency}</td>
                                <td>{rx.duration}</td>
                                <td><span style={{color:'red', cursor:'pointer'}} onClick={()=>removeDrugFromList(idx)}>Remove</span></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}

            </div>
            <div className="form-footer"><button className="btn-cancel" onClick={()=>setActiveForm(null)}>Cancel</button><button className="btn-orange" onClick={()=>handleSave('rx')}>Save Prescription</button></div>
         </div>
      )}
    </div>
  );
};

export default AppointmentCard;