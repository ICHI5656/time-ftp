@echo off
echo ========================================
echo CSV FTP Uploader - Docker Build
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [1/5] Checking Docker environment...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to Docker daemon.
    pause
    exit /b 1
)

echo [2/5] Stopping existing containers...
docker-compose down >nul 2>&1

echo [3/5] Building Docker images...
echo   - Building backend (TypeScript/Express)...
echo   - Building frontend (React/Vite)...
echo   - Setting up Redis...
echo.
docker-compose build --no-cache

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Check the error messages above.
    pause
    exit /b 1
)

echo.
echo [4/5] Starting containers...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start containers.
    pause
    exit /b 1
)

echo.
echo [5/5] Waiting for services to be ready...
timeout /t 8 >nul

REM Health check
curl -s -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo BUILD AND DEPLOYMENT SUCCESSFUL!
    echo ========================================
    echo.
    echo Application URLs:
    echo   Web Interface: http://localhost:8100
    echo   Backend API:   http://localhost:5000
    echo   Redis:         localhost:6379
    echo.
    echo Container Status:
    docker ps | findstr csv-ftp
    echo.
    echo Commands:
    echo   View logs:     docker-compose logs -f
    echo   Stop:          docker-compose down
    echo   Restart:       docker-compose restart
    echo   Shell access:  docker exec -it csv-ftp-backend sh
    echo.
) else (
    echo.
    echo [WARNING] Services are still starting up...
    echo Please wait and check: http://localhost:8100
    echo.
    echo To check container status:
    docker ps | findstr csv-ftp
)

echo.
pause