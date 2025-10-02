module.exports = {
  apps: [{
    name: 'guardian-app',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/jdev/projects/geer-guardian-app/frontends/guardian',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5011,
      NEXT_PUBLIC_API_URL: 'https://backend-guardian-app.geertest.com',
      NEXT_PUBLIC_API_VERSION: 'v1',
      NEXT_PUBLIC_COMPANY_ID: '16',
      NEXT_PUBLIC_APP_NAME: 'Geer Guardian',
      NEXT_PUBLIC_APP_VERSION: '1.0.0',
      NEXT_PUBLIC_ENABLE_BIOMETRIC_AUTH: 'false',
      NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: 'true',
      NEXT_PUBLIC_SOCKET_URL: 'https://socket-ante.geertest.com'
    },
    error_file: 'logs/guardian-app-error.log',
    out_file: 'logs/guardian-app-out.log',
    log_file: 'logs/guardian-app-combined.log',
    time: true,
    max_memory_restart: '500M'
  }]
}