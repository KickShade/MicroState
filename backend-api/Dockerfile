FROM python:3.11-slim

# Environment hygiene
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src

WORKDIR /app

# System dependencies
RUN apt-get update \
    && apt-get install -y build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy source + models + configs
COPY src ./src
COPY models ./models
COPY configs ./config

EXPOSE 8000

CMD ["uvicorn", "lob_microstructure_analysis.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
