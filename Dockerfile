# FROM python:3.11-slim

# # Prevent Python from writing .pyc files and buffer stdout
# ENV PYTHONDONTWRITEBYTECODE=1
# ENV PYTHONUNBUFFERED=1
# ENV PYTHONPATH=/app/src

# WORKDIR /app

# RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# COPY requirements.txt .
# RUN python -m pip install --upgrade pip
# RUN pip install --no-cache-dir -r requirements.txt

# COPY src ./src

# EXPOSE 8000

# CMD ["uvicorn", "lob_microstructure_analysis.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.11-slim

# Environment hygiene
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src

WORKDIR /app

# System dependencies (only if needed)
RUN apt-get update \
    && apt-get install -y build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src ./src

# Expose API port
EXPOSE 8000

# Start API (NO bash, NO shell)
CMD ["uvicorn", "lob_microstructure_analysis.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
