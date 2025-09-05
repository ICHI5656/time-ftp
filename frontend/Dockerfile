FROM node:18-alpine as builder

WORKDIR /app

# Copy only package.json first for better caching
COPY package.json ./

# Install dependencies with clean install
RUN npm ci --only=production || npm install --production=false

# Copy source code (dockerignore will exclude node_modules)
COPY . .

# Build the application
RUN npm run build

# Production stage - use smaller nginx alpine
FROM nginx:alpine

# Copy only the built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]