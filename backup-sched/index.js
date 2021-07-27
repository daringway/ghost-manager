var io = require('@pm2/io')

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const interval = Number(process.env.INTERVAL) || 60 * 60;
const sleepAmount = interval  * 1000;

let wakeUpTimestamp = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

var metric = io.metric({
  name    : 'Next Check (s)',
  value   : function() {
    return (wakeUpTimestamp - new Date().getTime() ) / 1000
  }
})

async function loop() {
  do {
    wakeUpTimestamp = new Date().getTime() + sleepAmount
    await sleep(sleepAmount);

    try {
      const {stdout, stderr} = await exec('./site-backup', {cwd: './bin'});
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.log(`error backing up: ${stderr}`);
      }
    } catch (err) {
      console.log(`caught error backing up ${err}`);
    }

  } while (true) ;
}

loop()
