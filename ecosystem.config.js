
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
    script: './stopper/index.js',
    watch: ['./stopper'],
    instances : 1,
    env : {
      CHECK_INTERVAL : 300
    }
  }],
};
