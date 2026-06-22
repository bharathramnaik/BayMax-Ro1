# Edge AI Module
# BayMax-Ro1 Diagnostic System

---

## Overview

The edge AI module runs on Raspberry Pi 5, processing sensor data locally and providing real-time diagnosis without internet connectivity.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Edge AI (RPi 5)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           SENSOR DATA INPUT                 │   │
│  │  (From ESP32-S3 via BLE/USB)                │   │
│  └─────────────────────┬───────────────────────┘   │
│                        │                            │
│                        ▼                            │
│  ┌─────────────────────────────────────────────┐   │
│  │           AGENT ORCHESTRATOR                │   │
│  │  (LangGraph-based state machine)            │   │
│  └─────────────────────┬───────────────────────┘   │
│                        │                            │
│    ┌───────────────────┼───────────────────┐       │
│    │                   │                   │       │
│    ▼                   ▼                   ▼       │
│  ┌─────┐           ┌─────┐           ┌─────┐     │
│  │VITAL│           │FACIAL│          │AUDIO│     │
│  │AGENT│           │AGENT │          │AGENT│     │
│  └──┬──┘           └──┬──┘          └──┬──┘     │
│     │                 │                 │         │
│     └─────────────────┼─────────────────┘         │
│                       │                            │
│                       ▼                            │
│  ┌─────────────────────────────────────────────┐   │
│  │         DIAGNOSIS AGENT (Med42-8B)          │   │
│  └─────────────────────┬───────────────────────┘   │
│                        │                            │
│                        ▼                            │
│  ┌─────────────────────────────────────────────┐   │
│  │           OUTPUT (Display/BLE)              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Download model (first time)
python scripts/download_model.py

# Run system
python src/main.py
```

## Configuration

Edit `config/settings.yaml` to configure:
- Sensor parameters
- Model paths
- Agent thresholds
- Output formats
