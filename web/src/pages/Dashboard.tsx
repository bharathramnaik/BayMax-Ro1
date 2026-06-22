/**
 * BayMax-Ro1 Doctor Dashboard
 * Main page for reviewing patient cases
 */

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Scan {
  scan_id: string;
  patient_id: string;
  created_at: string;
  vitals: any;
  diagnosis: any;
  urgency: string;
  confidence: number;
  requires_doctor_review: boolean;
}

export default function Dashboard() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0 });

  useEffect(() => {
    fetchPendingScans();
    fetchStats();
  }, []);

  async function fetchPendingScans() {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('requires_doctor_review', true)
      .eq('reviewed', false)
      .order('created_at', { ascending: false });

    if (data) setScans(data);
  }

  async function fetchStats() {
    const { count: total } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true });

    const { count: pending } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('requires_doctor_review', true)
      .eq('reviewed', false);

    setStats({
      total: total || 0,
      pending: pending || 0,
      reviewed: (total || 0) - (pending || 0),
    });
  }

  async function approveScan(scanId: string, approved: boolean, notes: string) {
    const { error } = await supabase
      .from('doctor_reviews')
      .insert({
        scan_id: scanId,
        doctor_id: 'current-doctor', // Replace with actual auth
        approved,
        notes,
      });

    if (!error) {
      await supabase
        .from('scans')
        .update({ reviewed: true })
        .eq('scan_id', scanId);

      fetchPendingScans();
      fetchStats();
      setSelectedScan(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">BayMax-Ro1 Doctor Dashboard</h1>
          <p className="text-blue-200 mt-1">Review and approve patient diagnoses</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Scans</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Pending Review</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Reviewed</h3>
            <p className="text-3xl font-bold text-green-600">{stats.reviewed}</p>
          </div>
        </div>

        {/* Pending Cases */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Pending Cases for Review</h2>
          </div>
          
          {scans.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No pending cases to review
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {scans.map((scan) => (
                <div
                  key={scan.scan_id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedScan(scan)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Patient: {scan.patient_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(scan.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          scan.urgency === 'red'
                            ? 'bg-red-100 text-red-800'
                            : scan.urgency === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {scan.urgency.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(scan.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  
                  {scan.diagnosis && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Primary: {scan.diagnosis.primary || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedScan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Review Case</h2>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedScan(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Patient Info */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Patient Information</h3>
                <p className="text-gray-600">ID: {selectedScan.patient_id}</p>
                <p className="text-gray-600">
                  Scan Date: {new Date(selectedScan.created_at).toLocaleString()}
                </p>
              </div>

              {/* Vitals */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Vital Signs</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Heart Rate</p>
                    <p className="text-lg font-medium">
                      {selectedScan.vitals?.heart_rate || 'N/A'} bpm
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">SpO2</p>
                    <p className="text-lg font-medium">
                      {selectedScan.vitals?.spo2 || 'N/A'}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Temperature</p>
                    <p className="text-lg font-medium">
                      {selectedScan.vitals?.temperature || 'N/A'}°C
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Blood Pressure</p>
                    <p className="text-lg font-medium">
                      {selectedScan.vitals?.blood_pressure?.systolic || 'N/A'}/
                      {selectedScan.vitals?.blood_pressure?.diastolic || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">AI Diagnosis</h3>
                <div className="bg-blue-50 p-4 rounded">
                  <p className="font-medium">{selectedScan.diagnosis?.primary || 'N/A'}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Confidence: {Math.round(selectedScan.confidence * 100)}%
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  onClick={() => approveScan(selectedScan.scan_id, true, 'Approved')}
                >
                  Approve
                </button>
                <button
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                  onClick={() => approveScan(selectedScan.scan_id, false, 'Needs modification')}
                >
                  Request Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
