# Multi-stage Dockerfile for Next.js Gate App

# Stage 1: Development
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile || npm ci

# Copy application files
COPY . .

# Remove .env.local to ensure production vars are used
RUN rm -f .env.local

# Expose Next.js development port
EXPOSE 9002

# Development command (will be overridden in docker-compose)
CMD ["yarn", "dev"]

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_API_URL=https://backend-ante.geertest.com
ARG NEXT_PUBLIC_BACKEND_URL=https://socket-ante.geertest.com
ARG NEXT_PUBLIC_SOCKET_URL=wss://socket-ante.geertest.com
ARG NEXT_PUBLIC_COMPANY_ID=16
ARG NEXT_PUBLIC_APP_NAME="Geer Gate"

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_COMPANY_ID=$NEXT_PUBLIC_COMPANY_ID
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile || npm ci

# Copy application files
COPY . .

# Remove .env.local to ensure production vars are used
RUN rm -f .env.local

# Build the application with environment variables
RUN yarn build || npm run build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install timezone data and create a non-root user
RUN apk add --no-cache tzdata && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone build from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose production port
EXPOSE 3000

# Production command - use node directly with standalone server
CMD ["node", "server.js"]