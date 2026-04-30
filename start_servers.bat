@echo off
title FoodFlash Startup Script
echo =======================================
echo     Starting FoodFlash Platform...
echo =======================================

:: Navigate to backend and start Flask in a new window
echo Starting Flask Backend (using venv)...
cd backend
start "Flask Backend" cmd /k "echo Activating venv... && call venv\Scripts\activate && echo Starting Flask Server... && python app.py"

echo.
echo Flask server has been launched!
echo Once running, access the website at:
echo http://localhost:5000
echo.
pause
