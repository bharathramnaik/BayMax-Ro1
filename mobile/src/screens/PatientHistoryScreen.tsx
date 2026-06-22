/**
 * Patient History Screen
 */

import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { useSupabase } from '../services/supabase';

export default function PatientHistoryScreen({ route, navigation }) {
  const { patientId } = route.params || {};
  const { supabase } = useSupabase();
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [scans, setScans] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch patient data
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      // Fetch patient scans
      const { data: scansData } = await supabase
        .from('scans')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      setPatient(patientData);
      setScans(scansData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient History</Text>
        <Text style={styles.subtitle}>ID: {patientId}</Text>
      </View>

      {/* Patient Info Card */}
      {patient && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{patient.age || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{patient.gender || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{patient.weight_kg ? `${patient.weight_kg} kg` : 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Height</Text>
              <Text style={styles.infoValue}>{patient.height_cm ? `${patient.height_cm} cm` : 'N/A'}</Text>
            </View>
          </View>

          {patient.medical_history?.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyLabel}>Medical History:</Text>
              <Text style={styles.historyText}>{patient.medical_history.join(', ')}</Text>
            </View>
          )}

          {patient.allergies?.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyLabel}>Allergies:</Text>
              <Text style={styles.historyText}>{patient.allergies.join(', ')}</Text>
            </View>
          )}

          {patient.current_medications?.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyLabel}>Current Medications:</Text>
              <Text style={styles.historyText}>{patient.current_medications.join(', ')}</Text>
            </View>
          )}
        </View>
      )}

      {/* Scan History */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scan History ({scans.length})</Text>
        
        {scans.length === 0 ? (
          <Text style={styles.emptyText}>No scans recorded yet</Text>
        ) : (
          scans.map((scan, index) => (
            <View key={index} style={styles.scanItem}>
              <View style={styles.scanHeader}>
                <Text style={styles.scanDate}>
                  {new Date(scan.created_at).toLocaleDateString()}
                </Text>
                <View style={[
                  styles.urgencyBadge,
                  { backgroundColor: scan.urgency === 'red' ? '#fecaca' : 
                                     scan.urgency === 'yellow' ? '#fef3c7' : '#d1fae5' }
                ]}>
                  <Text style={[
                    styles.urgencyText,
                    { color: scan.urgency === 'red' ? '#dc2626' : 
                             scan.urgency === 'yellow' ? '#d97706' : '#059669' }
                  ]}>
                    {scan.urgency?.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.scanDiagnosis}>
                {scan.diagnosis?.primary || 'No diagnosis'}
              </Text>
              
              <View style={styles.scanVitals}>
                <Text style={styles.scanVital}>HR: {scan.vitals?.heart_rate || 'N/A'}</Text>
                <Text style={styles.scanVital}>SpO2: {scan.vitals?.spo2 || 'N/A'}%</Text>
                <Text style={styles.scanVital}>Temp: {scan.vitals?.temperature || 'N/A'}°C</Text>
              </View>

              {scan.symptoms?.length > 0 && (
                <View style={styles.symptomsRow}>
                  {scan.symptoms.slice(0, 3).map((sym, i) => (
                    <View key={i} style={styles.symptomMini}>
                      <Text style={styles.symptomMiniText}>{sym}</Text>
                    </View>
                  ))}
                  {scan.symptoms.length > 3 && (
                    <Text style={styles.moreSymptoms}>+{scan.symptoms.length - 3}</Text>
                  )}
                </View>
              )}

              <View style={styles.scanFooter}>
                <Text style={styles.reviewStatus}>
                  {scan.reviewed ? '✅ Reviewed' : '⏳ Pending Review'}
                </Text>
                <Text style={styles.confidence}>
                  {Math.round((scan.confidence || 0) * 100)}% confidence
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#7c3aed',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#c4b5fd',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  historySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  historyLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  historyText: {
    fontSize: 14,
    color: '#374151',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: 20,
  },
  scanItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scanDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scanDiagnosis: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  scanVitals: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  scanVital: {
    fontSize: 12,
    color: '#6b7280',
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  symptomMini: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  symptomMiniText: {
    fontSize: 10,
    color: '#3730a3',
  },
  moreSymptoms: {
    fontSize: 10,
    color: '#6b7280',
    alignSelf: 'center',
  },
  scanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 4,
  },
  reviewStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  confidence: {
    fontSize: 12,
    color: '#6b7280',
  },
});
