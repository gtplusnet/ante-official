# Multi-stage Dockerfile for Next.js Guardian App

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
EXPOSE 9003

# Development command (will be overridden in docker-compose)
CMD ["yarn", "dev"]

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_API_URL=https://backend-ante.geertest.com
ARG NEXT_PUBLIC_SOCKET_URL=wss://socket-ante.geertest.com
ARG NEXT_PUBLIC_COMPANY_ID=16
ARG NEXT_PUBLIC_APP_NAME="Geer Guardian"

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
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

# Debug: Print environment variables being used for build
RUN echo "Build environment variables:" && \
    echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" && \
    echo "NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL" && \
    echo "NEXT_PUBLIC_COMPANY_ID=$NEXT_PUBLIC_COMPANY_ID" && \
    echo "NODE_ENV=$NODE_ENV"

# Build the application with environment variables
RUN yarn build || npm run build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install timezone data and create a non-root user
RUN apk add --no-cache tzdata && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files 
COPY package*.json ./
COPY yarn.lock* ./

# Install only production dependencies as root
RUN yarn install --production --frozen-lockfile --ignore-scripts && \
    yarn cache clean || npm ci --only=production

# Copy only necessary files from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Set port environment variable for Next.js standalone server
ENV PORT=9003
ENV HOSTNAME=0.0.0.0

# Expose production port
EXPOSE 9003

# Production command using Next.js standalone server
CMD ["node", "server.js"]