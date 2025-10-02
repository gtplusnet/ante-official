module.exports = {
  apps: [
    {
      name: 'ante-backend',
      cwd: './backend',
      script: 'bash',
      args: '-c "npx kill-port 3000 2>/dev/null; npx nest start"',
      // Environment variables will be loaded from .env file
      // Remove hardcoded values to avoid conflicts
      watch: ['src'], // PM2 handles file watching to prevent port conflicts
      ignore_watch: ['node_modules', 'dist', 'logs', '**/*.spec.ts', '.git'],
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      kill_timeout: 5000, // Give process time to clean up before force killing
      wait_ready: false, // Don't wait for ready signal
      stop_exit_codes: [0], // Consider exit code 0 as successful stop
      log_file: './logs/backend.log',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      time: true
    },
    {
      name: 'ante-frontend-main',
      cwd: './frontends/frontend-main',
      script: 'npx',
      args: 'quasar dev',
      // Environment variables will be loaded from .env file
      // Remove hardcoded values to avoid conflicts
      watch: false, // Quasar dev handles its own file watching
      ignore_watch: ['node_modules', 'dist', '.quasar'],
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      restart_delay: 2000,
      log_file: './logs/frontend-main.log',
      error_file: './logs/frontend-main-error.log',
      out_file: './logs/frontend-main-out.log',
      time: true
    }
  ]
};