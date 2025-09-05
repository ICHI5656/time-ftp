@echo off
echo ================================================
echo CSV FTP Uploader - Network Docker Setup
echo ================================================
echo.

:: Stop existing containers
echo Stopping existing containers...
docker-compose down

:: Remove old images
echo Cleaning up old images...
docker image prune -f

:: Build and start services
echo Building and starting services...
docker-compose up --build -d

:: Wait for services to be ready
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

:: Check service status
echo Checking service status...
docker-compose ps

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo Access URLs:
echo - Local:   http://localhost:5000/simple-app.html
echo - Network: http://[YOUR_IP]:5000/simple-app.html
echo.
echo To find your IP address, run: ipconfig
echo Look for "IPv4 Address" under your network adapter
echo.
echo Services:
echo - App:   Port 5000
echo - Redis: Port 6379
echo.
echo To stop: docker-compose down
echo ================================================
pause