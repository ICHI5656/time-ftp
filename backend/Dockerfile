FROM node:18-alpine

WORKDIR /app

# Install build tools for SQLite
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create data directory
RUN mkdir -p /app/data/uploads /app/data/processed

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.js"]