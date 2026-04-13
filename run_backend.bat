@echo off
echo Starting Backend (using root venv)...
cd backend
call ..\venv\Scripts\activate.bat
pip install --upgrade pip
echo Installing backend requirements...
pip install -r requirements.txt
echo Starting FastAPI server on http://localhost:8000...
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
pause
