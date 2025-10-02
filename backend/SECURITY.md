# Security Guidelines for Ante Backend

## Environment Variables

All sensitive configuration must be managed through environment variables.

### Setup
1. Copy `.env.example` to `.env`
2. Update all values with your actual configuration
3. Never commit `.env` files to the repository
4. Use strong, unique values for all secrets

## Security Checklist

### Database
- [ ] Use strong database passwords
- [ ] Enable SSL for database connections in production
- [ ] Regular database backups
- [ ] Limit database user permissions

### Authentication & Authorization
- [ ] Strong JWT secret (minimum 32 characters)
- [ ] Implement refresh tokens
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Password complexity requirements

### API Security
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention
- [ ] CSRF protection

### File Uploads
- [ ] File type validation
- [ ] File size limits
- [ ] Virus scanning (in production)
- [ ] Store uploads outside web root
- [ ] Use cloud storage (S3) in production

### Secrets Management
- [ ] Never hardcode secrets
- [ ] Use environment variables
- [ ] Rotate secrets regularly
- [ ] Use secrets management service in production
- [ ] Different secrets for each environment

### Dependencies
- [ ] Regular dependency updates
- [ ] Security audit: `yarn audit`
- [ ] Use exact versions in package.json
- [ ] Review new dependencies before adding

### Logging & Monitoring
- [ ] Don't log sensitive data
- [ ] Implement security monitoring
- [ ] Set up alerts for suspicious activity
- [ ] Regular security audits

## Never Commit

The following should NEVER be in version control:
- `.env` files (except `.env.example`)
- Private keys (*.key, *.pem)
- Certificates (except public certs)
- Database dumps with real data
- AWS credentials
- API keys and secrets
- User data or PII
- Production configuration files

## Development Security

### Local Development
- Use different credentials than production
- Don't use production data locally
- Use Docker for isolated environments
- Regular security training

### Code Review
- Security review for all PRs
- Check for hardcoded secrets
- Validate input handling
- Review authentication logic

## Production Deployment

### Pre-deployment
- [ ] Security scan
- [ ] Dependency audit
- [ ] Remove debug code
- [ ] Update dependencies
- [ ] Test security features

### Infrastructure
- [ ] Use HTTPS only
- [ ] Enable firewall
- [ ] Regular OS updates
- [ ] Intrusion detection
- [ ] DDoS protection

### Monitoring
- [ ] Real-time alerts
- [ ] Log aggregation
- [ ] Performance monitoring
- [ ] Security scanning
- [ ] Incident response plan

## Reporting Security Issues

For security vulnerabilities:
1. Do NOT create a public issue
2. Email: security@example.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Compliance

Ensure compliance with:
- GDPR (if handling EU data)
- PCI DSS (if handling payments)
- HIPAA (if handling health data)
- Local data protection laws

## Security Tools

Recommended tools:
```bash
# Dependency scanning
yarn audit
npm audit

# Code scanning
# Consider integrating: Snyk, SonarQube, GitHub Security

# Secret scanning
# Use git-secrets or similar

# OWASP dependency check
# Regular penetration testing
```

## Update Schedule

- Daily: Check for critical security updates
- Weekly: Review security logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Yearly: Penetration testing