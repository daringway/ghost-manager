
var http = require('http');
const { spawn } = require('child_process');

var AsyncLock = require('async-lock');
var lock = new AsyncLock({timeout: 500});
var lockKey = "ghost_starting";

var lastOutput = undefined;

const sleepAmount = 15 * 1000

async function run(command, outputArr) {
  return new Promise((resolve, reject) => {
    console.log(`starting ${command}`)
    outputArr.length = 0;
    try {
      let cmd = spawn(commond);

      cmd.on('exit', (code, signal) => {
        const mesg = `${command} exited ${code} : ${signal}`;
        outputArr.push(mesg);
        console.log(mesg);
        setTimeout(resolve, sleepAmount);
      })

      cmd.stdout.on('data', function (chunk) {
        outputArr.push(chunk.toString());
      })

      cmd.stderr.on('data', function (chunk) {
        outputArr.push(chunk.toString());
      })

    } catch (err) {
      const mesg = `ERROR ${commond}: failed ${err}`;
      outputArr.push(mesg)
      reject(err);
    }
  })
}

async function onRequest(req, res) {

  res.writeHead(200, {'Content-Type': 'text/html'});

  if ( req.url.startsWith('/ghost') ) {
    res.write(`
    <head><meta http-equiv="refresh" content="10"></head>
    Ghost CMS is starting ...
    
    `);
    for ( const line of lastOutput) {
      res.write(line);
    }
    res.end();
    //end the response

    try {
      await lock.acquire(lockKey, () => { run("./bin/ghost-start", lastOutput)} )
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

}

http.createServer(onRequest).listen(7777);