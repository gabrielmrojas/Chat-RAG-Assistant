@echo off
echo Starting Chat RAG Backend...

cd backend

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Starting FastAPI server...
"%~dp0..\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
