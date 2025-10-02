# Docker Setup Documentation

## Overview

This guide provides comprehensive instructions for running the GEER-ANTE ERP backend using Docker, including development, testing, and production configurations.

## Docker Architecture

The backend uses a multi-stage Dockerfile optimized for different environments:

1. **Base Stage**: Common Node.js setup
2. **Development Stage**: Full development environment with hot reload
3. **Builder Stage**: Compilation and build process
4. **Production Stage**: Minimal runtime with security hardening

## Prerequisites

### System Requirements

- Docker Engine 20.10+
- Docker Compose 2.0+ (optional)
- 4GB RAM minimum (8GB recommended)
- 10GB free disk space

### Installation

#### Installing Docker

**Ubuntu/Debian:**
```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Add Docker repository
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER
```

**macOS:**
```bash
# Install Docker Desktop
brew install --cask docker
```

**Windows:**
Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

## Dockerfile Explanation

### Multi-Stage Build Structure

```dockerfile
# Base stage - Common setup
FROM node:20-alpine AS base

# Development stage - Full dev environment
FROM base AS development
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl openssl-dev
COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN yarn install
COPY . .
EXPOSE 3000 4000
CMD ["yarn", "dev"]

# Builder stage - Compile TypeScript
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl openssl-dev
COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN yarn install --frozen-lockfile
COPY . .
RUN npx prisma generate
RUN yarn build

# Production stage - Minimal runtime
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN yarn install --production --frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000 4000
CMD ["node", "dist/main.js"]
```

## Development with Docker

### Building Development Image

```bash
# Build development image
docker build --target development -t ante-backend:dev .

# Build with build arguments
docker build \
  --target development \
  --build-arg NODE_ENV=development \
  -t ante-backend:dev .
```

### Running Development Container

#### Basic Run
```bash
docker run -d \
  --name ante-backend-dev \
  -p 3000:3000 \
  -p 4000:4000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --env-file .env.development \
  ante-backend:dev
```

#### With Live Reload
```bash
docker run -d \
  --name ante-backend-dev \
  -p 3000:3000 \
  -p 4000:4000 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/prisma:/app/prisma \
  -v $(pwd)/.env:/app/.env \
  --env-file .env.development \
  ante-backend:dev
```

#### Interactive Mode
```bash
docker run -it \
  --name ante-backend-dev \
  -p 3000:3000 \
  -p 4000:4000 \
  -v $(pwd):/app \
  --env-file .env.development \
  ante-backend:dev \
  /bin/sh
```

### Docker Compose for Development

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      target: development
    container_name: ante-backend-dev
    ports:
      - "3000:3000"
      - "4000:4000"
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma
      - ./test:/app/test
      - ./.env.development:/app/.env
      - node_modules:/app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/ante_dev
      - MONGODB_URI=mongodb://mongodb:27017/ante_dev
    depends_on:
      - postgres
      - mongodb
      - redis
    networks:
      - ante-network
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    container_name: ante-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ante_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - ante-network

  mongodb:
    image: mongo:6
    container_name: ante-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: ante_dev
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    networks:
      - ante-network

  redis:
    image: redis:7-alpine
    container_name: ante-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - ante-network

  pgadmin:
    image: dpage/pgadmin4
    container_name: ante-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ante.ph
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    networks:
      - ante-network
    depends_on:
      - postgres

volumes:
  postgres_data:
  mongo_data:
  redis_data:
  node_modules:

networks:
  ante-network:
    driver: bridge
```

Run with Docker Compose:
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v
```

## Production with Docker

### Building Production Image

```bash
# Build production image
docker build --target production -t ante-backend:latest .

# Build with version tag
docker build --target production -t ante-backend:v1.0.0 .

# Build for specific platform
docker build --platform linux/amd64 --target production -t ante-backend:latest .
```

### Running Production Container

```bash
docker run -d \
  --name ante-backend-prod \
  -p 3000:3000 \
  -p 4000:4000 \
  --env-file .env.production \
  --restart unless-stopped \
  --memory="1g" \
  --cpus="1.0" \
  ante-backend:latest
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: ante-backend:latest
    container_name: ante-backend
    ports:
      - "3000:3000"
      - "4000:4000"
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
      mongodb:
        condition: service_started
    networks:
      - ante-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

  postgres:
    image: postgres:14-alpine
    container_name: ante-postgres
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ante-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongodb:
    image: mongo:6
    container_name: ante-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
    networks:
      - ante-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: ante-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - ante-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  mongo_data:
    driver: local

networks:
  ante-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## Docker Commands Reference

### Container Management

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Start container
docker start ante-backend

# Stop container
docker stop ante-backend

# Restart container
docker restart ante-backend

# Remove container
docker rm ante-backend

# Remove container forcefully
docker rm -f ante-backend
```

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi ante-backend:latest

# Remove unused images
docker image prune

# Remove all unused images
docker image prune -a

# Tag image
docker tag ante-backend:latest ante-backend:v1.0.0
```

### Logs and Debugging

```bash
# View logs
docker logs ante-backend

# Follow logs
docker logs -f ante-backend

# View last 100 lines
docker logs --tail 100 ante-backend

# View logs with timestamps
docker logs -t ante-backend

