# Multi-stage build for Next.js Multibook Application
# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apk add --no-cache libc6-compat curl

# Copy package files first (for better caching)
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Set build environment variables to avoid API calls during build
ENV NEXT_DISABLE_STRAPI=true \
    NODE_ENV=production

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

# Set timezone
ENV TZ=Asia/Manila
RUN apk add --no-cache tzdata curl

# Set working directory
WORKDIR /app

# Create nextjs user and group
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nextjs

# Expose port 3000 (Next.js default)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application using npm start
CMD ["npm", "start"]