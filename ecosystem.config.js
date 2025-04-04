module.exports = {
  apps: [
    {
      name: 'questions-backend',
      script: './backend/bin/questions_backend',
      cwd: './',
      watch: false,
      env: {
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: '3306',
        DB_USER: 'root',
        DB_PASSWORD: 'password',
        DB_NAME: 'questions',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        SERVER_PORT: '8081',
        JWT_SECRET: 'your-secret-key',
        CORS_ALLOWED_ORIGINS: 'http://localhost:3001'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
      instances: 1,
      exec_mode: 'fork',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000
    },
    {
      name: 'questions-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'serve -s dist -l 3001',
      env: {
        NODE_ENV: 'production'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
      instances: 1,
      exec_mode: 'fork',
      out_file: '../logs/frontend-out.log',
      error_file: '../logs/frontend-error.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
}; 