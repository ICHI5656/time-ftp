@echo off
setlocal ENABLEDELAYEDEXPANSION
echo ========================================
echo Time FTP - Start (Docker, Windows)
echo ========================================
echo.

REM Ensure Docker Desktop is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Docker Desktop is not running.
  echo Please start Docker Desktop and try again.
  pause
  exit /b 1
)

REM Pick compose command (plugin or legacy)
set "COMPOSE_CMD=docker compose"
%COMPOSE_CMD% version >nul 2>&1
if %errorlevel% neq 0 (
  set "COMPOSE_CMD=docker-compose"
)

echo Using: %COMPOSE_CMD%
echo.

REM Build and start one-container setup on port 8091
%COMPOSE_CMD% -f docker-compose-sftp.yml up --build -d
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Failed to start containers.
  echo Check the compose file: docker-compose-sftp.yml
  pause
  exit /b 1
)

echo.
echo Waiting for service to get ready...
timeout /t 5 >nul

echo.
echo ========================================
echo Started successfully
echo ========================================
echo UI / API: http://localhost:8098
echo Logs:     %COMPOSE_CMD% -f docker-compose-sftp.yml logs -f sftp-test-app
echo Stop:     stop-local.bat
echo.
pause
