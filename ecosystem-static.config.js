
module.exports = {
  apps : [{
    name: 'publisher',
    script: './services/publisher/index.js',
    watch: ['./services/publisher'],
    instances : 1,
    env : {
    }
  }, {
    name: 'starter',
    script: './services/starter/index.js',
    watch: ['./services/starter'],
    instances : 1,
    env : {
    }
  }, {
    name: 'stopper',
    script: './services/stopper/index.js',
    watch: ['./services/stopper'],
    instances : 1,
    env : {
      CHECK_INTERVAL : 300
    }
  }
  ],
};
