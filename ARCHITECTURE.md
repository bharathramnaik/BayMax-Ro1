# BayMax-Ro1 System Architecture

> Technical architecture for the AI-powered diagnostic system.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│  │  PATIENT    │     │  HEALTH     │     │  DOCTOR     │              │
│  │  (Passive)  │     │  WORKER     │     │  (Review)   │              │
│  │             │     │  (Active)   │     │             │              │
│  │ • Wears     │     │ • Operates  │     │ • Approves  │              │
│  │   device    │     │   device    │     │ • Adjusts   │              │
│  │ • Provides  │     │ • Inputs    │     │ • Refers    │              │
│  │   history   │     │   symptoms  │     │             │              │
│  └─────────────┘     └─────────────┘     └─────────────┘              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDGE LAYER (Raspberry Pi)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SENSOR FUSION ENGINE                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │   │
│  │  │   PPG    │ │   NIR    │ │ Thermal  │ │  Camera  │          │   │
│  │  │ Sensor   │ │ Sensor   │ │ Sensor   │ │  (IR)    │          │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │   │
│  │       │            │            │            │                  │   │
│  │       └────────────┴─────┬──────┴────────────┘                  │   │
│  │                          ▼                                       │   │
│  │              ┌───────────────────────┐                          │   │
│  │              │   ESP32-S3 MCU        │                          │   │
│  │              │   (Signal Processing) │                          │   │
│  │              └───────────┬───────────┘                          │   │
│  └──────────────────────────┼──────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    AGENT ORCHESTRATOR                           │   │
│  │                                                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │   VITALS    │  │   FACIAL    │  │   AUDIO     │            │   │
│  │  │   AGENT     │  │   AGENT     │  │   AGENT     │            │   │
│  │  │             │  │             │  │             │            │   │
│  │  │ • Heart     │  │ • Skin      │  │ • Cough     │            │   │
│  │  │ • SpO2      │  │ • Eyes      │  │ • Voice     │            │   │
│  │  │ • BP        │  │ • Tongue    │  │ • Breathing │            │   │
│  │  │ • Temp      │  │ • Face      │  │             │            │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │   │
│  │         │                │                │                    │   │
│  │         └────────────────┼────────────────┘                    │   │
│  │                          ▼                                      │   │
│  │              ┌───────────────────────┐                         │   │
│  │              │   DIAGNOSIS AGENT     │                         │   │
│  │              │   (Medical LLM)       │                         │   │
│  │              │   Med42-v2-8B         │                         │   │
│  │              └───────────┬───────────┘                         │   │
│  └──────────────────────────┼─────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    OUTPUT LAYER                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │   REPORT    │  │   DISPLAY   │  │   BLE/WiFi  │            │   │
│  │  │  GENERATOR  │  │   (2.4"TFT) │  │   COMMS     │            │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLOUD LAYER (Optional)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│  │   API       │     │  TRAINING   │     │  DOCTOR     │              │
│  │   GATEWAY   │     │  PIPELINE   │     │  DASHBOARD  │              │
│  │             │     │             │     │             │              │
│  │ • Auth      │     │ • LoRA      │     │ • Cases     │              │
│  │ • Rate Limit│     │ • Fine-tune │     │ • Reports   │              │
│  │ • Analytics │     │ • Validate  │     │ • Approve   │              │
│  └─────────────┘     └─────────────┘     └─────────────┘              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    KNOWLEDGE BASE                               │   │
│  │  • WHO Guidelines  • Drug Database  • Disease Patterns          │   │
│  │  • Local Formulary • Case Studies   • Research Papers           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Agent System Design

### 2.1 Agent Communication Protocol

```python
# Agent Message Format
class AgentMessage:
    agent_id: str           # Source agent
    message_type: str       # "data" | "request" | "diagnosis" | "alert"
    payload: dict           # Agent-specific data
    confidence: float       # 0.0 - 1.0
    timestamp: datetime
    priority: int           # 1 (critical) - 5 (low)
```

### 2.2 Agent Definitions

| Agent | Input | Output | Model |
|-------|-------|--------|-------|
| **VitalsAgent** | PPG, Temp, SpO2 | Heart rate, BP est, SpO2 | Signal processing + LightGBM |
| **FacialAgent** | IR Camera | Skin conditions, eye health | YOLOv8 + Custom CNN |
| **AudioAgent** | Microphone | Cough type, voice biomarkers | Whisper + Classifier |
| **HistoryAgent** | User input | Medical context | Rule-based |
| **DiagnosisAgent** | All agent outputs | Differential diagnosis | Med42-v2-8B |
| **TreatmentAgent** | Diagnosis + History | Medication recommendations | OpenMedLLM-70B |
| **ReportAgent** | All outputs | Patient report | Template + LLM |

### 2.3 Agent Flow

```
Patient Scan (30 seconds)
        │
        ▼
┌─────────────────┐
│ Sensor Fusion   │ Parallel data collection
│ (ESP32-S3)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vitals Agent    │──┐
└─────────────────┘  │
                     │
┌─────────────────┐  │
│ Facial Agent    │──┼──► Diagnosis Agent ──► Treatment Agent ──► Report
└─────────────────┘  │         │
                     │         │
┌─────────────────┐  │         ▼
│ Audio Agent     │──┘    Confidence
└─────────────────┘      Check
                              │
                              ▼
                        ┌─────────┐
                        │ Doctor  │
                        │ Review  │
                        └─────────┘
```

---

## 3. Data Flow

### 3.1 Sensor Data Pipeline

```
Raw Sensor Data (100Hz)
        │
        ▼
┌─────────────────┐
│ Noise Filtering │ Kalman filter, moving average
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Feature Extract │ Peak detection, FFT analysis
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Normalization   │ Z-score, min-max scaling
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Agent Input     │ Structured JSON payload
└─────────────────┘
```

### 3.2 Diagnosis Data Structure

```python
class PatientScan:
    patient_id: str
    timestamp: datetime
    
    # Sensor readings
    vitals: VitalsData
    facial: FacialData
    audio: AudioData
    
    # Context
    symptoms: List[str]
    medical_history: MedicalHistory
    medications: List[str]
    
    # AI Output
    diagnosis: DiagnosisResult
    confidence: float
    recommendations: List[Recommendation]
    
    # Safety
    urgency_level: UrgencyLevel  # GREEN, YELLOW, RED
    requires_doctor_review: bool
```

---

## 4. Safety & Compliance

### 4.1 Medical Safety Layers

```
Layer 1: Sensor Validation
├── Range checks (physiologically possible?)
├── Noise detection (artifacts?)
└── Consistency checks (correlations?)

Layer 2: Agent Confidence
├── Minimum confidence threshold (0.7)
├── Uncertainty quantification
└── Fallback to "consult doctor"

Layer 3: Diagnosis Validation
├── Cross-reference with knowledge base
├── Drug interaction checking
└── Contraindication screening

Layer 4: Human Oversight
├── Doctor review required for:
│   • Confidence < 0.8
│   • Urgency level: RED
│   • Medication prescriptions
└── Audit trail for all decisions
```

### 4.2 Regulatory Considerations

| Region | Regulation | Status |
|--------|------------|--------|
| USA | FDA 510(k) | Research phase |
| EU | CE MDR | Research phase |
| India | CDSCO | Research phase |
| Global | WHO PQ | Target |

**Strategy:** Start as "clinical decision support" (lower regulatory burden), evolve to diagnostic device.

---

## 5. Privacy & Security

### 5.1 Data Protection

```
Patient Data
    │
    ├──► Edge Processing (default)
    │    ├── No raw data leaves device
    │    ├── Only aggregated results
    │    └── Local encryption (AES-256)
    │
    ├──► Cloud Sync (optional)
    │    ├── End-to-end encryption
    │    ├── Patient consent required
    │    └── Anonymization pipeline
    │
    └──► Doctor Access
         ├── Role-based access control
         ├── Audit logging
         └── Time-limited sessions
```

### 5.2 Compliance

- **HIPAA** (USA): Data encryption, access controls, audit logs
- **GDPR** (EU): Consent management, right to deletion
- **DPDP** (India): Data localization, consent requirements

---

## 6. Scalability

### 6.1 Deployment Models

| Model | Target | Capacity | Cost |
|-------|--------|----------|------|
| **Standalone** | Remote clinics | 1 patient/hr | $50 |
| **Hub** | Health centers | 10 patients/hr | $200 |
| **Network** | District hospitals | 100 patients/hr | $1000 |

### 6.2 Scaling Strategy

```
Phase 1: Pilot (100 devices)
├── 5 clinics
├── 6 months data
└── Validation study

Phase 2: Regional (1000 devices)
├── 50 clinics
├── Local partnerships
└── Regulatory submission

Phase 3: National (10000+ devices)
├── Manufacturing scale
├── Government integration
└── Continuous improvement
```

---

## 7. Technology Decisions

### 7.1 Why These Choices?

| Decision | Rationale |
|----------|-----------|
| **Raspberry Pi 5** | Best balance of cost, performance, ecosystem |
| **ESP32-S3** | Low power, BLE, sufficient for sensor fusion |
| **Med42-v2-8B** | Best open-source medical LLM for edge |
| **LangGraph** | Robust agent orchestration, state management |
| **FastAPI** | High performance, async, auto-documentation |
| **React Native** | Cross-platform, code reuse, familiar stack |

### 7.2 Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| NVIDIA Jetson | Too expensive for philanthropic model |
| TensorFlow Lite | Less flexible than ONNX Runtime |
| GPT-4 API | Privacy concerns, ongoing costs |
| Custom ML models | Insufficient medical validation |

---

## 8. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Sensor inaccuracy | Medium | High | Multi-sensor fusion, calibration |
| LLM hallucination | High | Critical | Confidence thresholds, human review |
| Hardware failure | Low | Medium | Redundancy, rugged design |
| Regulatory rejection | Medium | High | Early engagement, phased approach |
| Data breach | Low | Critical | Edge-first, encryption, audit |

---

## 9. Success Metrics

### Technical
- **Accuracy:** >85% for common conditions
- **Latency:** <5 seconds for diagnosis
- **Uptime:** >99% in field conditions
- **Battery:** >8 hours continuous use

### Impact
- **Reach:** 1M patients in 5 years
- **Cost:** <$1 per diagnosis
- **Languages:** 10+ local languages
- **Conditions:** 50+ diagnosable conditions

---

*Architecture Version: 1.0*
*Last Updated: June 2026*
*Author: CTO, BayMax-Ro1*
