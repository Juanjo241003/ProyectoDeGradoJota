# Etapa 1: Compilación del Frontend React/Vite
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Etapa 2: Runtime Python/FastAPI todo-en-uno
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY backend/simulador_trinidad.db ./backend/simulador_trinidad.db
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
