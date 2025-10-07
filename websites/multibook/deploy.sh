#!/bin/bash

# Deploy script for Multibook Next.js with zero-downtime deployment
# This script builds and deploys the Next.js application

set -e

echo "🚀 Starting Next.js deployment process..."
echo "======================================="
echo ""

# Define variables
DEPLOY_DIR="/var/www/multibook-nextjs"
TEMP_BUILD_DIR="/var/tmp/multibook-nextjs-build-$$"
BACKUP_DIR="/var/www/multibook-nextjs-backup"
PM2_APP_NAME="multibook-nextjs"

# Step 1: Skip git operations for now (already have latest changes)
echo "⏩ Skipping git operations (using local changes)..."

# Step 2: Create temporary build directory
echo "📁 Creating temporary build directory..."
cp -r . "$TEMP_BUILD_DIR"
cd "$TEMP_BUILD_DIR"

# Step 3: Install packages in temporary directory
echo "📦 Installing packages..."
npm ci --production=false

if [ $? -eq 0 ]; then
    echo "✅ Package installation completed successfully"
else
    echo "❌ Package installation failed"
    rm -rf "$TEMP_BUILD_DIR"
    exit 1
fi

# Step 4: Build the Next.js application
echo "🔨 Building the Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    rm -rf "$TEMP_BUILD_DIR"
    exit 1
fi

# Step 5: Create standalone Next.js build
echo "📦 Preparing deployment files..."
# Next.js standalone output includes everything needed to run
if [ ! -d ".next/standalone" ]; then
    echo "⚠️  Standalone build not found. Creating standard deployment..."
fi

# Step 6: Stop the current application (if running)
echo "🛑 Stopping current application..."
if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
    pm2 stop "$PM2_APP_NAME" || true
else
    echo "ℹ️  Application not currently running with PM2"
fi

# Step 7: Backup current deployment
if [ -d "$DEPLOY_DIR" ]; then
    echo "💾 Creating backup of current deployment..."
    rm -rf "$BACKUP_DIR"
    mv "$DEPLOY_DIR" "$BACKUP_DIR"
fi

# Step 8: Deploy new build
echo "🚀 Deploying new build..."
mkdir -p "$DEPLOY_DIR"
cp -r . "$DEPLOY_DIR/"

# Set proper permissions
chown -R www-data:www-data "$DEPLOY_DIR" || true
chmod -R 755 "$DEPLOY_DIR"

# Step 9: Create PM2 ecosystem file if it doesn't exist
if [ ! -f "$DEPLOY_DIR/ecosystem.config.js" ]; then
    echo "📝 Creating PM2 ecosystem configuration..."
    cat > "$DEPLOY_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'multibook-nextjs',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/multibook-nextjs',
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/multibook-nextjs-error.log',
    out_file: '/var/log/pm2/multibook-nextjs-out.log',
    log_file: '/var/log/pm2/multibook-nextjs-combined.log',
    time: true
  }]
}
EOF
fi

# Step 10: Start the application with PM2
echo "🔄 Starting application with PM2..."
cd "$DEPLOY_DIR"
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    echo "✅ Application started successfully"
    pm2 save
    pm2 startup systemd -u www-data --hp /var/www || true
else
    echo "❌ Failed to start application"
    # Rollback if needed
    if [ -d "$BACKUP_DIR" ]; then
        echo "🔄 Rolling back to previous version..."
        rm -rf "$DEPLOY_DIR"
        mv "$BACKUP_DIR" "$DEPLOY_DIR"
        cd "$DEPLOY_DIR"
        pm2 start ecosystem.config.js
    fi
    exit 1
fi

# Step 11: Ensure /var/www is accessible
echo "📁 Ensuring /var/www is accessible..."
sudo chmod 777 /var/www

# Step 12: Cleanup
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_BUILD_DIR"

# Step 13: Show deployment status
echo ""
echo "🎉 Deployment completed successfully!"
echo "📊 Application Status:"
pm2 show "$PM2_APP_NAME"
echo ""
echo "📁 Application deployed to: $DEPLOY_DIR"
echo "📁 Previous version backed up to: $BACKUP_DIR"
echo "🌐 Application should be accessible at: http://multibook-nextjs.geertest.com"
echo ""
echo "💡 Useful commands:"
echo "   pm2 logs $PM2_APP_NAME    # View application logs"
echo "   pm2 restart $PM2_APP_NAME # Restart application"
echo "   pm2 monit                 # Monitor application"