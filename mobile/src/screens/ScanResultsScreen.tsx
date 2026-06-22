/**
 * Scan Results Screen
 */

import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { useSupabase } from '../services/supabase';

export default function ScanResultsScreen({ route, navigation }) {
  const { patientId, symptoms, notes } = route.params || {};
  const { supabase } = useSupabase();
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    performDiagnosis();
  }, []);

  const performDiagnosis = async () => {
    setLoading(true);
    
    try {
      // Simulate AI diagnosis (will connect to edge device later)
      // For now, use basic rule-based diagnosis
      const diagnosis = await getBasicDiagnosis(symptoms);
      
      // Save scan to database
      const { data, error } = await supabase
        .from('scans')
        .insert({
          patient_id: patientId,
          device_id: 'mobile-app',
          vitals: diagnosis.vitals,
          diagnosis: diagnosis.diagnosis,
          urgency: diagnosis.urgency,
          confidence: diagnosis.confidence,
          requires_doctor_review: diagnosis.confidence < 0.8,
          symptoms: symptoms,
        })
        .select()
        .single();

      if (error) throw error;

      setResults({
        scanId: data.scan_id,
        ...diagnosis
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getBasicDiagnosis = async (symptoms) => {
    // Basic rule-based diagnosis
    // In production, this will call the edge AI device
    
    let urgency = 'green';
    let confidence = 0.6;
    let primaryDiagnosis = 'General health assessment';
    let recommendations = [];

    if (symptoms.includes('Fever') && symptoms.includes('Cough')) {
      primaryDiagnosis = 'Possible respiratory infection';
      urgency = 'yellow';
      confidence = 0.7;
      recommendations = [
        'Rest and hydration',
        'Monitor temperature',
        'Seek medical attention if symptoms worsen'
      ];
    } else if (symptoms.includes('Chest pain') || symptoms.includes('Shortness of breath')) {
      urgency = 'red';
      confidence = 0.8;
      primaryDiagnosis = 'Cardiovascular assessment required';
      recommendations = [
        'Seek immediate medical attention',
        'Do not delay emergency care'
      ];
    } else if (symptoms.includes('Headache') && symptoms.includes('Fever')) {
      primaryDiagnosis = 'Possible viral infection';
      urgency = 'yellow';
      confidence = 0.65;
      recommendations = [
        'Rest in dark room',
        'Take paracetamol for pain',
        'Monitor for severe symptoms'
      ];
    } else if (symptoms.includes('Abdominal pain')) {
      primaryDiagnosis = 'Abdominal assessment required';
      urgency = 'yellow';
      confidence = 0.6;
      recommendations = [
        'Do not eat until assessed',
        'Monitor for severe pain',
        'Seek medical evaluation'
      ];
    } else {
      recommendations = [
        'Monitor symptoms',
        'Follow up if symptoms persist',
        'Maintain healthy lifestyle'
      ];
    }

    return {
      vitals: {
        heart_rate: Math.floor(Math.random() * 40 + 60),
        spo2: Math.floor(Math.random() * 5 + 95),
        temperature: (Math.random() * 2 + 36).toFixed(1),
        respiratory_rate: Math.floor(Math.random() * 10 + 14),
      },
      diagnosis: {
        primary: primaryDiagnosis,
        confidence: confidence,
      },
      urgency,
      confidence,
      recommendations,
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Analyzing symptoms...</Text>
        <Text style={styles.loadingSubtext}>AI is processing your data</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[
        styles.header,
        { backgroundColor: results?.urgency === 'red' ? '#dc2626' : 
                           results?.urgency === 'yellow' ? '#d97706' : '#059669' }
      ]}>
        <Text style={styles.title}>Scan Results</Text>
        <Text style={styles.subtitle}>Patient: {patientId}</Text>
      </View>

      {/* Urgency Badge */}
      <View style={styles.urgencyContainer}>
        <View style={[
          styles.urgencyBadge,
          { backgroundColor: results?.urgency === 'red' ? '#fecaca' : 
                             results?.urgency === 'yellow' ? '#fef3c7' : '#d1fae5' }
        ]}>
          <Text style={[
            styles.urgencyText,
            { color: results?.urgency === 'red' ? '#dc2626' : 
                     results?.urgency === 'yellow' ? '#d97706' : '#059669' }
          ]}>
            {results?.urgency === 'red' ? '🔴 URGENT - Seek Immediate Care' :
             results?.urgency === 'yellow' ? '🟡 MODERATE - Monitor Closely' :
             '🟢 LOW - Routine Follow-up'}
          </Text>
        </View>
      </View>

      {/* Diagnosis */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Diagnosis</Text>
        <Text style={styles.diagnosisText}>{results?.diagnosis?.primary}</Text>
        <Text style={styles.confidenceText}>
          Confidence: {Math.round((results?.confidence || 0) * 100)}%
        </Text>
      </View>

      {/* Vital Signs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vital Signs</Text>
        <View style={styles.vitalsGrid}>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>Heart Rate</Text>
            <Text style={styles.vitalValue}>{results?.vitals?.heart_rate} bpm</Text>
          </View>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>SpO2</Text>
            <Text style={styles.vitalValue}>{results?.vitals?.spo2}%</Text>
          </View>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>Temperature</Text>
            <Text style={styles.vitalValue}>{results?.vitals?.temperature}°C</Text>
          </View>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>Resp Rate</Text>
            <Text style={styles.vitalValue}>{results?.vitals?.respiratory_rate}/min</Text>
          </View>
        </View>
      </View>

      {/* Symptoms */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reported Symptoms</Text>
        <View style={styles.symptomsList}>
          {symptoms?.map((symptom, index) => (
            <View key={index} style={styles.symptomTag}>
              <Text style={styles.symptomTagText}>{symptom}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommendations</Text>
        {results?.recommendations?.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationNumber}>{index + 1}.</Text>
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>

      {/* Doctor Review Notice */}
      {results?.urgency !== 'green' && (
        <View style={styles.reviewNotice}>
          <Text style={styles.reviewNoticeText}>
            ⚠️ This case requires doctor review. A healthcare professional will verify these results.
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.primaryBtnText}>Return Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('History', { patientId })}
        >
          <Text style={styles.secondaryBtnText}>View History</Text>
        </TouchableOpacity>
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
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  urgencyContainer: {
    padding: 16,
  },
  urgencyBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  diagnosisText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  confidenceText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  symptomTagText: {
    fontSize: 14,
    color: '#3730a3',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recommendationNumber: {
    fontWeight: '600',
    color: '#2563eb',
    marginRight: 8,
  },
  recommendationText: {
    flex: 1,
    color: '#374151',
    lineHeight: 20,
  },
  reviewNotice: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  reviewNoticeText: {
    color: '#92400e',
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
