# Development Environment Setup

> Complete development environment with CI/CD, testing, and free-tier infrastructure.

---

## 1. Tech Stack (All Free/Open-Source)

### Backend Stack
| Component | Choice | Cost | Notes |
|-----------|--------|------|-------|
| **Language** | Python 3.11+ | Free | Primary language |
| **Framework** | FastAPI | Free | Async, auto-docs |
| **Agent Framework** | LangGraph | Free | State machine for agents |
| **ML Runtime** | ONNX Runtime | Free | Edge inference |
| **LLM Runtime** | Ollama | Free | Local LLM serving |

### Database Stack
| Component | Choice | Cost | Notes |
|-----------|--------|------|-------|
| **Primary DB** | PostgreSQL | Free | Patient records |
| **Cache** | Redis | Free | Session, real-time data |
| **Search** | SQLite FTS5 | Free | Full-text search |
| **Time Series** | InfluxDB OSS | Free | Sensor data |

### Frontend Stack
| Component | Choice | Cost | Notes |
|-----------|--------|------|-------|
| **Mobile** | React Native | Free | Health worker app |
| **Web** | React + TypeScript | Free | Doctor dashboard |
| **UI Kit** | shadcn/ui | Free | Beautiful components |
| **Charts** | Recharts | Free | Data visualization |

### Infrastructure
| Component | Choice | Cost | Notes |
|-----------|--------|------|-------|
| **CI/CD** | GitHub Actions | Free | 2000 min/month |
| **Container** | Docker | Free | Local dev |
| **Cloud** | Railway free tier | Free | API hosting |
| **Storage** | Cloudflare R2 | Free | 10GB free |
| **Monitoring** | Prometheus + Grafana | Free | Metrics |

---

## 2. Development Environment Setup

### 2.1 Prerequisites

```bash
# Windows (PowerShell)
# Install Python
winget install Python.Python.3.11

# Install Node.js
winget install OpenJS.NodeJS.LTS

# Install Docker Desktop
winget install Docker.DockerDesktop

# Install Git
winget install Git.Git
```

### 2.2 Project Setup Script

```bash
#!/bin/bash
# scripts/setup.sh

echo "Setting up BayMax-Ro1 development environment..."

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Install Node.js dependencies (for mobile/web)
npm install

# Setup pre-commit hooks
pre-commit install

# Create local directories
mkdir -p data/{training,validation,knowledge_base}
mkdir -p logs
mkdir -p models/{edge,cloud}

# Setup environment variables
cp .env.example .env
# Edit .env with your settings

# Initialize database
python scripts/init_db.py

# Pull medical LLM (requires Ollama installed)
python edge/scripts/download_model.py

echo "Setup complete! Run 'python edge/src/main.py' to start."
```

---

## 3. Project Structure

```
BayMax-Ro1/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI pipeline
│       ├── cd.yml              # CD pipeline
│       └── model-training.yml  # ML training
│
├── edge/                       # Edge AI (RPi)
│   ├── src/
│   ├── agents/
│   ├── models/
│   └── requirements.txt
│
├── cloud/                      # Cloud services
│   ├── api/
│   ├── training/
│   └── requirements.txt
│
├── mobile/                     # Health worker app
│   ├── src/
│   └── package.json
│
├── web/                        # Doctor dashboard
│   ├── src/
│   └── package.json
│
├── data/                       # Datasets
│   ├── training/
│   ├── validation/
│   └── knowledge_base/
│
├── tests/                      # Test suites
│   ├── unit/
│   ├── integration/
│   └── hardware/
│
├── scripts/                    # Utility scripts
│   ├── setup.sh
│   ├── init_db.py
│   └── deploy.sh
│
├── docker-compose.yml          # Local dev stack
├── requirements.txt            # Python deps
├── requirements-dev.txt        # Dev dependencies
├── pyproject.toml              # Project config
└── .env.example                # Environment template
```

---

## 4. CI/CD Pipeline

### 4.1 GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: BayMax-Ro1 CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      - name: Lint with ruff
        run: ruff check .
      - name: Type check with mypy
        run: mypy .

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest tests/ -v --cov=. --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t baymax-ro1 .
      - name: Run integration tests
        run: docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### 4.2 CD Pipeline

```yaml
# .github/workflows/cd.yml
name: BayMax-Ro1 CD

on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api
```

---

## 5. Testing Framework

### 5.1 Test Structure

