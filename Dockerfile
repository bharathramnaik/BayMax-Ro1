# BayMax-Ro1 Dockerfile
# Multi-stage build for production

# Stage 1: Base image
FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies
FROM base AS deps

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Development
FROM deps AS development

# Copy source code
COPY cloud/api ./cloud/api

# Expose port
EXPOSE 8000

# Default command
CMD ["uvicorn", "cloud.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Stage 4: Production
FROM deps AS production

# Copy only necessary files
COPY cloud/api ./cloud/api

# Create non-root user
RUN useradd -m -u 1000 baymax && chown -R baymax:baymax /app
USER baymax

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/')" || exit 1

# Production command
CMD ["uvicorn", "cloud.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
