/**
 * Symptom Input Screen
 */

import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Alert, TextInput 
} from 'react-native';

const SYMPTOM_CATEGORIES = [
  {
    name: 'General',
    symptoms: ['Fever', 'Fatigue', 'Weight loss', 'Weight gain', 'Night sweats', 'Loss of appetite']
  },
  {
    name: 'Respiratory',
    symptoms: ['Cough', 'Shortness of breath', 'Wheezing', 'Chest pain', 'Sore throat']
  },
  {
    name: 'Cardiovascular',
    symptoms: ['Palpitations', 'Dizziness', 'Fainting', 'Swelling in legs', 'High blood pressure']
  },
  {
    name: 'Gastrointestinal',
    symptoms: ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Constipation', 'Heartburn']
  },
  {
    name: 'Neurological',
    symptoms: ['Headache', 'Seizures', 'Numbness', 'Tremor', 'Memory problems', 'Insomnia']
  },
  {
    name: 'Musculoskeletal',
    symptoms: ['Joint pain', 'Muscle pain', 'Back pain', 'Stiffness', 'Swelling']
  },
  {
    name: 'Skin',
    symptoms: ['Rash', 'Itching', 'Dry skin', 'Acne', 'Bruising easily']
  },
  {
    name: 'Urinary',
    symptoms: ['Frequent urination', 'Painful urination', 'Blood in urine', 'Incontinence']
  },
];

export default function SymptomInputScreen({ route, navigation }) {
  const { patientId } = route.params || {};
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleSubmit = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Error', 'Please select at least one symptom');
      return;
    }

    navigation.navigate('Results', {
      patientId,
      symptoms: selectedSymptoms,
      notes: additionalNotes
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Symptom Input</Text>
        <Text style={styles.subtitle}>Patient: {patientId || 'Unknown'}</Text>
      </View>

      {/* Selected Symptoms Count */}
      <View style={styles.countBox}>
        <Text style={styles.countText}>
          {selectedSymptoms.length} symptom(s) selected
        </Text>
      </View>

      {/* Symptom Categories */}
      <View style={styles.categories}>
        {SYMPTOM_CATEGORIES.map((category, catIndex) => (
          <View key={catIndex} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <View style={styles.symptomGrid}>
              {category.symptoms.map((symptom, symIndex) => (
                <TouchableOpacity
                  key={symIndex}
                  style={[
                    styles.symptomChip,
                    selectedSymptoms.includes(symptom) && styles.symptomChipActive
                  ]}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <Text style={[
                    styles.symptomText,
                    selectedSymptoms.includes(symptom) && styles.symptomTextActive
                  ]}>
                    {symptom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Custom Symptom Input */}
      <View style={styles.customSection}>
        <Text style={styles.sectionTitle}>Add Custom Symptom</Text>
        <View style={styles.customRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={customSymptom}
            onChangeText={setCustomSymptom}
            placeholder="Enter symptom..."
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustomSymptom}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Additional Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          placeholder="Any additional information about symptoms..."
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>Continue to Scan</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#059669',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#a7f3d0',
    marginTop: 4,
  },
  countBox: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  categories: {
    paddingHorizontal: 16,
  },
  category: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  symptomChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  symptomText: {
    fontSize: 14,
    color: '#374151',
  },
  symptomTextActive: {
    color: '#fff',
  },
  customSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  customRow: {
    flexDirection: 'row',
    gap: 8,
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
    height: 100,
    textAlignVertical: 'top',
  },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  notesSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  submitBtn: {
    backgroundColor: '#7c3aed',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
