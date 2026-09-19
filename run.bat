@echo off
echo ========================================================
echo   BreakPoint - System Failure & Cascade Simulator
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "BreakPoint Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "BreakPoint Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Application started!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000/docs
echo.
pause
