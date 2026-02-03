require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
app.use(cors({
  origin: '*' // For now, allow all. Once live, you can restrict this to your Vercel URL.
}));

const app = express();
app.use(express.json());
app.use(cors());

// --- CONNECT TO DB ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- ROUTES ---

// 1. LOGIN
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  const { data: user, error } = await supabase.from('users').select('*').eq('username', username).eq('role', role).single();
  if (error || !user || password !== user.password_hash) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  res.json({ success: true, user });
});

// 2. GET ALL PATIENTS
app.get('/patients', async (req, res) => {
  const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 3. ADD NEW PATIENT
app.post('/patients', async (req, res) => {
  const { data, error } = await supabase.from('patients').insert([req.body]).select();
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, patient: data[0] });
});

// --- NEW EMR ROUTES (Fixes your 404 Errors) ---

// 4. CREATE APPOINTMENT (Start Visit)
app.post('/appointments', async (req, res) => {
  const { patient_id, doctor_name, appointment_date } = req.body;
  
  // Create a new appointment
  const { data, error } = await supabase
    .from('appointments')
    .insert([{ patient_id, doctor_name, appointment_date, status: 'Scheduled' }])
    .select()
    .single();

  if (error) {
    console.error("Error creating appointment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
  
  res.json({ success: true, appointment: data });
});

// 5. GET PATIENT HISTORY (The route causing your crash)
app.get('/patient-history/:id', async (req, res) => {
  const { id } = req.params;

  // Fetch all appointments for this patient, PLUS their vitals, notes, and prescriptions
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      vitals(*),
      clinical_notes(*),
      prescriptions(*)
    `)
    .eq('patient_id', id)
    .order('appointment_date', { ascending: false }); // Newest first

  if (error) {
    console.error("Error fetching history:", error);
    return res.status(500).json({ error: error.message });
  }
  
  res.json(data);
});

// 6. SAVE VITALS
app.post('/vitals', async (req, res) => {
  const { data, error } = await supabase.from('vitals').insert([req.body]).select();
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, data: data[0] });
});

// 7. SAVE NOTES
app.post('/clinical-notes', async (req, res) => {
  const { data, error } = await supabase.from('clinical_notes').insert([req.body]).select();
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, data: data[0] });
});

// 8. SAVE PRESCRIPTIONS (Handles Array)
app.post('/prescriptions', async (req, res) => {
  const { data, error } = await supabase.from('prescriptions').insert(req.body).select();
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, data });
});

// 9. GET TODAY'S APPOINTMENTS (Latest First + Unique)
app.get('/queue/today', async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      appointment_date,
      patients (*)
    `)
    .gte('appointment_date', todayStart.toISOString())
    .lte('appointment_date', todayEnd.toISOString())
    .order('appointment_date', { ascending: false }); // <--- CHANGED: Newest First

  if (error) return res.status(500).json({ error: error.message });

  // --- DEDUPLICATION LOGIC ---
  const uniquePatientsMap = new Map();

  data.forEach(item => {
    if (item.patients) {
      // Since we sorted by DESC, the first time we see a patient, 
      // it is guaranteed to be their LATEST appointment.
      if (!uniquePatientsMap.has(item.patients.id)) {
        uniquePatientsMap.set(item.patients.id, {
          ...item.patients,
          visit_time: item.appointment_date // Captures the latest time
        });
      }
    }
  });

  const uniquePatientList = Array.from(uniquePatientsMap.values());
  res.json(uniquePatientList);
});

// 10. DELETE APPOINTMENT (Only if empty)
app.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;

  // 1. Safety Check: Ensure no child records exist
  const { count: vCount } = await supabase.from('vitals').select('*', { count: 'exact', head: true }).eq('appointment_id', id);
  const { count: nCount } = await supabase.from('clinical_notes').select('*', { count: 'exact', head: true }).eq('appointment_id', id);
  const { count: pCount } = await supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('appointment_id', id);

  // If any data exists, BLOCK the delete
  if (vCount > 0 || nCount > 0 || pCount > 0) {
    return res.status(400).json({ success: false, message: "Cannot delete: This visit has medical records saved." });
  }

  // 2. Delete the appointment
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true });
});


// --- START SERVER ---
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));