@echo off
echo ========================================
echo CSV FTP Uploader - Docker Quick Start
echo ========================================
echo.

REM DockerLwÕWfD‹Kº
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Starting containers...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start containers.
    echo Run docker-build.bat first if you haven't built the images.
    pause
    exit /b 1
)

echo.
echo Waiting for services...
timeout /t 5 >nul

echo.
echo ========================================
echo Application Started!
echo ========================================
echo.
echo Web Interface: http://localhost:8100
echo.
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause