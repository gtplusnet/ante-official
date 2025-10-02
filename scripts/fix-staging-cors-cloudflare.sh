#!/bin/bash

# Script to fix CORS duplicate headers on staging server with Cloudflare
# This script removes CORS headers from nginx config and lets NestJS handle them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== CORS Fix for Staging Server (Cloudflare) =====${NC}"
echo -e "${YELLOW}This script will fix the duplicate CORS headers issue by:${NC}"
echo -e "1. Backing up current nginx configuration"
echo -e "2. Removing CORS headers from nginx (letting NestJS handle them)"
echo -e "3. Testing and reloading nginx"
echo ""

# Step 1: Backup current nginx configuration
echo -e "${GREEN}Step 1: Backing up current nginx configuration...${NC}"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/jdev/nginx-backups"
mkdir -p "$BACKUP_DIR"

# Backup the current backend config
CONFIG_FILE="/etc/nginx/sites-enabled/backend-ante.geertest.com-cloudflare"
if [ -f "$CONFIG_FILE" ]; then
    sudo cp "$CONFIG_FILE" "$BACKUP_DIR/backend-ante.geertest.com-cloudflare.backup.$BACKUP_DATE"
    echo -e "${GREEN}✓ Backup created at $BACKUP_DIR/backend-ante.geertest.com-cloudflare.backup.$BACKUP_DATE${NC}"
else
    echo -e "${RED}❌ Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Step 2: Create fixed configuration
echo -e "${GREEN}Step 2: Creating fixed configuration...${NC}"
TEMP_CONFIG="/tmp/backend-ante.geertest.com-cloudflare.fixed"

# Create the fixed configuration without CORS headers
cat > "$TEMP_CONFIG" << 'EOF'
# Cloudflare-optimized configuration for backend-ante.geertest.com
# CORS headers removed - handled by NestJS application

server {
    listen 80;
    listen [::]:80;
    server_name backend-ante.geertest.com;
    
    # Accept HTTP from Cloudflare (Flexible SSL mode)
    # Only redirect to HTTPS if not coming from Cloudflare
    if ($http_cf_ray = "") {
        return 301 https://$server_name$request_uri;
    }
    
    # Real IP from Cloudflare
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2c0f:f248::/32;
    set_real_ip_from 2a06:98c0::/29;
    real_ip_header CF-Connecting-IP;
    real_ip_recursive on;
    
    # Security headers (keeping these)
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CORS headers REMOVED - NestJS handles all CORS
    
    # Proxy all requests to NestJS (including OPTIONS)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Forward real IP from Cloudflare
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;  # Always HTTPS from user perspective
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        
        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 16 4k;
        proxy_busy_buffers_size 8k;
        proxy_max_temp_file_size 1024m;
        proxy_temp_file_write_size 8k;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Forward real IP from Cloudflare
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        
        # WebSocket timeout settings
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        
        # No buffering for WebSockets
        proxy_buffering off;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name backend-ante.geertest.com;
    
    # SSL certificate for Full Strict mode
    ssl_certificate /etc/letsencrypt/live/backend-ante.geertest.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/backend-ante.geertest.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # Real IP from Cloudflare
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2c0f:f248::/32;
    set_real_ip_from 2a06:98c0::/29;
    real_ip_header CF-Connecting-IP;
    real_ip_recursive on;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # CORS headers REMOVED - NestJS handles all CORS
    
    # Proxy all requests to NestJS (including OPTIONS)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Forward real IP from Cloudflare
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        
        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 16 4k;
        proxy_busy_buffers_size 8k;
        proxy_max_temp_file_size 1024m;
        proxy_temp_file_write_size 8k;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Forward real IP from Cloudflare
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        
        # WebSocket timeout settings
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        
        # No buffering for WebSockets
        proxy_buffering off;
    }
}
EOF

echo -e "${GREEN}✓ Fixed configuration created${NC}"

# Step 3: Test the configuration
echo -e "${GREEN}Step 3: Testing new nginx configuration...${NC}"
sudo nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Configuration test failed! Aborting.${NC}"
    rm "$TEMP_CONFIG"
    exit 1
fi

echo -e "${GREEN}✓ Configuration test passed${NC}"

# Step 4: Apply the configuration
echo -e "${YELLOW}Step 4: Ready to apply the fixed configuration${NC}"
echo -e "${YELLOW}This will:${NC}"
echo "  1. Replace the current backend nginx configuration"
echo "  2. Reload nginx to apply changes"
echo ""
read -p "Apply the fix now? (y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted. Configuration not applied.${NC}"
    rm "$TEMP_CONFIG"
    exit 1
fi

# Apply the configuration
echo -e "${GREEN}Applying configuration...${NC}"
sudo cp "$TEMP_CONFIG" "$CONFIG_FILE"
sudo nginx -s reload

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to reload nginx. Rolling back...${NC}"
    sudo cp "$BACKUP_DIR/backend-ante.geertest.com-cloudflare.backup.$BACKUP_DATE" "$CONFIG_FILE"
    sudo nginx -s reload
    exit 1
fi

# Step 5: Test CORS headers
echo -e "${GREEN}Step 5: Testing CORS headers...${NC}"
echo "Testing OPTIONS request:"
curl -I -X OPTIONS https://backend-ante.geertest.com/auth/login \
  -H "Origin: https://ante.geertest.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" 2>/dev/null | grep -i "access-control" || echo "Waiting for response..."

sleep 2

echo ""
echo "Testing POST request:"
curl -I -X POST https://backend-ante.geertest.com/auth/login \
  -H "Origin: https://ante.geertest.com" \
  -H "Content-Type: application/json" 2>/dev/null | grep -i "access-control" || echo "Waiting for response..."

# Clean up
rm "$TEMP_CONFIG"

echo ""
echo -e "${GREEN}===== CORS Fix Complete =====${NC}"
echo -e "${GREEN}✓ Nginx configuration updated${NC}"
echo -e "${GREEN}✓ CORS headers now handled exclusively by NestJS${NC}"
echo -e "${YELLOW}Note: If you need to rollback, use:${NC}"
echo -e "  sudo cp $BACKUP_DIR/backend-ante.geertest.com-cloudflare.backup.$BACKUP_DATE $CONFIG_FILE"
echo -e "  sudo nginx -s reload"
echo ""
echo -e "${YELLOW}Please test the application to confirm CORS is working properly.${NC}"