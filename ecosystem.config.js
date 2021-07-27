
module.exports = {
  apps : [{
    name: 'backup-service',
    script: './backup/index.js',
    watch: ['./backup'],
    instances : 1,
    env : {
    }
  },
  {
    name: 'backup-cron',
    script: "bin/site-backup",
    instances: 1,
    exec_mode: 'fork',
    cron_restart: "*/120 * * * *",
    watch: false,
    autorestart: false
  },
  {
    name: 'cert-renew',
    script: "./bin/ghost-cert-renew",
    instances: 1,
    exec_mode: 'fork',
    cron_restart: "7 */24 * * *",
    watch: false,
    autorestart: false
  }
  ],
};
