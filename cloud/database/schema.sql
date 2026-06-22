-- BayMax-Ro1 Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- Patients Table
-- ===========================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Demographics
    age INTEGER,
    gender VARCHAR(20),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    
    -- Medical History
    medical_history JSONB DEFAULT '[]'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    current_medications JSONB DEFAULT '[]'::jsonb,
    
    -- Contact
    phone VARCHAR(20),
    emergency_contact JSONB
);

-- ===========================
-- Devices Table
-- ===========================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Device Info
    firmware_version VARCHAR(20),
    battery_level DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active',
    
    -- Location
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location_name VARCHAR(100)
);

-- ===========================
-- Scans Table
-- ===========================
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id VARCHAR(100) UNIQUE NOT NULL,
    patient_id VARCHAR(50) REFERENCES patients(patient_id),
    device_id VARCHAR(50) REFERENCES devices(device_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vital Signs
    vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Diagnosis
    diagnosis JSONB NOT NULL DEFAULT '{}'::jsonb,
    urgency VARCHAR(20) DEFAULT 'green',
    confidence DECIMAL(5,4) DEFAULT 0.0,
    
    -- Review Status
    requires_doctor_review BOOLEAN DEFAULT FALSE,
    reviewed BOOLEAN DEFAULT FALSE,
    doctor_id VARCHAR(50),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Raw Data
    raw_data JSONB,
    
    -- Additional
    symptoms JSONB DEFAULT '[]'::jsonb,
    notes TEXT
);

-- ===========================
-- Doctor Reviews Table
-- ===========================
CREATE TABLE IF NOT EXISTS doctor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id VARCHAR(100) REFERENCES scans(scan_id),
    doctor_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Review Details
    approved BOOLEAN NOT NULL,
    notes TEXT,
    modified_diagnosis TEXT,
    modified_treatment TEXT,
    
    -- Signature
    signature_hash VARCHAR(100)
);

-- ===========================
-- Medications Table
-- ===========================
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100),
    category VARCHAR(50),
    description TEXT,
    
    -- Dosage
    default_dosage VARCHAR(50),
    max_daily_dosage VARCHAR(50),
    
    -- Safety
    contraindications JSONB DEFAULT '[]'::jsonb,
    side_effects JSONB DEFAULT '[]'::jsonb,
    interactions JSONB DEFAULT '[]'::jsonb,
    
    -- Cost (for philanthropic model)
    cost_per_unit DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Availability
    available_countries JSONB DEFAULT '["GLOBAL"]'::jsonb,
    requires_prescription BOOLEAN DEFAULT TRUE
);

-- ===========================
-- Conditions Table
-- ===========================
CREATE TABLE IF NOT EXISTS conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icd_code VARCHAR(20),
    category VARCHAR(50),
    description TEXT,
    
    -- Symptoms
    common_symptoms JSONB DEFAULT '[]'::jsonb,
    vital_signs_patterns JSONB DEFAULT '{}'::jsonb,
    
    -- Treatment
    first_line_treatments JSONB DEFAULT '[]'::jsonb,
    second_line_treatments JSONB DEFAULT '[]'::jsonb,
    
    -- Urgency
    urgency_level VARCHAR(20) DEFAULT 'green',
    requires_hospital BOOLEAN DEFAULT FALSE,
    
    -- Prevalence
    prevalence VARCHAR(20),
    age_groups JSONB DEFAULT '[]'::jsonb
);

-- ===========================
-- Audit Log Table
-- ===========================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    user_id VARCHAR(50),
    
    -- Details
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT
);

-- ===========================
-- Indexes
-- ===========================
CREATE INDEX IF NOT EXISTS idx_scans_patient ON scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_scans_device ON scans(device_id);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at);
CREATE INDEX IF NOT EXISTS idx_scans_urgency ON scans(urgency);
CREATE INDEX IF NOT EXISTS idx_scans_review ON scans(requires_doctor_review) WHERE requires_doctor_review = TRUE;
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);

-- ===========================
-- Row Level Security (RLS)
-- ===========================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view their own patients" ON patients
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view scans from their devices" ON scans
    FOR SELECT USING (
        device_id IN (
            SELECT device_id FROM devices 
            WHERE id::text = auth.uid()::text
        )
    );

CREATE POLICY "Doctors can view pending reviews" ON scans
    FOR SELECT USING (
        requires_doctor_review = TRUE 
        AND reviewed = FALSE
    );

CREATE POLICY "Doctors can insert reviews" ON doctor_reviews
    FOR INSERT WITH CHECK (auth.uid()::text = doctor_id);

-- Admin policies (for service role)
CREATE POLICY "Service role full access" ON patients
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON devices
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON scans
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON doctor_reviews
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON audit_log
    FOR ALL USING (auth.role() = 'service_role');
