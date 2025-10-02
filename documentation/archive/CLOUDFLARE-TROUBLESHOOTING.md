# Cloudflare Troubleshooting Guide

## Common Issues and Solutions

### 1. Real IP Not Being Captured

**Symptoms:**
- All requests appear to come from Cloudflare IPs
- Geographic restrictions not working properly
- Analytics showing incorrect visitor locations

**Diagnosis:**
```bash
# Check Nginx logs for real IPs
sudo tail -f /var/log/nginx/access.log

# Look for CF-Connecting-IP in requests
curl -I -H "CF-Connecting-IP: 1.2.3.4" http://localhost/health
```

**Solutions:**

1. **Verify Cloudflare IP ranges are current:**
```bash
# Check current ranges
curl -s https://www.cloudflare.com/ips-v4
curl -s https://www.cloudflare.com/ips-v6

# Compare with nginx configuration
grep "set_real_ip_from" /etc/nginx/cloudflare-realip.conf
```

2. **Update IP ranges:**
```bash
# Download and apply latest ranges
./scripts/update-cloudflare-ips.sh
sudo nginx -t && sudo systemctl reload nginx
```

3. **Verify nginx real_ip module:**
```bash
nginx -V 2>&1 | grep -o with-http_realip_module
```

### 2. SSL/TLS Certificate Issues

**Symptoms:**
- SSL errors in browser
- "ERR_SSL_VERSION_OR_CIPHER_MISMATCH" errors
- Certificate warnings

**Diagnosis:**
```bash
# Test SSL connection
openssl s_client -connect ante.geertest.com:443 -servername ante.geertest.com

# Check certificate chain
curl -vI https://ante.geertest.com/ 2>&1 | grep -E "SSL|TLS|certificate"
```

**Solutions:**

1. **For Full (Strict) mode - Generate Origin Certificate:**
   - Go to Cloudflare Dashboard → SSL/TLS → Origin Server
   - Create Certificate with hostnames: `*.geertest.com, geertest.com`
   - Install certificate and private key on origin server

2. **Switch to Flexible SSL temporarily:**
   - Cloudflare Dashboard → SSL/TLS → Overview
   - Change encryption mode to "Flexible"
   - Allows HTTP connection between Cloudflare and origin

3. **Verify certificate installation:**
```bash
# Check certificate files
sudo ls -la /etc/letsencrypt/live/ante.geertest.com/
sudo nginx -t
```

### 3. CORS Issues

**Symptoms:**
- Frontend unable to connect to API
- "Access-Control-Allow-Origin" errors in browser console
- Preflight OPTIONS requests failing

**Diagnosis:**
```bash
# Test CORS headers
curl -I -H "Origin: https://ante.geertest.com" https://backend-ante.geertest.com/health

# Test preflight request
curl -X OPTIONS -I \
  -H "Origin: https://ante.geertest.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://backend-ante.geertest.com/api/test
```

**Solutions:**

1. **Verify CORS headers in nginx configuration:**
```nginx
add_header Access-Control-Allow-Origin "https://ante.geertest.com" always;
add_header Access-Control-Allow-Credentials "true" always;
```

2. **Handle preflight requests properly:**
```nginx
if ($request_method = 'OPTIONS') {
    add_header Access-Control-Allow-Origin "https://ante.geertest.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,token" always;
    add_header Access-Control-Max-Age 1728000 always;
    return 204;
}
```

3. **Cloudflare CORS handling:**
   - Ensure "Automatic HTTPS Rewrites" is disabled if causing issues
   - Check for conflicting Page Rules

### 4. WebSocket Connection Issues

**Symptoms:**
- WebSocket connections fail to establish
- Socket.IO client unable to connect
- "WebSocket connection failed" errors

**Diagnosis:**
```bash
# Test WebSocket endpoint
curl -I -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://socket-ante.geertest.com/socket.io/

# Check backend WebSocket server
curl -I http://localhost:4000/socket.io/
```

**Solutions:**

