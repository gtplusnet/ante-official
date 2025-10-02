#!/bin/bash

set -e

echo "🚀 Starting ANTE development environment with hosted Supabase..."

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

# Start additional services (Redis & MongoDB) via Docker
echo "🔧 Starting Redis and MongoDB..."
docker network create ante-network 2>/dev/null || true

# Start Redis
if docker ps -a | grep -q ante-redis-dev; then
  echo "  - Redis container exists, starting it..."
  docker start ante-redis-dev >/dev/null 2>&1
else
  echo "  - Creating new Redis container..."
  docker run -d \
    --name ante-redis-dev \
    --network ante-network \
    -p 6379:6379 \
    -v redis_data:/data \
    --health-cmd="redis-cli ping" \
    --health-interval=10s \
    --health-timeout=5s \
    --health-retries=5 \
    redis:7-alpine
fi

# Start MongoDB  
if docker ps -a | grep -q ante-mongodb-dev; then
  echo "  - MongoDB container exists, starting it..."
  docker start ante-mongodb-dev >/dev/null 2>&1
else
  echo "  - Creating new MongoDB container..."
  docker run -d \
    --name ante-mongodb-dev \
    --network ante-network \
    -p 27017:27017 \
    -e MONGO_INITDB_ROOT_USERNAME=jdev \
    -e MONGO_INITDB_ROOT_PASSWORD=water123 \
    -e MONGO_INITDB_DATABASE=ante-test \
    -e TZ=Asia/Manila \
    -v mongodb_data:/data/db \
    --health-cmd="echo 'db.runCommand(\"ping\").ok' | mongosh localhost:27017/test --quiet" \
    --health-interval=10s \
    --health-timeout=5s \
    --health-retries=5 \
    mongo:7
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."

# Wait for Redis
echo "  - Waiting for Redis..."
until docker exec ante-redis-dev redis-cli ping >/dev/null 2>&1; do
  sleep 1
done
echo "    ✅ Redis is ready!"

# Wait for MongoDB
echo "  - Waiting for MongoDB..."
until docker exec ante-mongodb-dev mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
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
echo "  - Supabase (Hosted): https://ramamglzyiejlznfnngc.supabase.co"
echo "  - Redis: localhost:6379"
echo "  - MongoDB: localhost:27017 (jdev/water123)"
echo ""
echo "📊 Check status with: yarn status"
echo "📝 View logs with: yarn logs"
echo "⏹️ Stop all with: yarn stop"