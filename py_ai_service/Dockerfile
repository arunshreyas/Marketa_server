FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Build context is the project root (see docker-compose.yml),
# so requirements.txt lives under py_ai_service/.
COPY py_ai_service/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project so /app has both py_ai_service/ and agents/
COPY . .

EXPOSE 8000

# ai_service.py lives inside the py_ai_service package when copied under /app
CMD ["uvicorn", "py_ai_service.ai_service:app", "--host", "0.0.0.0", "--port", "8000"]
