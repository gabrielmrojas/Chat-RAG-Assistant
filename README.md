<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
  <h1 style="margin: 0;">Chat Assistant with RAG</h1>
  <img src="./images/logo.png" alt="Logo" width="60" height="60"/>
</div>

<p align="center">
  An intelligent web chat assistant that uses RAG (Retrieval-Augmented Generation) 
  to answer questions based on user-uploaded documents.
</p>

<p align="center">
  <img src="./images/Chat.png" alt="Chat Screenshot" width="600"/>
</p>


## 🏗️ Architecture

### Frontend
- React 18 with TypeScript
- Tailwind CSS + Framer Motion
- shadcn/ui components
- Zustand for global state
- Axios for HTTP requests

### Backend
- FastAPI (Python)
- LangChain + OpenAI GPT (configurable)
- Chroma as the vector database
- PostgreSQL for metadata and history
- WebSocket for real-time chat

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Python 3.12
- PostgreSQL 13+

- Windows: Microsoft C++ Build Tools (Desktop development with C++) for Chroma (`chroma-hnswlib`)

### Quickstart (Windows)
Use provided scripts in `scripts/`:
1) Run initial setup (installs deps, creates venv, runs migrations)
   - `scripts\setup.bat`
2) Start backend
   - `scripts\start-backend.bat`
3) Start frontend
   - `scripts\start-frontend.bat`

### Manual Backend Setup
```bash
cd backend
pip install -r requirements.txt
copy .env.example .env  # then edit values
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Manual Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Troubleshooting dependency installs (Windows)

- __Pandas build error__ (attempts to compile from source):
  - We use `pandas==2.2.2`, which ships wheels for Python 3.12.
  - NumPy is capped to `numpy>=1.26,<2.0` for compatibility.

- __Chroma / hnswlib build error__ like “Microsoft Visual C++ 14.0 or greater is required”:
  - Install Microsoft C++ Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
  - Select workload: “Desktop development with C++”. Ensure components:
    - MSVC v143 (VS 2022) C++ x64/x86 build tools
    - Windows 10/11 SDK
  - Restart terminal, then run `pip install -r backend/requirements.txt` again.
  - Alternative: switch vector DB away from Chroma (e.g., Qdrant). This requires code changes in `backend/app/services/vector_store.py`.

## 📁 Project Structure

```
Chat_RAG/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API routes
│   │   ├── core/      # Configuration & DB
│   │   ├── models/    # SQLAlchemy models
│   │   ├── services/  # RAG, LLM, vector store, processing
│   │   └── schemas/   # Pydantic schemas
│   ├── tests/         # Backend tests
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── tests/         # Frontend tests
│   └── package.json
└── docs/              # Documentation
```

## 🔧 Features

- Real-time chat (WebSocket)
- Document upload: PDF, DOCX, TXT, MD, CSV
- Automatic processing + chunking + embeddings
- Semantic search in documents with citations
- Persistent conversation history
- Modern ChatGPT-like UI

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/ -v
```

### Frontend
```bash
cd frontend
npm test
```

## 🔐 Environment Variables

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chatrag_db

# OpenAI & LLM
OPENAI_API_KEY=your_openai_api_key
LLM_MODEL=gpt-5-nano-2025-08-07
LLM_TEMPERATURE=1
LLM_MAX_TOKENS=3000

# Embeddings / Vector DB
CHROMA_PERSIST_DIRECTORY=./chroma_db
EMBEDDING_MODEL=text-embedding-ada-002

# Security
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Files
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5000000

# CORS (comma-separated for multiple)
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# App
DEBUG=True
LOG_LEVEL=INFO

# Error Logging (1 = local file, 2 = Sentry)
ERROR_LOGGING=1
ERROR_LOG_DIR=./logs
SENTRY_DSN=

# Server Configuration
PORT=7000

```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:7000
VITE_WS_URL=ws://localhost:7000
VITE_SENTRY_DSN=
VITE_BACKEND_PORT=7000
```

## 📡 API & Endpoints

- Base: `/api/v1`
- Docs: `GET /docs`
- Health: `GET /api/v1/health/`, `GET /api/v1/health/detailed`, `GET /api/v1/health/stats`

## 🆕 Recent Changes

- **Global Error Handling**: Configurable error logging with `ERROR_LOGGING` environment variable:
  - `ERROR_LOGGING=1`: Logs errors to local files in `./logs/errors.log`
  - `ERROR_LOGGING=2`: Logs errors to Sentry (requires `SENTRY_DSN`)
  - Backend: Global exception handlers with detailed error context
  - Frontend: Error boundaries with optional Sentry integration
- Configurable LLM and embedding settings in `app/core/config.py`:
  - `LLM_MODEL`, `LLM_TEMPERATURE`, `LLM_MAX_TOKENS`, `EMBEDDING_MODEL`
- Switched to `langchain_openai` for `ChatOpenAI` and `OpenAIEmbeddings`
- Using `langchain_community.vectorstores.Chroma` for Chroma
- Vector similarity now normalized from Chroma distance to 0..1 for clearer thresholds
- Database engine creation fixed: SQLite uses `StaticPool`, PostgreSQL uses standard engine
- Health route updated for SQLAlchemy 2.x using `text("SELECT 1")`
- Added Windows scripts in `scripts/`: `setup.bat`, `start-backend.bat`, `start-frontend.bat`, `start-all.bat`

- __Dependencies (AI/RAG)__:
  - Removed explicit `openai` pin; resolver pulls a version compatible with `langchain-openai==0.0.2`.
  - Capped `numpy` to `>=1.26,<2.0` to avoid NumPy 2.x with `pandas`.
  - Bumped `pandas` to `2.2.2` (prebuilt wheels for Python 3.12).
  - Note for Windows: `chromadb` pulls `chroma-hnswlib` which may require Microsoft C++ Build Tools to build native extensions.

## 🚀 Deployment

See `docs/deployment.md` for deployment instructions.

## License

MIT License
