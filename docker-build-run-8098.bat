@echo off
setlocal ENABLEDELAYEDEXPANSION
title Time FTP - Docker Build & Run (Win, 8098)
echo ========================================
echo Time FTP - Docker Build and Run (8098)
echo ========================================
echo.
echo Usage:  docker-build-run-8098.bat [nocache] [buildonly]
echo   nocache   : Build images without cache
echo   buildonly : Build only (do not start)
echo.

REM Check Docker Desktop
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

set NO_CACHE_FLAG=
if /I "%1"=="nocache" set NO_CACHE_FLAG=--no-cache
if /I "%2"=="nocache" set NO_CACHE_FLAG=--no-cache

set BUILD_ONLY=
if /I "%1"=="buildonly" set BUILD_ONLY=1
if /I "%2"=="buildonly" set BUILD_ONLY=1

echo [1/2] Building images %NO_CACHE_FLAG%
%COMPOSE_CMD% -f docker-compose-sftp.yml build %NO_CACHE_FLAG% --progress plain
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Build failed.
  pause
  exit /b 1
)

if defined BUILD_ONLY (
  echo.
  echo Build completed. To start containers:
  echo   %COMPOSE_CMD% -f docker-compose-sftp.yml up -d
  echo   or double-click start-local.bat
  goto :end
)

echo.
echo [2/2] Starting containers (port 8098)
%COMPOSE_CMD% -f docker-compose-sftp.yml up -d --force-recreate
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Failed to start containers.
  pause
  exit /b 1
)

echo.
echo ========================================
echo Started successfully on http://localhost:8098/
echo ========================================
echo - Root UI     : http://localhost:8098/
echo - DB Status   : http://localhost:8098/db-status.html
echo - Health      : http://localhost:8098/api/health
echo - Logs        : %COMPOSE_CMD% -f docker-compose-sftp.yml logs -f sftp-test-app
echo.
timeout /t 2 >nul
%COMPOSE_CMD% -f docker-compose-sftp.yml ps
echo.
pause

:end
endlocal

