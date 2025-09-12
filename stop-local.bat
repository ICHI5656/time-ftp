@echo off
setlocal
echo ========================================
echo Time FTP - Stop (Docker, Windows)
echo ========================================
echo.

REM Pick compose command
set "COMPOSE_CMD=docker compose"
%COMPOSE_CMD% version >nul 2>&1
if %errorlevel% neq 0 (
  set "COMPOSE_CMD=docker-compose"
)

echo Using: %COMPOSE_CMD%
echo Stopping containers...
%COMPOSE_CMD% -f docker-compose-sftp.yml down
if %errorlevel% equ 0 (
  echo.
  echo All containers stopped.
) else (
  echo.
  echo [WARNING] Some containers may still be running. Check with: docker ps
)
echo.
pause

