@echo off
echo ========================================
echo Docker Build - CSV FTP Uploader
echo ========================================
echo.

echo Checking Docker...
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo.
echo Building containers...
docker-compose build

if errorlevel 1 (
    echo.
    echo Trying alternative command...
    docker compose build
)

echo.
echo Starting containers...
docker-compose up -d

if errorlevel 1 (
    docker compose up -d
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Application: http://localhost:8100
echo API: http://localhost:5000
echo.
echo Commands:
echo   Stop: docker-compose down
echo   Logs: docker-compose logs -f
echo.
pause