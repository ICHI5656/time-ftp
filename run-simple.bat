@echo off
echo ========================================
echo CSV FTP Uploader - Simple Version
echo ========================================
echo.

echo Starting Redis container...
docker-compose up -d redis
if %ERRORLEVEL% NEQ 0 (
    echo Failed to start Redis
    pause
    exit /b 1
)

echo Starting backend server...
cd backend
start /B cmd /c "npm run dev"
cd ..

echo Waiting for services to start...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Services are running!
echo ========================================
echo Backend API: http://localhost:5000
echo.
echo Opening Simple UI in browser...
start http://localhost:5000/simple-app.html

echo.
echo You can also open these files directly:
echo - simple-app.html (Simple UI)
echo - ftp-manager.html (FTP Management)
echo - app.html (Full UI)
echo.
echo Press any key to stop services...
pause >nul

echo.
echo Stopping services...
taskkill /F /IM node.exe >nul 2>&1
docker-compose down
echo Services stopped.
pause