# Execute command in container
docker exec -it ante-backend /bin/sh

# View container details
docker inspect ante-backend

# View container stats
docker stats ante-backend
```

### Volume Management

```bash
# List volumes
docker volume ls

# Create volume
docker volume create ante-data

# Inspect volume
docker volume inspect ante-data

# Remove volume
docker volume rm ante-data

# Remove unused volumes
docker volume prune
```

## Environment Variables

### Docker-specific Environment Variables

Create `.env.docker`:

```env
# Application
NODE_ENV=production
PORT=3000
SOCKET_PORT=4000

# Database - Using Docker service names
DATABASE_URL=postgresql://postgres:password@postgres:5432/ante_db
MONGODB_URI=mongodb://mongodb:27017/ante

# Redis - Using Docker service name
REDIS_HOST=redis
REDIS_PORT=6379

# Docker-specific settings
DOCKER_ENV=true
LOG_LEVEL=info
```

### Using Environment Files

```bash
# Single environment file
docker run --env-file .env.docker ante-backend:latest

# Multiple environment files
docker run --env-file .env.base --env-file .env.docker ante-backend:latest

# Override specific variables
docker run --env-file .env.docker -e NODE_ENV=development ante-backend:latest
```

## Networking

### Custom Network Configuration

```bash
# Create custom network
docker network create --driver bridge ante-network

# Run container with custom network
docker run -d --name ante-backend --network ante-network ante-backend:latest

# Connect existing container to network
docker network connect ante-network ante-backend

# Disconnect from network
docker network disconnect ante-network ante-backend
```

### Container Communication

```yaml
# Containers can communicate using service names
services:
  backend:
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/ante_db
      #                                               ^^^^^^^^
      #                                    Service name from docker-compose
```

## Health Checks

### Dockerfile Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### Docker Compose Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Security Best Practices

### 1. Use Non-Root User

```dockerfile
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
```

### 2. Minimize Image Size

```dockerfile
# Use alpine images
FROM node:20-alpine

# Multi-stage builds
FROM node:20-alpine AS builder
# Build steps...
FROM node:20-alpine AS production
# Copy only necessary files
```

### 3. Scan for Vulnerabilities

```bash
# Scan image for vulnerabilities
docker scan ante-backend:latest

# Use Trivy for detailed scanning
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image ante-backend:latest
```

### 4. Use Secrets Management

```yaml
# docker-compose with secrets
services:
  backend:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

## Performance Optimization

### 1. Layer Caching

```dockerfile
# Order commands from least to most frequently changing
COPY package.json yarn.lock ./  # Changes less frequently
RUN yarn install
COPY . .                        # Changes more frequently
```

### 2. Multi-Stage Builds

```dockerfile
# Separate build and runtime dependencies
FROM node:20-alpine AS builder
RUN yarn install
RUN yarn build

FROM node:20-alpine AS production
RUN yarn install --production
COPY --from=builder /app/dist ./dist
```

### 3. Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

## Troubleshooting Docker

### Common Issues and Solutions

#### 1. Container Exits Immediately

```bash
# Check logs
docker logs ante-backend

# Run in interactive mode to debug
docker run -it ante-backend:latest /bin/sh

# Check exit code
docker inspect ante-backend --format='{{.State.ExitCode}}'
```

#### 2. Cannot Connect to Database

```bash
# Verify network
docker network inspect ante-network

# Test connection from container
docker exec -it ante-backend ping postgres

# Check environment variables
docker exec ante-backend env | grep DATABASE
```

#### 3. Permission Denied Errors

```bash
# Fix volume permissions
docker exec -u root ante-backend chown -R nodejs:nodejs /app

# Run with proper user
docker run --user $(id -u):$(id -g) ante-backend:latest
```

#### 4. Out of Memory

```bash
# Increase memory limit
docker run -m 2g ante-backend:latest

# Check memory usage
docker stats ante-backend
```

## Docker in CI/CD

### GitHub Actions Example

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          context: .
          push: true
          tags: anteerp/backend:latest,anteerp/backend:${{ github.sha }}
          target: production
```

### GitLab CI Example

```yaml
docker-build:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build --target production -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
```

## Monitoring Docker Containers

### Using Prometheus and Grafana

```yaml
# Add to docker-compose
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Container Metrics

```bash
# Real-time stats
docker stats

# Export metrics
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Save to file
docker stats --no-stream > docker-stats.txt
```

## Backup and Restore

### Backup Container Data

```bash
# Backup volume
docker run --rm -v ante_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# Backup running container
docker commit ante-backend ante-backend-backup:$(date +%Y%m%d)
```

### Restore Container Data

```bash
# Restore volume
docker run --rm -v ante_postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /

# Restore from image
docker run -d --name ante-backend-restored ante-backend-backup:20240101
```

## Best Practices Summary

1. **Always use specific versions** in FROM statements
2. **Implement health checks** for production containers
3. **Use multi-stage builds** to minimize image size
4. **Never store secrets** in images or Dockerfiles
5. **Run containers as non-root** users
6. **Set resource limits** to prevent resource exhaustion
7. **Use .dockerignore** to exclude unnecessary files
8. **Tag images properly** with versions
9. **Scan images** for vulnerabilities regularly
10. **Monitor container** health and performance