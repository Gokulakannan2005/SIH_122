@echo off
echo ========================================================
echo  SIH-122 ProjectPulse - Frontend (Port 5173)
echo ========================================================
echo.
echo Starting Vite + React Development Server...
echo Frontend URL: http://localhost:5173
echo.
cd /d "%~dp0frontend"
cmd /c "npm run dev"
pause
