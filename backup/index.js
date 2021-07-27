var http = require('http');

const { spawn } = require('child_process');

var AsyncLock = require('async-lock');
var lock = new AsyncLock();
var lockKey = "ghost_starting";

let backup = null;

async function publish() {
  if ( backup ) {
    console.log('killing backup')
    await backup.kill('SIGKILL')
  }

  console.log('publishing website');
  backup = spawn('./bin/site-backup');

  backup.on('exit', (code, signal) => {
    console.log(`backup exited ${code} : ${signal}`)
    backup = null
  })
  backup.stdout.on('data', function (chunk) {
    console.log(chunk.toString());
  })
  backup.stderr.on('data', function (chunk) {
    console.log(chunk.toString());
  })

  console.log("backup returning control")
}

//create a server object:
http.createServer(async function (req, res) {
  console.log('starting backup process');
  res.end(); //end the response

  try {
    await lock.acquire(lockKey, publish)
    console.log(`backup started`)
  } catch (err) {
    console.log(`failed to acquire publishing lock ${err}`);
  }

}).listen(8888); //the server object listens on port 8080