1. **Verify WebSocket proxy configuration:**
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;
proxy_buffering off;
```

2. **Check Cloudflare WebSocket support:**
   - Ensure domain is proxied (orange cloud)
   - WebSocket works only over HTTPS with Cloudflare
   - No additional configuration needed in Cloudflare dashboard

3. **Test WebSocket server directly:**
```bash
# Test without Cloudflare
echo 'GET /socket.io/ HTTP/1.1\r\nHost: localhost:4000\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n' | nc localhost 4000
```

### 5. 502 Bad Gateway Errors

**Symptoms:**
- "502 Bad Gateway" errors
- Service unavailable messages
- Cloudflare error pages

**Diagnosis:**
```bash
# Check backend service status
sudo systemctl status nginx
docker ps -a | grep ante
docker logs ante-backend-staging

# Test backend directly
curl -I http://localhost:3000/health
curl -I http://localhost:4000/socket.io/
```

**Solutions:**

1. **Check Docker container health:**
```bash
docker inspect ante-backend-staging | grep -A 5 '"Health"'
docker exec ante-backend-staging wget --spider http://localhost:3000/health
```

2. **Verify nginx upstream configuration:**
```nginx
upstream backend_upstream {
    server localhost:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

3. **Check for port conflicts:**
```bash
sudo netstat -tlnp | grep -E ":3000|:4000"
sudo lsof -i :3000
```

### 6. Performance Issues

**Symptoms:**
- Slow response times
- High server load
- Poor cache hit ratios

**Diagnosis:**
```bash
# Check Cloudflare cache status
curl -I https://ante.geertest.com/ | grep cf-cache-status

# Monitor nginx performance
sudo tail -f /var/log/nginx/access.log | grep -E "request_time|upstream_response_time"

# Check backend performance
curl -w "%{time_total}" https://backend-ante.geertest.com/health
```

**Solutions:**

1. **Optimize Cloudflare caching:**
   - Create Page Rules for static assets
   - Enable "Cache Everything" for appropriate paths
   - Set appropriate Browser Cache TTL

2. **Review security settings:**
   - Lower security level if causing excessive challenges
   - Whitelist known good IPs
   - Adjust bot fight mode settings

3. **Nginx optimization:**
```nginx
# Increase worker connections
worker_connections 1024;

# Optimize proxy buffering
proxy_buffering on;
proxy_buffer_size 128k;
proxy_buffers 4 256k;
```

### 7. Mixed Content Errors

**Symptoms:**
- "Mixed Content" warnings in browser
- HTTP resources blocked on HTTPS pages
- Broken assets or API calls

**Diagnosis:**
```bash
# Check for HTTP resources in HTTPS page
curl -s https://ante.geertest.com/ | grep -i "http://"

# Verify protocol in API URLs
grep -r "http://" frontend/src/ --include="*.js" --include="*.vue" --include="*.ts"
```

**Solutions:**

1. **Enable Automatic HTTPS Rewrites:**
   - Cloudflare Dashboard → SSL/TLS → Edge Certificates
   - Enable "Automatic HTTPS Rewrites"

2. **Update application URLs:**
```javascript
// Use protocol-relative URLs or HTTPS
const API_URL = 'https://backend-ante.geertest.com';
const SOCKET_URL = 'wss://socket-ante.geertest.com';
```

3. **Configure nginx to force HTTPS:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 8. Rate Limiting Issues

**Symptoms:**
- "429 Too Many Requests" errors
- Legitimate users being blocked
- API calls failing intermittently

**Diagnosis:**
```bash
# Check Cloudflare rate limiting
curl -I https://backend-ante.geertest.com/health | grep -E "cf-ray|x-ratelimit"

# Check nginx rate limiting
sudo grep "limiting requests" /var/log/nginx/error.log
```

**Solutions:**

1. **Adjust Cloudflare security settings:**
   - Dashboard → Security → Settings
   - Lower security level from "High" to "Medium"
   - Increase challenge passage time

2. **Modify nginx rate limits:**
```nginx
# More permissive rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req zone=api burst=100 nodelay;
```

3. **Whitelist trusted IPs:**
   - Create firewall rules to bypass rate limiting for admin IPs
   - Use Page Rules to exclude specific paths

### 9. Docker Health Check Failures

**Symptoms:**
- Container marked as unhealthy
- Service restarts frequently
- Health check timeouts

**Diagnosis:**
```bash
# Check container health
docker inspect ante-backend-staging | jq '.[0].State.Health'

# Test health check manually
docker exec ante-backend-staging wget --spider http://localhost:3000/health

# Check container logs
docker logs ante-backend-staging --tail 20
```

**Solutions:**

1. **Update health check configuration:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://0.0.0.0:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

2. **Verify health endpoint:**
```bash
# Test health endpoint response
curl -s http://localhost:3000/health | jq .
```

3. **Check container resource limits:**
```bash
docker stats ante-backend-staging
```

### 10. DNS Resolution Issues

**Symptoms:**
- Domain not resolving
- Inconsistent responses
- DNS propagation delays

**Diagnosis:**
```bash
# Check DNS resolution
nslookup ante.geertest.com
dig ante.geertest.com

# Check DNS from different locations
dig @8.8.8.8 ante.geertest.com
dig @1.1.1.1 ante.geertest.com
```

**Solutions:**

1. **Verify Cloudflare DNS settings:**
   - Check A records point to correct IP
   - Ensure proxy status is enabled (orange cloud)
   - Verify DNS record priority

2. **Clear DNS cache:**
```bash
# Clear local DNS cache
sudo systemctl flush-dns
# Or on Ubuntu/Debian
sudo systemd-resolve --flush-caches
```

3. **Check DNS propagation:**
   - Use online tools like whatsmydns.net
   - Wait 24-48 hours for full propagation

## Diagnostic Commands Summary

### Quick Health Check
```bash
# Test all endpoints
curl -I https://ante.geertest.com/
curl -I https://backend-ante.geertest.com/health
curl -I https://socket-ante.geertest.com/socket.io/

# Check service status
docker ps -a | grep ante
sudo systemctl status nginx
```

### Detailed Diagnostics
```bash
# Nginx configuration test
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
docker logs ante-backend-staging --tail 20

# SSL certificate check
openssl s_client -connect ante.geertest.com:443 -servername ante.geertest.com

# WebSocket test
curl -I -H "Connection: Upgrade" -H "Upgrade: websocket" https://socket-ante.geertest.com/
```

## Emergency Rollback Procedure

If issues arise, follow this emergency rollback:

```bash
# 1. Pause Cloudflare (Development Mode)
# Go to Cloudflare Dashboard → Overview → Click "Development Mode"

# 2. Rollback nginx configurations
sudo rm /etc/nginx/sites-enabled/*cloudflare*
sudo ln -s /etc/nginx/sites-available/ante.geertest.com-9000 /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/backend-ante.geertest.com-3000 /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/socket-ante.geertest.com-4000 /etc/nginx/sites-enabled/

# 3. Test and reload
sudo nginx -t && sudo systemctl reload nginx

# 4. Verify services
curl -I http://157.230.246.107/ # Direct IP test
```

## Getting Help

### Cloudflare Support Resources
- **Community Forum**: https://community.cloudflare.com/
- **Documentation**: https://developers.cloudflare.com/
- **Status Page**: https://cloudflarestatus.com/

### Log Files Locations
- **Nginx Access**: `/var/log/nginx/access.log`
- **Nginx Error**: `/var/log/nginx/error.log`
- **Docker Logs**: `docker logs ante-backend-staging`
- **System Logs**: `journalctl -u nginx`

### Contact Information
- **Server Access**: jdev@157.230.246.107
- **Project Repository**: /home/jdev/projects/ante
- **Configuration Backups**: /etc/nginx/sites-available/*.backup

---

**Last Updated**: August 12, 2025  
**Version**: 1.0