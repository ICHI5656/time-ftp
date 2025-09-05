@echo off
echo Starting Docker build...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo Building containers...
docker-compose build

if errorlevel 1 (
    echo.
    echo Build failed. Trying with docker compose command...
    docker compose build
)

if errorlevel 1 (
    echo.
    echo ERROR: Build failed. Please check the error messages.
    pause
    exit /b 1
)

echo.
echo Starting containers...
docker-compose up -d

if errorlevel 1 (
    docker compose up -d
)

echo.
echo ========================================
echo Build complete!
echo ========================================
echo.
echo Application: http://localhost:8100
echo.
echo To stop: docker-compose down
echo.
pause