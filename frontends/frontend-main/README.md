# Ante Frontend Main (ERP Application)

Vue.js + Quasar frontend for the GEER-ANTE ERP system.

**Deployment**: Staging environment configured for automatic deployments.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Yarn package manager
- PM2 (installed globally): `npm install -g pm2`

### Installation
```bash
yarn install
```

### Development with PM2 (Recommended)
```bash
# From project root - starts all services including this frontend
cd ../..
yarn dev

# Or start frontend only (requires backend to be running)
yarn dev
# Runs on http://localhost:9000
```

### Legacy Development (Direct Quasar)
```bash
quasar dev
# or
yarn quasar:dev
```


### Lint the files
```bash
yarn lint
# or
npm run lint
```


### Format the files
```bash
yarn format
# or
npm run format
```



### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

## 📚 Documentation

All frontend documentation has been consolidated to `/documentation/frontend/`:

- **[Supabase Integration Guide](/documentation/frontend/supabase-integration.md)** - Main integration guide
- **[Supabase Guides](/documentation/frontend/supabase/)** - Detailed implementation guides
  - Getting Started, Table Composables, Realtime Integration
  - Component Patterns, CRUD Operations, Advanced Queries
  - Security Best Practices, Troubleshooting

For general documentation, see `/documentation/README.md`
