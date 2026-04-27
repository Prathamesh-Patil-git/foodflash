@echo off
title FoodFlash Startup Script
echo =======================================
echo     Starting FoodFlash Platform...
echo =======================================

:: Start Redis in a new window
echo [1/2] Starting Redis Server...
start "Redis Server" cmd /k "echo Starting Redis... && redis-server"

:: Wait a brief moment to ensure Redis starts
timeout /t 2 /nobreak >nul

:: Navigate to backend and start Flask in a new window
echo [2/2] Starting Flask Backend (using venv)...
cd backend
start "Flask Backend" cmd /k "echo Activating venv... && call venv\Scripts\activate && echo Starting Flask Server... && python app.py"

echo.
echo Both servers have been launched in separate command windows!
echo Once the Flask server is running, you can access the website at:
echo http://localhost:5000
echo.
pause
