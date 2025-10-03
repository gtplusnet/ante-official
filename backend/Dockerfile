# Backend Dockerfile - Optimized for production deployment
FROM node:20-alpine AS base

# Security: Update packages and create non-root user early with home directory
RUN apk update && apk upgrade && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -h /home/nodejs -s /bin/sh -G nodejs && \
    mkdir -p /home/nodejs && \
    chown nodejs:nodejs /home/nodejs && \
    rm -rf /var/cache/apk/*

# Development stage
FROM base AS development
WORKDIR /app

# Install development dependencies for building native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    openssl-dev \
    ca-certificates \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Copy package files (force rebuild on package changes - v3)
COPY package.json yarn.lock* ./

# Copy prisma folder for installation
COPY prisma ./prisma

# Copy New Relic config
COPY newrelic.js ./newrelic.js

# Install dependencies (this will also run postinstall and generate Prisma client)
RUN yarn install --frozen-lockfile --network-timeout 300000

# Copy application code (including deployment files if they exist)
COPY . .

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose ports
EXPOSE 3000 4000

# Development command
CMD ["yarn", "dev"]

# Builder stage - optimized for layer caching
FROM base AS builder
WORKDIR /app

# Install build dependencies and OpenSSL 3  
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    openssl-dev \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Copy package files and prisma schema first for better caching (v3)
COPY package.json yarn.lock* ./
COPY prisma ./prisma

# Copy New Relic config
COPY newrelic.js ./newrelic.js

# Install all dependencies including devDependencies for building
RUN yarn install --frozen-lockfile --production=false --network-timeout 300000

# Copy application source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application with increased memory limit for build environments
RUN NODE_OPTIONS="--max-old-space-size=2048" yarn build

# Remove devDependencies and clean cache to reduce image size
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Production stage - using distroless for maximum security
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS production

# Metadata labels for better tracking
LABEL org.opencontainers.image.title="Ante ERP Backend"
LABEL org.opencontainers.image.description="NestJS backend API for Ante ERP system"
LABEL org.opencontainers.image.vendor="Ante ERP"
LABEL org.opencontainers.image.licenses="Proprietary"

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy package.json for dependency information
COPY --chown=nonroot:nonroot package.json ./

# Copy built application from builder
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/prisma ./prisma
COPY --from=builder --chown=nonroot:nonroot /app/newrelic.js ./newrelic.js

# Copy reference files that are needed at runtime
COPY --from=builder --chown=nonroot:nonroot /app/src/shared/reference ./src/shared/reference

# Alternative production stage using Alpine for debugging capabilities
FROM node:20-alpine AS production-alpine

# Metadata labels
LABEL org.opencontainers.image.title="Ante ERP Backend (Alpine)"
LABEL org.opencontainers.image.description="NestJS backend API for Ante ERP system with debugging tools"
LABEL org.opencontainers.image.vendor="Ante ERP"
LABEL org.opencontainers.image.licenses="Proprietary"

WORKDIR /app

# Security updates and minimal runtime dependencies
# Also update npm to fix cross-spawn vulnerability in npm itself
RUN apk update && apk upgrade && \
    apk add --no-cache \
    openssl \
    ca-certificates \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/* && \
    npm install -g npm@latest && \
    npm cache clean --force

# Create non-root user with home directory
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -h /home/nodejs -s /bin/sh -G nodejs && \
    mkdir -p /home/nodejs && \
    chown nodejs:nodejs /home/nodejs

# Set production environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy package.json for dependency information  
COPY --chown=nodejs:nodejs package.json ./

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/newrelic.js ./newrelic.js

# Copy reference files that are needed at runtime
COPY --from=builder --chown=nodejs:nodejs /app/src/shared/reference ./src/shared/reference

# Create logs directory with proper ownership
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://127.0.0.1:3000/health || exit 1

# Optimized startup with New Relic
# Note: SWC builds to dist/main.js (not dist/src/main.js)
CMD ["node", "-r", "newrelic", "dist/main.js"]