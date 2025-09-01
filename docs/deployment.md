# Deployment Guide

This document describes how to deploy the Chat Assistant with RAG to a production-like environment.

## Prerequisites
- Operating system: Linux or Windows server
- Python 3.12
- Node.js 18+
- PostgreSQL 13+
- OpenAI API key
- A reverse proxy for production (e.g., Nginx, IIS, or a managed platform)

## 1) Backend (FastAPI)

### Configure environment
Create an `.env` file in `backend/` (copy from `.env.example`) and set values:

Required variables (see `backend/.env.example` for the full list):
- DATABASE_URL
- OPENAI_API_KEY
- LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS
- CHROMA_PERSIST_DIRECTORY
- EMBEDDING_MODEL
- SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
- UPLOAD_DIR, MAX_FILE_SIZE
- ALLOWED_ORIGINS
- DEBUG, LOG_LEVEL

### Install dependencies and migrate DB
```bash
cd backend
python -m venv venv
# Linux/macOS: source venv/bin/activate
# Windows:     venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
```

### Start the API server
For a first run:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Production options:
- Use a process manager (systemd, Supervisor, NSSM on Windows) to keep the service running.
- Put a reverse proxy in front (Nginx/IIS/Apache) for TLS termination and routing.

### Health endpoints
- GET /api/v1/health/
- GET /api/v1/health/detailed
- GET /api/v1/health/stats

## 2) Frontend (React + Vite)

### Configure environment
Create `frontend/.env.local` with your backend public URL:
```env
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
```

### Build and serve
```bash
cd frontend
npm install
npm run build
```
The production build is generated in `frontend/dist/`.
Serve it via a static server or your reverse proxy.

## 3) Reverse proxy example (Nginx)

Example (adjust paths and domain):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve the built frontend
    root /var/www/chat-rag/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # Proxy API requests to FastAPI backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # (Optional) expose docs if desired
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
    }
    location /redoc {
        proxy_pass http://127.0.0.1:8000/redoc;
    }
}
```

Notes:
- If your app uses WebSockets, ensure your proxy is configured to forward WS traffic to the backend and uses `wss://` for secure connections.
- Update `VITE_API_URL` and `VITE_WS_URL` to your public origin.

## 4) Persistence and storage
- Ensure `CHROMA_PERSIST_DIRECTORY` points to a persistent disk location (don’t use ephemeral paths).
- Ensure `UPLOAD_DIR` exists and has proper write permissions for the backend process.

## 5) Security and hardening
- Set a strong `SECRET_KEY`.
- Set `DEBUG=False` in production.
- Restrict `ALLOWED_ORIGINS` to your frontend origin(s).
- Keep your `OPENAI_API_KEY` secret and rotate as needed.

## 6) Monitoring
- Use the health endpoints for liveness/readiness checks.
- Review logs from your process manager and reverse proxy for errors.

## 7) Platform options
You can also deploy to managed platforms (Render, Railway, Azure App Service, etc.). Configure environment variables there, point the frontend to the backend’s public URL, and ensure persistent storage for Chroma if needed.

When deploying the frontend, it is critical to set the `VITE_API_BASE_URL` environment variable. This variable tells your frontend application where to find the backend API.

- **Variable Name**: `VITE_API_BASE_URL`
- **Value**: The full public URL of your deployed backend service (e.g., `https://your-backend-url.com`).

In platforms like Coolify, you can set this in the "Environment Variables" section of your frontend service configuration. Failure to set this variable will result in the frontend being unable to communicate with the backend in a production environment.
