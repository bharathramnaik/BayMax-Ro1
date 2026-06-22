/**
 * BayMax-Ro1 Doctor Dashboard
 * Main page for reviewing patient cases
 */

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ryuseukpbepfrkxlvpjs.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_T-nYZpu1Agolf2nJN5TJjA_RvoB44dZ'
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
  reviewed: boolean;
  symptoms: string[];
}

export default function Dashboard() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0 });
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchPendingScans();
    fetchStats();
  }, []);

  async function fetchPendingScans() {
    setLoading(true);
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('requires_doctor_review', true)
      .eq('reviewed', false)
      .order('created_at', { ascending: false });

    if (data) setScans(data);
    setLoading(false);
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

  async function approveScan(scanId: string, approved: boolean) {
    const { error } = await supabase
      .from('doctor_reviews')
      .insert({
        scan_id: scanId,
        doctor_id: 'current-doctor',
        approved,
        notes: reviewNotes,
      });

    if (!error) {
      await supabase
        .from('scans')
        .update({ reviewed: true })
        .eq('scan_id', scanId);

      fetchPendingScans();
      fetchStats();
      setSelectedScan(null);
      setReviewNotes('');
    }
  }

  function getUrgencyColor(urgency: string) {
    switch (urgency) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  }

  function getUrgencyLabel(urgency: string) {
    switch (urgency) {
      case 'red': return 'URGENT';
      case 'yellow': return 'MODERATE';
      default: return 'ROUTINE';
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">BayMax-Ro1 Dashboard</h1>
              <p className="text-blue-200 mt-1">Doctor Review Portal</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Last updated</p>
              <p className="font-medium">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Scans</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Reviewed</p>
                <p className="text-3xl font-bold text-green-600">{stats.reviewed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Cases List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending Cases</h2>
              <p className="text-sm text-gray-500">{scans.length} cases awaiting review</p>
            </div>
            
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading...</p>
              </div>
            ) : scans.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No pending cases</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {scans.map((scan) => (
                  <div
                    key={scan.scan_id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedScan?.scan_id === scan.scan_id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                    onClick={() => setSelectedScan(scan)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{scan.patient_id}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(scan.urgency)}`}>
                        {getUrgencyLabel(scan.urgency)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{scan.diagnosis?.primary || 'No diagnosis'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(scan.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Case Details */}
          <div className="lg:col-span-2">
            {selectedScan ? (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Case Details</h2>
                    <p className="text-sm text-gray-500">Scan ID: {selectedScan.scan_id}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUrgencyColor(selectedScan.urgency)}`}>
                    {getUrgencyLabel(selectedScan.urgency)}
                  </span>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Patient & Scan Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Patient ID</p>
                      <p className="font-medium">{selectedScan.patient_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Scan Date</p>
                      <p className="font-medium">{new Date(selectedScan.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">AI Confidence</p>
                      <p className="font-medium">{Math.round(selectedScan.confidence * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">{selectedScan.reviewed ? 'Reviewed' : 'Pending'}</p>
                    </div>
                  </div>

                  {/* Symptoms */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Reported Symptoms</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedScan.symptoms?.map((symptom, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Vital Signs */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Vital Signs</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Heart Rate</p>
                        <p className="text-xl font-bold text-gray-900">{selectedScan.vitals?.heart_rate || 'N/A'}</p>
                        <p className="text-xs text-gray-400">bpm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">SpO2</p>
                        <p className="text-xl font-bold text-gray-900">{selectedScan.vitals?.spo2 || 'N/A'}</p>
                        <p className="text-xs text-gray-400">%</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Temperature</p>
                        <p className="text-xl font-bold text-gray-900">{selectedScan.vitals?.temperature || 'N/A'}</p>
                        <p className="text-xs text-gray-400">°C</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Blood Pressure</p>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedScan.vitals?.blood_pressure?.systolic || 'N/A'}/{selectedScan.vitals?.blood_pressure?.diastolic || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400">mmHg</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Diagnosis */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">AI Diagnosis</h3>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="font-semibold text-blue-900">{selectedScan.diagnosis?.primary || 'No diagnosis'}</p>
                      {selectedScan.diagnosis?.secondary && (
                        <p className="text-sm text-blue-700 mt-1">Also consider: {selectedScan.diagnosis.secondary}</p>
                      )}
                    </div>
                  </div>

                  {/* Review Notes */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Review Notes</h3>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Add your clinical notes here..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      onClick={() => approveScan(selectedScan.scan_id, true)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve Diagnosis
                    </button>
                    <button
                      className="flex-1 bg-amber-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                      onClick={() => approveScan(selectedScan.scan_id, false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Request Changes
                    </button>
                    <button
                      className="bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      onClick={() => {
                        if (confirm('Are you sure you want to refer this case?')) {
                          alert('Case referred to specialist');
                        }
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Refer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Case</h3>
                <p className="text-gray-500">Click on a pending case from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
