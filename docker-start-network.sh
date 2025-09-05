#!/bin/bash

echo "================================================"
echo "CSV FTP Uploader - Network Docker Setup"
echo "================================================"
echo

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Remove old images  
echo "Cleaning up old images..."
docker image prune -f

# Build and start services
echo "Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check service status
echo "Checking service status..."
docker-compose ps

echo
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo

# Get network IP automatically
IP=$(hostname -I | awk '{print $1}')
if [ -z "$IP" ]; then
    IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}')
fi

echo "Access URLs:"
echo "- Local:   http://localhost:5000/simple-app.html"
echo "- Network: http://$IP:5000/simple-app.html"
echo
echo "Services:"
echo "- App:   Port 5000"  
echo "- Redis: Port 6379"
echo
echo "To stop: docker-compose down"
echo "================================================"