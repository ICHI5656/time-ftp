@echo off
echo Building Docker containers...
docker-compose up -d --build
if %errorlevel% equ 0 (
    echo Success! Application is running at http://localhost:8100
) else (
    echo Build failed. Please check Docker Desktop is running.
)
pause