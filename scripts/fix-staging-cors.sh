#!/bin/bash

# Script to fix CORS duplicate headers on staging server
# This script removes CORS headers from nginx config and lets NestJS handle them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== CORS Fix for Staging Server =====${NC}"
echo -e "${YELLOW}This script will fix the duplicate CORS headers issue by:${NC}"
echo -e "1. Backing up current nginx configuration"
echo -e "2. Updating nginx to remove CORS headers (letting NestJS handle them)"
echo -e "3. Testing and reloading nginx"
echo ""

# Check if we're on the staging server
HOSTNAME=$(hostname)
if [[ "$HOSTNAME" != *"staging"* && "$HOSTNAME" != *"geertest"* ]]; then
    echo -e "${YELLOW}Warning: This doesn't appear to be the staging server.${NC}"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted.${NC}"
        exit 1
    fi
fi

# Step 1: Backup current nginx configuration
echo -e "${GREEN}Step 1: Backing up current nginx configuration...${NC}"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/jdev/nginx-backups"
mkdir -p "$BACKUP_DIR"

# Backup the current nginx config
sudo cp /etc/nginx/nginx.conf "$BACKUP_DIR/nginx.conf.backup.$BACKUP_DATE" 2>/dev/null || true
sudo cp /etc/nginx/sites-available/* "$BACKUP_DIR/" 2>/dev/null || true
sudo cp /etc/nginx/sites-enabled/* "$BACKUP_DIR/" 2>/dev/null || true

echo -e "${GREEN}✓ Backup created at $BACKUP_DIR${NC}"

# Step 2: Check current nginx configuration
echo -e "${GREEN}Step 2: Checking current CORS headers in nginx...${NC}"
echo "Current CORS-related configuration:"
sudo grep -n "Access-Control" /etc/nginx/nginx.conf 2>/dev/null || \
sudo grep -n "Access-Control" /etc/nginx/sites-enabled/* 2>/dev/null || \
echo "No CORS headers found in main nginx config"

# Step 3: Create temporary fixed configuration
echo -e "${GREEN}Step 3: Creating fixed nginx configuration...${NC}"
TEMP_CONFIG="/tmp/nginx-fixed.conf"

# Copy the fixed configuration
cat > "$TEMP_CONFIG" << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=frontend:10m rate=30r/s;
    
    # Upstream definitions
    upstream backend_upstream {
        server backend:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }
    
    upstream frontend_upstream {
        server frontend:80 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }
    
    # WebSocket upgrade headers map
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name ante.geertest.com backend-ante.geertest.com socket-ante.geertest.com;
        
        # ACME challenge location for Let's Encrypt
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        # Redirect everything else to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }
    
    # Frontend HTTPS server
    server {
        listen 443 ssl http2;
        server_name ante.geertest.com;
        
        # SSL configuration
        ssl_certificate /etc/nginx/ssl/ante.geertest.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/ante.geertest.com/privkey.pem;
        ssl_trusted_certificate /etc/nginx/ssl/ante.geertest.com/chain.pem;
        
        # SSL security settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;
        
        # OCSP stapling
        ssl_stapling on;
        ssl_stapling_verify on;
        resolver 8.8.8.8 8.8.4.4 valid=300s;
        resolver_timeout 5s;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy "strict-origin-when-cross-origin";
        
        # Rate limiting
        limit_req zone=frontend burst=50 nodelay;
        
        # Frontend application
        location / {
            proxy_pass http://frontend_upstream;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $server_name;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                proxy_pass http://frontend_upstream;
                proxy_set_header Host $http_host;
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
    }
    
    # Backend API HTTPS server
    server {
        listen 443 ssl http2;
        server_name backend-ante.geertest.com;
        
        # SSL configuration
        ssl_certificate /etc/nginx/ssl/backend-ante.geertest.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/backend-ante.geertest.com/privkey.pem;
        ssl_trusted_certificate /etc/nginx/ssl/backend-ante.geertest.com/chain.pem;
        
        # SSL security settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;
        ssl_stapling on;
        ssl_stapling_verify on;
        resolver 8.8.8.8 8.8.4.4 valid=300s;
        resolver_timeout 5s;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy "strict-origin-when-cross-origin";
        
        # CORS headers REMOVED - NestJS handles all CORS
        # NestJS backend at port 3000 will provide all necessary CORS headers
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
        # Proxy all requests to NestJS (including OPTIONS)
        location / {
            proxy_pass http://backend_upstream;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $server_name;
            
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
    }
    
    # WebSocket HTTPS server
    server {
        listen 443 ssl http2;
        server_name socket-ante.geertest.com;
        
        # SSL configuration
        ssl_certificate /etc/nginx/ssl/socket-ante.geertest.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/socket-ante.geertest.com/privkey.pem;
        ssl_trusted_certificate /etc/nginx/ssl/socket-ante.geertest.com/chain.pem;
        
        # SSL security settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;
        ssl_stapling on;
        ssl_stapling_verify on;
        resolver 8.8.8.8 8.8.4.4 valid=300s;
        resolver_timeout 5s;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
        
        # WebSocket proxy
        location / {
            proxy_pass http://backend_upstream;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $server_name;
            
            # WebSocket timeout settings
            proxy_connect_timeout 7d;
            proxy_send_timeout 7d;
            proxy_read_timeout 7d;
            
            # No buffering for WebSockets
            proxy_buffering off;
        }
    }
}
EOF

echo -e "${GREEN}✓ Fixed configuration created${NC}"

# Step 4: Test the configuration
echo -e "${GREEN}Step 4: Testing new nginx configuration...${NC}"
sudo nginx -t -c "$TEMP_CONFIG"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Configuration test failed! Aborting.${NC}"
    rm "$TEMP_CONFIG"
    exit 1
fi

echo -e "${GREEN}✓ Configuration test passed${NC}"

# Step 5: Apply the configuration
echo -e "${YELLOW}Step 5: Ready to apply the fixed configuration${NC}"
echo -e "${YELLOW}This will:${NC}"
echo "  1. Replace the current nginx configuration"
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
sudo cp "$TEMP_CONFIG" /etc/nginx/nginx.conf
sudo nginx -s reload

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to reload nginx. Rolling back...${NC}"
    sudo cp "$BACKUP_DIR/nginx.conf.backup.$BACKUP_DATE" /etc/nginx/nginx.conf
    sudo nginx -s reload
    exit 1
fi

# Step 6: Test CORS headers
echo -e "${GREEN}Step 6: Testing CORS headers...${NC}"
echo "Testing OPTIONS request:"
curl -I -X OPTIONS https://backend-ante.geertest.com/auth/login \
  -H "Origin: https://ante.geertest.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" 2>/dev/null | grep -i "access-control" || echo "No CORS headers found"

echo ""
echo "Testing POST request:"
curl -I -X POST https://backend-ante.geertest.com/auth/login \
  -H "Origin: https://ante.geertest.com" \
  -H "Content-Type: application/json" 2>/dev/null | grep -i "access-control" || echo "No CORS headers found"

# Clean up
rm "$TEMP_CONFIG"

echo ""
echo -e "${GREEN}===== CORS Fix Complete =====${NC}"
echo -e "${GREEN}✓ Nginx configuration updated${NC}"
echo -e "${GREEN}✓ CORS headers now handled exclusively by NestJS${NC}"
echo -e "${YELLOW}Note: If you need to rollback, use:${NC}"
echo -e "  sudo cp $BACKUP_DIR/nginx.conf.backup.$BACKUP_DATE /etc/nginx/nginx.conf"
echo -e "  sudo nginx -s reload"