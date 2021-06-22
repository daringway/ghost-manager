
module.exports = {
  apps : [{
    name: 'publisher',
    script: './publisher/index.js',
    watch: ['./publisher'],
    instances : 1,
    env : {
    }
  }, {
    name: 'starter',
    script: './starter/index.js',
    watch: ['./starter'],
    instances : 1,
    env : {
    }
  }, {
    name: 'stopper',
    script: './bin/ghost-stop',
    instances : 1,
    exec_mode: 'fork',
    cron: "*/15 * * * *",
    autorestart: false
  }, {
    name: "update_settings",
    script: "./update.sh",
    exec_mode: 'fork',
    instances : 1,
    cron: "2 * * * *",
    autorestart: false
  }

  ],
};
