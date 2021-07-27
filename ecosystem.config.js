
module.exports = {
  apps : [{
    name: 'backup-service',
    script: './services/backup/index.js',
    watch: ['./services/backup'],
    instances : 1,
    env : {
    }
  },
  {
    name: 'backup-cron',
    script: "./bin/site-backup",
    interpreter: "bash",
    instances: 1,
    exec_mode: 'fork',
    cron_restart: "*/60 * * * *",
    watch: false,
    autorestart: false
  },
  {
    name: 'cert-renew',
    script: "./bin/ghost-cert-renew",
    interpreter: "bash",
    instances: 1,
    exec_mode: 'fork',
    cron_restart: "7 */24 * * *",
    watch: false,
    autorestart: false
  }
  ],
};
