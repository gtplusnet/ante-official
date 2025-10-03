#!/bin/bash

# Script to create Redis droplet on DigitalOcean
# Run this manually if doctl has auth issues

echo "=== Redis Droplet Creation Script ==="
echo ""
echo "Please create a droplet manually with these specs:"
echo ""
echo "Name: redis-shared"
echo "OS: Ubuntu 24.04 LTS"
echo "Plan: Basic"
echo "Size: Regular - 1 GB / 1 vCPU / 25 GB SSD / 1000 GB transfer ($6/mo)"
echo "Region: Singapore 1 (SGP1) - or same region as your apps"
echo "Additional options:"
echo "  ✓ Enable monitoring"
echo "  ✓ Add your SSH key"
echo ""
echo "Tags: redis, shared, production, staging"
echo ""
echo "After creation, run this script with the droplet IP:"
echo "  ./create-redis-droplet.sh <DROPLET_IP>"
echo ""

if [ -z "$1" ]; then
    echo "Waiting for droplet IP..."
    exit 0
fi

DROPLET_IP=$1
echo "Testing SSH connection to $DROPLET_IP..."

if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new root@$DROPLET_IP "echo 'SSH connected successfully'"; then
    echo ""
    echo "✓ SSH connection successful!"
    echo ""
    echo "Next step: Run the Redis installation script"
    echo "  ssh root@$DROPLET_IP < scripts/install-redis.sh"
else
    echo ""
    echo "✗ SSH connection failed. Please check:"
    echo "  1. Droplet is fully provisioned (wait 2-3 minutes)"
    echo "  2. SSH key was added during creation"
    echo "  3. Firewall allows SSH from your IP"
fi
