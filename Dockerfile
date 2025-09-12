# Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create upload directory
RUN mkdir -p test-uploads

# Expose ports
EXPOSE 8080

# Start server
CMD ["node", "sftp-server.js"]