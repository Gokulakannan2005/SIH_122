@echo off
echo ========================================================
echo  SIH-122 ProjectPulse - Full System Launch
echo ========================================================
echo.
echo [1/2] Launching Backend REST API (Port 5000)...
start "ProjectPulse Backend" cmd /k "cd /d "%~dp0backend" && node --experimental-strip-types src/server.ts"

echo [2/2] Launching Frontend Vite Dev Server (Port 5173)...
timeout /t 2 /nobreak > nul
start "ProjectPulse Frontend" cmd /k "cd /d "%~dp0frontend" && cmd /c npm run dev"

echo.
echo ========================================================
echo  Both servers are starting in separate windows.
echo.
echo  Backend API:  http://localhost:5000/api/health
echo  Frontend App: http://localhost:5173
echo ========================================================
echo.
echo  Wait a few seconds then open http://localhost:5173
echo  in your browser.
echo.
pause
