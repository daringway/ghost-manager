
var http = require('http');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

var AsyncLock = require('async-lock');
var lock = new AsyncLock({timeout: 500});
var lockKey = "ghost_starting";

var sleepAmount = 15 * 1000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function start() {
  console.log('Starting Ghost Server');
  // TODO env variables
  try {
    const {stdout, stderr} = await exec('./ghost-start', {cwd: './bin'});
    await sleep(sleepAmount);
    if (stderr) {
      console.log(`error starting ghost: ${stderr}`)
    }
  } catch (err) {
    console.log(`caught error trying to start ${err}`)
  }
}

//create a server object:
http.createServer(async function (req, res) {

  res.writeHead(200, {'Content-Type': 'text/html'});

  if ( req.url.startsWith('/ghost') ) {
    res.write(`
    <head><meta http-equiv="refresh" content="10"></head>
    Ghost CMS is starting ...
    `);
    res.end(); //end the response

    try {
      await lock.acquire(lockKey, start)
      console.log(`ghost started`)
    } catch (err) {
      console.log(`skipping start, already trying ${err}`);
    }
  } else {
    res.write(`
      To auto start the Ghost CMS, use the admin url (hint hint, make sure the path starts with /ghost
    `);
    res.end(); //end the response
  }

}).listen(7777);