```python
# tests/unit/test_vitals_agent.py

import pytest
from edge.src.agents.vitals_agent import VitalsAgent

class TestVitalsAgent:
    """Test suite for VitalsAgent."""
    
    @pytest.fixture
    def agent(self):
        return VitalsAgent({})
    
    def test_calculate_heart_rate_normal(self, agent):
        """Test heart rate calculation with normal signal."""
        ppg_data = {
            "signal": generate_mock_ppg(hr=72),
            "sampling_rate": 100
        }
        hr = agent._calculate_heart_rate(ppg_data)
        assert 65 <= hr <= 80
    
    def test_calculate_spo2_normal(self, agent):
        """Test SpO2 calculation."""
        ppg_data = {
            "red": generate_mock_signal(),
            "infrared": generate_mock_signal()
        }
        spo2 = agent._calculate_spo2(ppg_data)
        assert 95 <= spo2 <= 100
    
    def test_validate_readings_out_of_range(self, agent):
        """Test validation of out-of-range readings."""
        readings = {
            "heart_rate": 250,  # Above limit
            "spo2": 85
        }
        validated = agent._validate_readings(readings)
        assert validated["heart_rate"] == 200  # Clamped
```

### 5.2 Integration Tests

```python
# tests/integration/test_diagnosis_pipeline.py

import pytest
import asyncio
from edge.src.agents.orchestrator import AgentOrchestrator

class TestDiagnosisPipeline:
    """Integration tests for full diagnosis pipeline."""
    
    @pytest.fixture
    def orchestrator(self):
        config = {"medical_llm": "llama3.2:latest"}
        return AgentOrchestrator(config)
    
    @pytest.mark.asyncio
    async def test_full_pipeline(self, orchestrator):
        """Test complete diagnosis pipeline."""
        sensor_data = create_mock_sensor_data()
        
        result = await orchestrator.diagnose(sensor_data)
        
        assert "diagnosis" in result
        assert "urgency" in result
        assert "confidence" in result
        assert result["urgency"] in ["green", "yellow", "red"]
```

---

## 6. Hardware Shopping List

### Recommended Configuration

Based on research, here's the **recommended hardware** for development:

| Component | Model | Specs | Price | Link |
|-----------|-------|-------|-------|------|
| **SBC** | Raspberry Pi 5 | 8GB RAM | $80 | [Amazon](https://amazon.com/dp/B0CK2FCG1K) |
| **AI Accelerator** | Raspberry Pi AI HAT+ | 13 TOPS, Hailo-8L | $70 | [Amazon](https://amazon.com/dp/B0F95W3446) |
| **MCU** | ESP32-S3 DevKit | 512KB SRAM, WiFi/BLE | $10 | [Amazon](https://amazon.com/dp/B0C1BL1SK3) |
| **Storage** | Samsung EVO 256GB | microSD, A2/U3 | $20 | [Amazon](https://amazon.com/dp/B09D3KHZVP) |
| **Power** | CanaKit 27W USB-C | 5V/5A, USB-C | $15 | [Amazon](https://amazon.com/dp/B0BWFS3G26) |
| **Case** | Argon ONE V3 | With fan, GPIO access | $25 | [Amazon](https://amazon.com/dp/B0CJ4QBGY4) |
| **Display** | Official 7" Touch | 800x480, DSI | $60 | [Amazon](https://amazon.com/dp/B09F7JQK1V) |

**Total Development Kit: ~$280**

### Sensor Kit

| Component | Model | Price | Quantity |
|-----------|-------|-------|----------|
| PPG Sensor | MAX30102 | $3 | 2 |
| Thermal | MLX90614 | $12 | 1 |
| IR Camera | OV2640 | $6 | 1 |
| Microphone | INMP441 | $2 | 1 |
| IMU | MPU6050 | $2 | 1 |
| OLED Display | SSD1306 0.96" | $3 | 1 |

**Sensor Kit Total: ~$31**

### Total Development Hardware: ~$311

---

## 7. Free Tier Services

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| **GitHub** | Unlimited repos, 2000 CI min | Code hosting, CI/CD |
| **Railway** | $5 credit/month | API hosting |
| **Supabase** | 500MB DB, 1GB storage | PostgreSQL, Auth |
| **Cloudflare** | 10GB R2, unlimited CDN | Static assets |
| **Vercel** | 100GB bandwidth | Web dashboard |
| **Ollama** | Unlimited local | LLM inference |
| **Prometheus** | Unlimited self-hosted | Metrics |
| **Grafana** | Unlimited self-hosted | Dashboards |

---

## 8. Next Steps

1. **Order Hardware:** Raspberry Pi 5 8GB + AI HAT+
2. **Setup Environment:** Run setup scripts
3. **Clone & Build:** Start with edge AI module
4. **Test:** Run unit tests, verify pipeline

---

*Version: 1.0*
*Last Updated: June 2026*
