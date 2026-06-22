"""
BayMax-Ro1 Cloud API
FastAPI backend for doctor dashboard and device management.
"""

import os
from typing import List, Optional
from datetime import datetime
from enum import Enum

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .supabase_client import get_client

app = FastAPI(
    title="BayMax-Ro1 API",
    description="Cloud API for medical diagnostic system",
    version="1.0.0"
)

# CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Models ============

class UrgencyLevel(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"


class VitalSigns(BaseModel):
    heart_rate: float = Field(..., ge=0, le=300)
    spo2: float = Field(..., ge=0, le=100)
    temperature: float = Field(..., ge=30, le=50)
    respiratory_rate: float = Field(..., ge=0, le=100)
    blood_pressure: dict = Field(default_factory=dict)


class Diagnosis(BaseModel):
    primary: str
    confidence: float = Field(..., ge=0, le=1)
    secondary: Optional[str] = None
    tertiary: Optional[str] = None


class PatientScan(BaseModel):
    patient_id: str
    timestamp: datetime
    device_id: str
    vitals: VitalSigns
    diagnosis: Diagnosis
    urgency: UrgencyLevel
    confidence: float = Field(..., ge=0, le=1)
    requires_doctor_review: bool
    raw_data: Optional[dict] = None


class DoctorReview(BaseModel):
    scan_id: str
    doctor_id: str
    approved: bool
    notes: Optional[str] = None
    modified_diagnosis: Optional[str] = None
    modified_treatment: Optional[str] = None


class DeviceStatus(BaseModel):
    device_id: str
    last_seen: datetime
    battery_level: float
    firmware_version: str
    location: Optional[dict] = None


# ============ In-memory storage (replace with DB) ============

scans_db = {}
reviews_db = {}
devices_db = {}


# ============ Endpoints ============

@app.get("/")
async def root():
    return {
        "name": "BayMax-Ro1 API",
        "version": "1.0.0",
        "status": "operational",
        "database": "Supabase"
    }


@app.post("/api/v1/scans", response_model=dict)
async def submit_scan(scan: PatientScan):
    """Submit a new patient scan from device."""
    scan_id = f"scan_{scan.patient_id}_{scan.timestamp.timestamp()}"
    
    try:
        # Store in Supabase
        client = get_client()
        client.table("scans").insert({
            "scan_id": scan_id,
            "patient_id": scan.patient_id,
            "device_id": scan.device_id,
            "vitals": scan.vitals.dict(),
            "diagnosis": scan.diagnosis.dict(),
            "urgency": scan.urgency.value,
            "confidence": scan.confidence,
            "requires_doctor_review": scan.requires_doctor_review,
            "raw_data": scan.raw_data,
            "created_at": scan.timestamp.isoformat()
        }).execute()
        
    except Exception as e:
        # Fallback to in-memory if Supabase not configured
        scans_db[scan_id] = scan.dict()
    
    # Check if doctor review required
    if scan.requires_doctor_review or scan.urgency == UrgencyLevel.RED:
        # Notify available doctors
        await _notify_doctors(scan_id, scan)
    
    return {
        "scan_id": scan_id,
        "status": "received",
        "requires_review": scan.requires_doctor_review
    }


@app.get("/api/v1/scans/{scan_id}")
async def get_scan(scan_id: str):
    """Get scan details."""
    try:
        client = get_client()
        result = client.table("scans").select("*").eq("scan_id", scan_id).execute()
        
        if result.data:
            return result.data[0]
    except Exception:
        pass
    
    # Fallback to in-memory
    if scan_id not in scans_db:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return scans_db[scan_id]


@app.get("/api/v1/scans/pending")
async def get_pending_reviews():
    """Get scans requiring doctor review."""
    pending = []
    
    try:
        client = get_client()
        result = client.table("scans").select("*").eq(
            "requires_doctor_review", True
        ).is_("reviewed", "null").execute()
        
        return {"scans": result.data, "count": len(result.data)}
    except Exception:
        pass
    
    # Fallback to in-memory
    for scan_id, scan in scans_db.items():
        if scan.get("requires_doctor_review"):
            if scan_id not in reviews_db:
                pending.append({
                    "scan_id": scan_id,
                    **scan
                })
    
    return {"scans": pending, "count": len(pending)}


@app.post("/api/v1/reviews")
async def submit_review(review: DoctorReview):
    """Submit doctor review for a scan."""
    if review.scan_id not in scans_db:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    reviews_db[review.scan_id] = review.dict()
    
    # Update scan status
    scans_db[review.scan_id]["reviewed"] = True
    scans_db[review.scan_id]["doctor_approved"] = review.approved
    
    return {"status": "reviewed", "scan_id": review.scan_id}


@app.get("/api/v1/scans/{scan_id}/report")
async def get_report(scan_id: str):
    """Get formatted report for a scan."""
    if scan_id not in scans_db:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    scan = scans_db[scan_id]
    
    # Generate report
    report = {
        "scan_id": scan_id,
        "patient_id": scan["patient_id"],
        "timestamp": scan["timestamp"],
        "vitals_summary": _format_vitals(scan["vitals"]),
        "diagnosis_summary": _format_diagnosis(scan["diagnosis"]),
        "urgency": scan["urgency"],
        "recommendations": _get_recommendations(scan),
        "doctor_reviewed": scan_id in reviews_db
    }
    
    return report


@app.get("/api/v1/devices")
async def list_devices():
    """List all registered devices."""
    return {"devices": list(devices_db.values())}


@app.post("/api/v1/devices/{device_id}/status")
async def update_device_status(device_id: str, status: DeviceStatus):
    """Update device status."""
    devices_db[device_id] = status.dict()
    return {"status": "updated"}


@app.get("/api/v1/statistics")
async def get_statistics():
    """Get system statistics."""
    total_scans = len(scans_db)
    pending_reviews = sum(1 for s in scans_db.values() if s.get("requires_doctor_review") and s.get("scan_id") not in reviews_db)
    
    urgency_counts = {
        "green": sum(1 for s in scans_db.values() if s.get("urgency") == "green"),
        "yellow": sum(1 for s in scans_db.values() if s.get("urgency") == "yellow"),
        "red": sum(1 for s in scans_db.values() if s.get("urgency") == "red")
    }
    
    return {
        "total_scans": total_scans,
        "pending_reviews": pending_reviews,
        "urgency_distribution": urgency_counts,
        "devices_registered": len(devices_db)
    }


# ============ Helper Functions ============

async def _notify_doctors(scan_id: str, scan: PatientScan):
    """Notify doctors about urgent cases."""
    # In production: Send push notifications, SMS, etc.
    print(f"NOTIFICATION: Doctor review required for scan {scan_id}")


def _format_vitals(vitals: dict) -> str:
    """Format vital signs for report."""
    return f"""
Heart Rate: {vitals.get('heart_rate', 'N/A')} bpm
SpO2: {vitals.get('spo2', 'N/A')}%
Temperature: {vitals.get('temperature', 'N/A')}°C
Respiratory Rate: {vitals.get('respiratory_rate', 'N/A')} breaths/min
Blood Pressure: {vitals.get('blood_pressure', {}).get('systolic', 'N/A')}/{vitals.get('blood_pressure', {}).get('diastolic', 'N/A')} mmHg
""".strip()


def _format_diagnosis(diagnosis: dict) -> str:
    """Format diagnosis for report."""
    parts = []
    if diagnosis.get("primary"):
        parts.append(f"Primary: {diagnosis['primary']} ({diagnosis.get('confidence', 0)*100:.0f}%)")
    if diagnosis.get("secondary"):
        parts.append(f"Secondary: {diagnosis['secondary']}")
    if diagnosis.get("tertiary"):
        parts.append(f"Tertiary: {diagnosis['tertiary']}")
    
    return "\n".join(parts) if parts else "No diagnosis available"


def _get_recommendations(scan: dict) -> List[str]:
    """Get recommendations based on scan."""
    recommendations = []
    
    if scan.get("urgency") == "red":
        recommendations.append("Seek immediate medical attention")
    
    if scan.get("confidence", 0) < 0.7:
        recommendations.append("Additional testing recommended")
    
    if scan.get("vitals", {}).get("spo2", 100) < 94:
        recommendations.append("Monitor oxygen levels closely")
    
    return recommendations


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
