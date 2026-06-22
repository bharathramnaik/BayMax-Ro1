/**
 * Home Screen - Main dashboard for health workers
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }) {
  const menuItems = [
    {
      title: 'Register Patient',
      subtitle: 'Add new patient record',
      screen: 'Register',
      color: '#2563eb',
    },
    {
      title: 'Enter Symptoms',
      subtitle: 'Record patient symptoms',
      screen: 'Symptoms',
      color: '#059669',
    },
    {
      title: 'View Results',
      subtitle: 'Check scan results',
      screen: 'Results',
      color: '#7c3aed',
    },
    {
      title: 'Patient History',
      subtitle: 'View past records',
      screen: 'History',
      color: '#dc2626',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, Health Worker</Text>
        <Text style={styles.subtitle}>BayMax-Ro1 Diagnostic System</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>System Status</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Device</Text>
            <Text style={styles.statusValue}>● Connected</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Battery</Text>
            <Text style={styles.statusValue}>85%</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderLeftColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Quick Guide</Text>
        <Text style={styles.infoText}>
          1. Register patient{'\n'}
          2. Enter symptoms{'\n'}
          3. Connect device and scan{'\n'}
          4. View results{'\n'}
          5. Refer to doctor if needed
        </Text>
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
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  menuGrid: {
    paddingHorizontal: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
});
