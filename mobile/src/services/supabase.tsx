/**
 * Supabase Service - Database connection for mobile app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const SUPABASE_URL = 'https://ryuseukpbepfrkxlvpjs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T-nYZpu1Agolf2nJN5TJjA_RvoB44dZ';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Context for Supabase
const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SupabaseContext.Provider value={{ session, loading, supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return context;
}

// Database operations
export const db = {
  // Patients
  async createPatient(patientData) {
    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getPatient(patientId) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', patientId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePatient(patientId, updates) {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('patient_id', patientId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Scans
  async createScan(scanData) {
    const { data, error } = await supabase
      .from('scans')
      .insert(scanData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getPatientScans(patientId) {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getPendingReviews() {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('requires_doctor_review', true)
      .eq('reviewed', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Devices
  async registerDevice(deviceData) {
    const { data, error } = await supabase
      .from('devices')
      .upsert(deviceData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateDeviceStatus(deviceId, status) {
    const { data, error } = await supabase
      .from('devices')
      .update({ ...status, last_seen: new Date().toISOString() })
      .eq('device_id', deviceId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Medications lookup
  async searchMedications(query) {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .ilike('name', `%${query}%`);
    
    if (error) throw error;
    return data;
  },

  // Conditions lookup
  async searchConditions(symptoms) {
    const { data, error } = await supabase
      .from('conditions')
      .select('*')
      .contains('common_symptoms', symptoms);
    
    if (error) throw error;
    return data;
  },
};
