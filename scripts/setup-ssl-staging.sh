#!/usr/bin/env bash

# Enable error handling
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print messages
print_message() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

print_info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

STAGING_SERVER="jdev@157.230.246.107"
EMAIL="admin@geertest.com"
DOMAINS=(
    "ante.geertest.com"
    "backend-ante.geertest.com" 
    "socket-ante.geertest.com"
)

print_message "Setting up SSL certificates for staging domains..."
print_info "Email: $EMAIL"
print_info "Domains: ${DOMAINS[@]}"

# Ask for confirmation
read -p "Proceed with SSL certificate setup? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_message "SSL setup cancelled"
    exit 1
fi

print_message "Setting up SSL certificates on staging server..."

ssh "$STAGING_SERVER" << EOF
    set -e
    
    # Colors for remote output
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    
    print_message() { echo -e "\${YELLOW}\$1\${NC}"; }
    print_error() { echo -e "\${RED}ERROR: \$1\${NC}"; }
    print_success() { echo -e "\${GREEN}SUCCESS: \$1\${NC}"; }
    print_info() { echo -e "\${BLUE}INFO: \$1\${NC}"; }
    
    print_message "Step 1: Installing Certbot..."
    if ! command -v certbot &> /dev/null; then
        sudo apt update
        sudo apt install -y certbot
        print_success "Certbot installed"
    else
        print_info "Certbot already installed"
    fi
    
    print_message "Step 2: Creating SSL directories..."
    sudo mkdir -p /etc/nginx/ssl/{ante.geertest.com,backend-ante.geertest.com,socket-ante.geertest.com}
    sudo mkdir -p /var/www/certbot
    sudo chown -R www-data:www-data /var/www/certbot
    
    print_message "Step 3: Creating temporary Nginx config for ACME challenge..."
    sudo tee /etc/nginx/sites-available/certbot-temp << 'NGINXEOF'
server {
    listen 80;
    server_name ante.geertest.com backend-ante.geertest.com socket-ante.geertest.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'SSL setup in progress';
        add_header Content-Type text/plain;
    }
}
NGINXEOF
    
    print_message "Step 4: Enabling temporary Nginx config..."
    sudo ln -sf /etc/nginx/sites-available/certbot-temp /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    if sudo nginx -t; then
        sudo systemctl reload nginx
        print_success "Temporary Nginx configuration loaded"
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
    
    print_message "Step 5: Obtaining SSL certificates..."
    
    # Get certificates for all domains
    for domain in ante.geertest.com backend-ante.geertest.com socket-ante.geertest.com; do
        print_info "Getting certificate for \$domain..."
        
        sudo certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            --force-renewal \
            -d "\$domain"
        
        if [ \$? -eq 0 ]; then
            print_success "Certificate obtained for \$domain"
            
            # Copy certificates to nginx ssl directory
            sudo cp "/etc/letsencrypt/live/\$domain/fullchain.pem" "/etc/nginx/ssl/\$domain/"
            sudo cp "/etc/letsencrypt/live/\$domain/privkey.pem" "/etc/nginx/ssl/\$domain/"
            sudo cp "/etc/letsencrypt/live/\$domain/chain.pem" "/etc/nginx/ssl/\$domain/"
            
            # Set proper permissions
            sudo chmod 644 "/etc/nginx/ssl/\$domain/fullchain.pem"
            sudo chmod 644 "/etc/nginx/ssl/\$domain/chain.pem"
            sudo chmod 600 "/etc/nginx/ssl/\$domain/privkey.pem"
            sudo chown root:root "/etc/nginx/ssl/\$domain/"*
            
            print_success "Certificate files copied for \$domain"
        else
            print_error "Failed to obtain certificate for \$domain"
            exit 1
        fi
    done
    
    print_message "Step 6: Setting up certificate renewal..."
    # Create renewal script
    sudo tee /usr/local/bin/renew-ante-certs.sh << 'RENEWEOF'
#!/bin/bash
/usr/bin/certbot renew --quiet
for domain in ante.geertest.com backend-ante.geertest.com socket-ante.geertest.com; do
    if [ -f "/etc/letsencrypt/live/\$domain/fullchain.pem" ]; then
        cp "/etc/letsencrypt/live/\$domain/fullchain.pem" "/etc/nginx/ssl/\$domain/"
        cp "/etc/letsencrypt/live/\$domain/privkey.pem" "/etc/nginx/ssl/\$domain/"
        cp "/etc/letsencrypt/live/\$domain/chain.pem" "/etc/nginx/ssl/\$domain/"
        chmod 644 "/etc/nginx/ssl/\$domain/fullchain.pem"
        chmod 644 "/etc/nginx/ssl/\$domain/chain.pem"
        chmod 600 "/etc/nginx/ssl/\$domain/privkey.pem"
    fi
done
systemctl reload nginx
RENEWEOF
    
    sudo chmod +x /usr/local/bin/renew-ante-certs.sh
    
    # Add to crontab for automatic renewal
    (sudo crontab -l 2>/dev/null || true; echo "0 0,12 * * * /usr/local/bin/renew-ante-certs.sh") | sudo crontab -
    
    print_message "Step 7: Removing temporary Nginx config..."
    sudo rm -f /etc/nginx/sites-enabled/certbot-temp
    sudo systemctl reload nginx
    
    print_success "SSL certificates setup completed!"
    print_info "Certificates are ready for:"
    for domain in ante.geertest.com backend-ante.geertest.com socket-ante.geertest.com; do
        print_info "  - \$domain"
    done
    print_info "Automatic renewal is configured via cron"
    
    print_message "Step 8: Verifying certificates..."
    for domain in ante.geertest.com backend-ante.geertest.com socket-ante.geertest.com; do
        if sudo certbot certificates | grep -q "\$domain"; then
            print_success "Certificate verified for \$domain"
        else
            print_error "Certificate verification failed for \$domain"
        fi
    done
EOF

if [ $? -eq 0 ]; then
    print_success "SSL certificates setup completed successfully!"
    print_info "All domains now have valid SSL certificates"
    print_message "Next steps:"
    print_info "1. Update your Docker nginx configuration to use HTTPS"
    print_info "2. Test the certificates: openssl s_client -connect ante.geertest.com:443"
    print_info "3. Deploy the Docker containers with SSL enabled"
else
    print_error "SSL setup failed!"
    exit 1
fi