/** @type {import('pm2').ProcessDescription[]} */
module.exports = {
  apps: [
    {
      name: "crm-mondial-home",
      script: "node",
      args: "server.js",
      cwd: "/var/www/crm-mondial-home/.next/standalone",
      instances: 1,
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      error_file: "/var/log/pm2/crm-error.log",
      out_file: "/var/log/pm2/crm-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "512M",
      restart_delay: 5000,
      max_restarts: 10,
    },
    {
      name: "crm-workers",
      script: "tsx",
      args: "src/server/workers/index.ts",
      cwd: "/var/www/crm-mondial-home",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
      },
      error_file: "/var/log/pm2/workers-error.log",
      out_file: "/var/log/pm2/workers-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "256M",
      restart_delay: 5000,
    },
  ],
};
