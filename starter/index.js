
var http = require('http');
const { spawn } = require('child_process');
var url = require('url');
const axios = require('axios')

require('dotenv').config({ path: '.env' })

var AsyncLock = require('async-lock');
var lock = new AsyncLock({timeout: 500});
var lockKey = "ghost_starting";
var captchaVerifyUrl = "https://friendlycaptcha.com/api/v1/siteverify";

var lastOutput = [];
var authorizedList = [];

const sleepAmount = 60 * 1000

// Uses https://friendlycaptcha.com

async function run(command, outputArr) {
  return new Promise((resolve, reject) => {
    console.log(`starting ${command}`)
    outputArr.length = 0;
    outputArr.push('Ghost Server Starting UP.');

    try {
      let cmd = spawn(command);

      cmd.on('exit', (code, signal) => {
        const mesg = `${command} exited ${code} : ${signal}`;
        outputArr.push(mesg);
        console.log(mesg);
        outputArr.push("Waiting on NGINX to notice that the ghost server is up.")
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

async function displayValidationForm(req, res) {
  res.write(`
    <head></head>
    <body>
    <noscript>You need Javascript for CAPTCHA verification to submit this form.</noscript>

    <script type="module" src="https://unpkg.com/friendly-challenge@0.6.1/widget.module.min.js" async defer></script>
    <script nomodule src="https://unpkg.com/friendly-challenge@0.6.1/widget.min.js" async defer></script>
    
    <script>
      function myCallback(solution) {
        document.getElementById("starter").click();
      }
    </script>
    
    <form>
      Your Ghost server is currently stopped.
      <div class="frc-captcha" data-sitekey="${process.env.FRIENDLY_CAPTCHA_SITEKEY}" data-callback="myCallback" data-start="none"></div>
      <input id="starter" type="submit" value="Start Ghost Server" hidden>
    </form>
       
    </body>
    `);
  res.end();
}

async function displayStatusPage(req, res) {
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

async function validateRequest(req, res, solution) {

  axios
    .post(captchaVerifyUrl, {
      solution: solution,
      secret: process.env.FRIENDLY_CAPTCHA_APIKEY,
      sitekey: process.env.FRIENDLY_CAPTCHA_SITEKEY
    })
    .then(frcres => {
      console.log(`statusCode: ${frcres.status}`);
      if (frcres.data && frcres.data.success) {
        displayStatusPage(req, res);
        //  Start
        console.log("starting ghost server")
          try {
            lock.acquire(lockKey, async () => {
                await run("./bin/ghost-start", lastOutput);
                lastOutput = [];
            } );
            console.log(`ghost started`)
          } catch (err) {
            console.log(`skipping start, already trying ${err}`);
          }
      } else {
        displayValidationForm(req, res);
        console.log('error');
      }
    })
    .catch(error => {
      console.error(error)
    })

}

async function onRequest(req, res) {

  // 503 is Temporary Suspended
  res.writeHead(503, "503 Temporary Suspended", {'Content-Type': 'text/html'});

  if ( req.url.startsWith('/ghost') || req.url.indexOf('/edit/') >= 0 ) {

    let parts = url.parse(req.url, true);

    if ( lastOutput.length > 0 ) {
      displayStatusPage(req, res);
    } else if ( parts.query['frc-captcha-solution'] ) {
      console.log("validating", parts.query['frc-captcha-solution']);
      validateRequest(req, res, parts.query['frc-captcha-solution'])
    } else {
      console.log("not validated yet");
      displayValidationForm(req, res);
    }

  } else {
    res.write(`
      <h2>To auto start the Ghost CMS, use the admin url (hint hint, make sure the path starts with /ghost</h2>
    `);
    res.end(); //end the response
  }

}

http.createServer(onRequest).listen(7777);
