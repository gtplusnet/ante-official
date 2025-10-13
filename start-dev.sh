#!/bin/bash

set -e

echo "🚀 Starting ANTE development environment with local databases..."

# Change to the project root directory
cd "$(dirname "$0")"

# Stop any existing processes
echo "⏹️ Stopping existing processes..."
pm2 delete all 2>/dev/null || true

# Kill processes on ports 3000 and 4000
echo "🔪 Killing processes on ports 3000 and 4000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
echo "    ✅ Ports 3000 and 4000 cleared!"

# Stop and remove existing containers (if any)
echo "🧹 Cleaning up existing Docker containers..."
docker rm -f ante-postgres ante-redis-dev ante-mongodb-dev 2>/dev/null || true

# Start database services (PostgreSQL, Redis & MongoDB) via Docker Compose
echo "🔧 Starting PostgreSQL, Redis and MongoDB via Docker Compose..."
docker compose -f docker/docker-compose-databases.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL
echo "  - Waiting for PostgreSQL..."
until docker exec ante-postgres pg_isready -U ante >/dev/null 2>&1; do
  sleep 1
done
echo "    ✅ PostgreSQL is ready!"

# Wait for Redis
echo "  - Waiting for Redis..."
until docker exec ante-redis redis-cli ping >/dev/null 2>&1; do
  sleep 1
done
echo "    ✅ Redis is ready!"

# Wait for MongoDB
echo "  - Waiting for MongoDB..."
until docker exec ante-mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  sleep 1
done
echo "    ✅ MongoDB is ready!"

echo "🗄️ All services are ready!"

# Start applications with PM2
echo "🚀 Starting applications with PM2..."
pm2 start ecosystem.config.js

echo ""
echo "✅ ANTE development environment started successfully!"
echo ""
echo "🔗 Services available at:"
echo "  - Backend API: http://localhost:3000"
echo "  - WebSocket: ws://localhost:4000" 
echo "  - Frontend Main: http://localhost:9000"
echo ""
echo "🔗 Database services available at:"
echo "  - PostgreSQL: localhost:5432 (ante/ante_password)"
echo "  - Redis: localhost:6379"
echo "  - MongoDB: localhost:27017 (jdev/water123)"
echo ""
echo "📊 Check status with: yarn status"
echo "📝 View logs with: yarn logs"
echo "⏹️ Stop all with: yarn stop"