/**
 * Patient Registration Screen
 */

import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { useSupabase } from '../services/supabase';

export default function PatientRegistrationScreen({ navigation }) {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    age: '',
    gender: '',
    weight_kg: '',
    height_cm: '',
    phone: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
  });

  const generatePatientId = () => {
    const id = 'PT' + Date.now().toString(36).toUpperCase();
    setFormData({ ...formData, patient_id: id });
  };

  const handleSubmit = async () => {
    if (!formData.patient_id || !formData.age || !formData.gender) {
      Alert.alert('Error', 'Please fill in required fields (ID, Age, Gender)');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .upsert({
          patient_id: formData.patient_id,
          age: parseInt(formData.age),
          gender: formData.gender,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
          phone: formData.phone || null,
          medical_history: formData.medical_history 
            ? formData.medical_history.split(',').map(s => s.trim()) 
            : [],
          allergies: formData.allergies 
            ? formData.allergies.split(',').map(s => s.trim()) 
            : [],
          current_medications: formData.current_medications 
            ? formData.current_medications.split(',').map(s => s.trim()) 
            : [],
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Patient registered successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Symptoms', { patientId: formData.patient_id }) }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient Registration</Text>
        <Text style={styles.subtitle}>Enter patient details</Text>
      </View>

      <View style={styles.form}>
        {/* Patient ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Patient ID *</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.patient_id}
              onChangeText={(text) => setFormData({ ...formData, patient_id: text })}
              placeholder="Enter or generate ID"
            />
            <TouchableOpacity 
              style={styles.generateBtn}
              onPress={generatePatientId}
            >
              <Text style={styles.generateBtnText}>Generate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Age & Gender */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              keyboardType="numeric"
              placeholder="Years"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    formData.gender === g && styles.genderBtnActive
                  ]}
                  onPress={() => setFormData({ ...formData, gender: g })}
                >
                  <Text style={[
                    styles.genderBtnText,
                    formData.gender === g && styles.genderBtnTextActive
                  ]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Weight & Height */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={formData.weight_kg}
              onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
              keyboardType="numeric"
              placeholder="kg"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={formData.height_cm}
              onChangeText={(text) => setFormData({ ...formData, height_cm: text })}
              keyboardType="numeric"
              placeholder="cm"
            />
          </View>
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            placeholder="+1 234 567 890"
          />
        </View>

        {/* Medical History */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Medical History</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.medical_history}
            onChangeText={(text) => setFormData({ ...formData, medical_history: text })}
            placeholder="Separate with commas (e.g., diabetes, hypertension)"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Allergies */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Allergies</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.allergies}
            onChangeText={(text) => setFormData({ ...formData, allergies: text })}
            placeholder="Separate with commas (e.g., penicillin, aspirin)"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Current Medications */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Medications</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.current_medications}
            onChangeText={(text) => setFormData({ ...formData, current_medications: text })}
            placeholder="Separate with commas (e.g., metformin 500mg)"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Register Patient</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    marginTop: 4,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  generateBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  generateBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  genderBtnText: {
    fontSize: 12,
    color: '#374151',
  },
  genderBtnTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
