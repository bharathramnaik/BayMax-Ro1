# BayMax-Ro1 Dockerfile
# Multi-stage build for production

# Stage 1: Base image
FROM python:3.11-slim as base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies
FROM base as deps

# Copy requirements
COPY requirements.txt .
COPY requirements-dev.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Development
FROM deps as development

# Install dev dependencies
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Default command
CMD ["uvicorn", "cloud.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Stage 4: Production
FROM deps as production

# Copy only necessary files
COPY cloud/api /app/cloud/api
COPY data /app/data

# Create non-root user
RUN useradd -m -u 1000 baymax && chown -R baymax:baymax /app
USER baymax

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/')" || exit 1

# Production command
CMD ["uvicorn", "cloud.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
