# Security Guidelines

## Environment Variables

This application uses environment variables to manage sensitive configuration. 

### Setup
1. Copy `.env.example` to `.env`
2. Update the values with your actual configuration
3. Never commit `.env` files to the repository

### Connection Configuration
1. Copy `connections.example.json` to `connections.json`
2. Update with your actual API endpoints
3. The `connections.json` file is git-ignored and should never be committed

## Security Best Practices

### Never Commit
- `.env` files
- `connections.json` with real URLs
- API keys or secrets
- OAuth client secrets
- Private certificates
- User credentials

### Always Use
- Environment variables for sensitive data
- HTTPS in production
- WSS (WebSocket Secure) for socket connections
- Strong, unique secrets for JWT tokens

### Development
- Use placeholder values in example files
- Keep production URLs out of source code
- Use environment-specific configurations

### Deployment
- Set environment variables through your deployment platform
- Use secrets management services when available
- Rotate secrets regularly
- Monitor for exposed credentials

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

## Dependencies

Regularly update dependencies to patch security vulnerabilities:
```bash
yarn audit
yarn upgrade
```