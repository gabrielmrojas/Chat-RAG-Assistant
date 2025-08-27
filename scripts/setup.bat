@echo off
echo Setting up Chat RAG Assistant...

echo.
echo === Backend Setup ===
cd backend

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt

echo Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo Please edit .env file with your configuration
)

echo Running database migrations...
alembic upgrade head

echo.
echo === Frontend Setup ===
cd ..\frontend

echo Installing Node.js dependencies...
npm install

echo.
echo === Setup Complete ===
echo.
echo Next steps:
echo 1. Edit backend/.env with your database and OpenAI API key
echo 2. Start the backend: scripts\start-backend.bat
echo 3. Start the frontend: scripts\start-frontend.bat
echo.
pause
