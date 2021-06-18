var io = require('@pm2/io')

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const checkInterval = Number(process.env.CHECK_INTERVAL) || 5 * 60;
const sleepAmount = checkInterval  * 1000;

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
    try {
      const {stdout, stderr} = await exec('./stopper', {cwd: './bin'});
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.log(`error stopping ghost: ${stderr}`);
      }
    } catch (err) {
      console.log(`caught error stopping ${err}`);
    }

    wakeUpTimestamp = new Date().getTime() + sleepAmount
    await sleep(sleepAmount);
  } while (true) ;
}

loop()
