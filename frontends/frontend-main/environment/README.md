# Environment Configuration Files

This folder contains environment-specific configuration files for different deployment environments.

## Files

- `env.staging` - Configuration for staging environment
- `env.production` - Configuration for production environment

Note: These files don't have a dot prefix to avoid any potential issues with Docker or other tools that might have special handling for `.env` files.

## Usage

During deployment, the appropriate file is copied to the frontend root as `.env` before building:

- For staging: `cp environment/env.staging .env`
- For production: `cp environment/env.production .env`

## Important Notes

1. These files are tracked in git to ensure consistent deployments
2. The root `.env` file is gitignored and should only exist locally
3. Never put sensitive secrets in these files - use environment variables on the server instead

## Local Development

For local development, create a `.env` file in the frontend root directory based on `.env.example`.