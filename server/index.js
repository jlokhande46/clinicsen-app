require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Declared only ONCE here
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8000;

// --- MIDDLEWARE ---
app.use(cors({
  origin: '*' // Allow your Vercel frontend to access this
}));
app.use(express.json());

// --- SUPABASE CLIENT ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// ============== ROUTES ====================
// ==========================================

// 0. REAL DATABASE LOGIN
app.post('/login', async (req, res) => {
  // 1. Get username and password from the Frontend
  const { username, password } = req.body;

  console.log("Login attempt for:", username); // Debugging log

  // 2. Query the 'users' table
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  // 3. Check if user exists
  if (error || !data) {
    console.log("User not found or error:", error);
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  // 4. Check Password (Matching 'password_hash' column)
  // NOTE: This checks if the password typed matches the string in your DB
  if (data.password_hash === password) {
    
    // LOGIN SUCCESS!
    return res.json({ 
      success: true, 
      user: { 
        username: data.username, 
        role: data.role // This will be 'DOCTOR' or 'RECEPTIONIST'
      } 
    });

  } else {
    // LOGIN FAILED
    return res.status(401).json({ success: false, message: 'Invalid Password' });
  }
});

// 1. GET ALL PATIENTS (Recent First)
app.get('/patients', async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 2. SEARCH PATIENTS
app.get('/patients/search', async (req, res) => {
  const { query } = req.query;
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .ilike('full_name', `%${query}%`);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 3. CREATE NEW PATIENT
app.post('/patients', async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .insert([req.body])
    .select();
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, patient: data[0] });
});

// 4. GET PATIENT HISTORY (Visits + Data)
app.get('/patient-history/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      vitals (*),
      clinical_notes (*),
      prescriptions (*)
    `)
    .eq('patient_id', id)
    .order('appointment_date', { ascending: false }); // Newest visit first

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 5. START NEW VISIT
app.post('/appointments', async (req, res) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([req.body])
    .select();
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, appointment: data[0] });
});

// 6. SAVE VITALS
app.post('/vitals', async (req, res) => {
  const { error } = await supabase.from('vitals').insert([req.body]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// 7. SAVE CLINICAL NOTES
app.post('/clinical-notes', async (req, res) => {
  const { error } = await supabase.from('clinical_notes').insert([req.body]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// 8. SAVE PRESCRIPTIONS (Handles Array of Drugs)
app.post('/prescriptions', async (req, res) => {
  const { error } = await supabase.from('prescriptions').insert(req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// 9. GET TODAY'S QUEUE (Deduplicated & Latest First)
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
    .order('appointment_date', { ascending: false }); // Newest First

  if (error) return res.status(500).json({ error: error.message });

  // Deduplication Logic
  const uniquePatientsMap = new Map();
  data.forEach(item => {
    if (item.patients) {
      if (!uniquePatientsMap.has(item.patients.id)) {
        uniquePatientsMap.set(item.patients.id, {
          ...item.patients,
          visit_time: item.appointment_date
        });
      }
    }
  });

  res.json(Array.from(uniquePatientsMap.values()));
});

// 10. DELETE APPOINTMENT (Safe Delete)
app.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;

  // Check for existing data first
  const { count: vCount } = await supabase.from('vitals').select('*', { count: 'exact', head: true }).eq('appointment_id', id);
  const { count: nCount } = await supabase.from('clinical_notes').select('*', { count: 'exact', head: true }).eq('appointment_id', id);
  const { count: pCount } = await supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('appointment_id', id);

  if (vCount > 0 || nCount > 0 || pCount > 0) {
    return res.status(400).json({ success: false, message: "Cannot delete: This visit contains medical records." });
  }

  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  
  res.json({ success: true });
});

// ==========================================
// ============== START SERVER ==============
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});