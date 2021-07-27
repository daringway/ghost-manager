
module.exports = {
  apps : [{
    name: 'backup',
    script: './backup/index.js',
    watch: ['./backup'],
    instances : 1,
    env : {
    }
  },  {
    name: 'backup-sched',
    script: './backup-sched/index.js',
    watch: ['./backup-sched'],
    instances : 1,
    env : {
      INTERVAL : 3600
    }
  }
  ],
};
