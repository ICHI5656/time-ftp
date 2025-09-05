# Simple single-stage build for CSV FTP Uploader
FROM node:18-alpine

# Install essential dependencies
RUN apk add --no-cache python3 make g++ sqlite

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy source code
COPY backend/ ./backend/
COPY simple-app.html ./
COPY NETWORK_SETUP.md ./

# Install dependencies and build
RUN cd backend && npm install && npm run build

# Create data directory
RUN mkdir -p data/uploads data/processed && \
    chown -R nodejs:nodejs /app

# Switch to nodejs user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5000/simple-app.html || exit 1

# Start application
WORKDIR /app/backend
CMD ["npm", "start"]