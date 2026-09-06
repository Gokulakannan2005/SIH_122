@echo off
echo ========================================================
echo  SIH-122 ProjectPulse - Backend Server (Port 5000)
echo ========================================================
echo.
echo Starting Express REST API + SQLite Database...
echo Backend URL: http://localhost:5000
echo.
cd /d "%~dp0backend"
node --experimental-strip-types src/server.ts
pause
