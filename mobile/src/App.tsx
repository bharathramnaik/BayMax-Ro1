/**
 * BayMax-Ro1 Mobile App - Main Entry Point
 * Health Worker Interface for Diagnostic System
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { SupabaseProvider } from './services/supabase';
import HomeScreen from './screens/HomeScreen';
import PatientRegistrationScreen from './screens/PatientRegistrationScreen';
import SymptomInputScreen from './screens/SymptomInputScreen';
import ScanResultsScreen from './screens/ScanResultsScreen';
import PatientHistoryScreen from './screens/PatientHistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SupabaseProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2563eb',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'BayMax-Ro1' }}
          />
          <Stack.Screen 
            name="Register" 
            component={PatientRegistrationScreen}
            options={{ title: 'Register Patient' }}
          />
          <Stack.Screen 
            name="Symptoms" 
            component={SymptomInputScreen}
            options={{ title: 'Enter Symptoms' }}
          />
          <Stack.Screen 
            name="Results" 
            component={ScanResultsScreen}
            options={{ title: 'Scan Results' }}
          />
          <Stack.Screen 
            name="History" 
            component={PatientHistoryScreen}
            options={{ title: 'Patient History' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SupabaseProvider>
  );
}
