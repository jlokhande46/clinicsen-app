// server/setup-db.js
require('dotenv').config();
const { Client } = require('pg');

// Use the "Transaction" connection string (Port 6543) from your .env file
// It usually looks like: postgres://postgres:[password]@db.xyz.supabase.co:6543/postgres
const client = new Client({
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false }
});

const setupDatabase = async () => {
  try {
    await client.connect();
    console.log("🔌 Connected to Database...");

    // --- 1. DROP EXISTING TABLES (Order matters: Child first, then Parent) ---
    console.log("🗑️  Dropping old tables...");
    await client.query(`DROP TABLE IF EXISTS prescriptions CASCADE`);
    await client.query(`DROP TABLE IF EXISTS clinical_notes CASCADE`);
    await client.query(`DROP TABLE IF EXISTS vitals CASCADE`);
    await client.query(`DROP TABLE IF EXISTS billing CASCADE`);
    await client.query(`DROP TABLE IF EXISTS appointments CASCADE`);
    await client.query(`DROP TABLE IF EXISTS patients CASCADE`);
    await client.query(`DROP TABLE IF EXISTS users CASCADE`);

    // --- 2. CREATE TABLES ---
    console.log("🏗️  Creating new tables...");

    // A. Users (For Login)
    await client.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        username text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        role text NOT NULL, -- 'DOCTOR' or 'RECEPTIONIST'
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // B. Patients
    await client.query(`
      CREATE TABLE patients (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name text NOT NULL,
        phone_number text NOT NULL,
        email text,
        gender text,
        age int,
        blood_group text,
        medical_history text,
        address_street text,
        address_city text,
        pincode text,
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // C. Appointments
    await client.query(`
      CREATE TABLE appointments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
        doctor_name text,
        appointment_date timestamp with time zone DEFAULT now(),
        status text DEFAULT 'Scheduled',
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // D. Vitals (Linked to Appointment)
    await client.query(`
      CREATE TABLE vitals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
        weight_kg numeric,
        bp_systolic int,
        bp_diastolic int,
        pulse_bpm int,
        temperature_c numeric,
        resp_rate_per_min int,
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // E. Clinical Notes
    await client.query(`
      CREATE TABLE clinical_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
        complaints text,
        observations text,
        diagnoses text,
        notes text,
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // F. Prescriptions (Linked to Appointment)
    await client.query(`
      CREATE TABLE prescriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
        drug_name text,
        dosage text,
        frequency text,
        intake text,
        duration text,
        instructions text,
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // G. Billing
    await client.query(`
      CREATE TABLE billing (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
        bill_name text,
        bill_amount numeric,
        payment_method text,
        is_fully_paid boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // --- 3. SEED DEFAULT USER (So you can login) ---
    console.log("👤 Creating Admin User...");
    await client.query(`
      INSERT INTO users (username, password_hash, role)
      VALUES 
      ('admin_doc', 'hashed_secret_password', 'DOCTOR'),
      ('front_desk', 'reception_password', 'RECEPTIONIST');
    `);

    console.log("✅ Database Setup Complete!");

  } catch (err) {
    console.error("❌ Error setting up database:", err);
  } finally {
    await client.end();
  }
};

setupDatabase();