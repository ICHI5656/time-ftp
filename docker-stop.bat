@echo off
echo ========================================
echo Stopping CSV FTP Uploader
echo ========================================
echo.

echo Stopping all containers...
docker-compose down

if %errorlevel% equ 0 (
    echo.
    echo All containers stopped successfully.
) else (
    echo.
    echo [WARNING] Some containers may still be running.
    echo Check with: docker ps
)

echo.
pause