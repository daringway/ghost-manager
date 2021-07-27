
module.exports = {
  apps : [{
    name: 'backup',
    script: './backup/index.js',
    watch: ['./backup'],
    instances : 1,
    env : {
    }
  }
  ],
};
