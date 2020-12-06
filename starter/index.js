
var http = require('http');
const { spawn } = require('child_process');

var AsyncLock = require('async-lock');
var lock = new AsyncLock({timeout: 500});
var lockKey = "ghost_starting";

var lastOutput = [];

const sleepAmount = 30 * 1000

// Uses https://friendlycaptcha.com

async function run(command, outputArr) {
  return new Promise((resolve, reject) => {
    console.log(`starting ${command}`)
    outputArr.length = 0;
    try {
      let cmd = spawn(command);

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
      const mesg = `ERROR ${command}: failed ${err}`;
      outputArr.push(mesg)
      reject(err);
    }
  })
}

function displayValidationForm(req, res) {
  res.write(`
    <head></head>
    <body>
    <noscript>You need Javascript for CAPTCHA verification to submit this form.</noscript>

    <script type="module" src="https://unpkg.com/friendly-challenge@0.6.1/widget.module.min.js" async defer></script>
    <script nomodule src="https://unnoModulefriendly-challenge@0.6.1/widget.min.js" async defer></script>
    
    <script>
      function myCallback(solution) {
        console.log("Captcha finished with solution " + solution);
      }
    </script>
    
    Your Ghost server is currently stopped.
    <div class="frc-captcha" data-sitekey="FCMQG79GF422P165" data-callback="myCallback"></div>
    
       
    </body>
    `);
  res.end();
}

function displayStatusPage(req, res) {
  res.write(`
  <head><meta http-equiv="refresh" content="10"></head>
  <body>
  <h1>Ghost CMS is starting ...<h1>

  <h2>The page you are trying to reach will load once the service has been restored. You don't need to do anything.
   No page reload, nothing.</h2>
  <h2>As it can take several minutes to wake the service from it's sleeping slumber now would be a good time to take a break.
  A few options for you include:
  head to the bathroom, get some coffee, grab a beer, or call that loved one that you haven't talked in a while.
  </h2>
  `);

  for ( const line of lastOutput) {
    res.write('<br>');
    res.write(line);
  }
  res.write('</body>');
  res.end();
  //end the response


}

function validateRequest(req, res) {

  // IF validated
  displayStatusPage(req, res);

  try {
    await lock.acquire(lockKey, () => { run("./bin/ghost-start", lastOutput)} )
    console.log(`ghost started`)
  } catch (err) {
    console.log(`skipping start, already trying ${err}`);
  }

}

async function onRequest(req, res) {

  // 503 is Temporary Suspended
  res.writeHead(503, "503 Temporary Suspended", {'Content-Type': 'text/html'});

  if ( req.url.startsWith('/ghost') || req.url.endsWith('/edit/') ) {

    displayValidationForm(req, res);

    // TODO Is captcha verify request?
    // IF so verify
    // If verified display output status page

    // TODO if already in authorized request
    // If so output status

    // else
    // Not authorized

  } else {
    res.write(`
      <h2>To auto start the Ghost CMS, use the admin url (hint hint, make sure the path starts with /ghost</h2>
    `);
    res.end(); //end the response
  }

}

http.createServer(onRequest).listen(7777);