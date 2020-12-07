
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

// {"forceJSFallback":false,"startMode":"focus","puzzleEndpoint":"https://friendlycaptcha.com/api/v1/puzzle"},"e":{},"puzzle":{"signature":"c9f17d5f90726dbe6e497245693be18e","base64":"X81pNqgdMHkELITFAWQUiAAAAAAAAAAAJMzw+Z9MAZI=","buffer":{"0":95,"1":205,"2":105,"3":54,"4":168,"5":29,"6":48,"7":121,"8":4,"9":44,"10":132,"11":197,"12":1,"13":100,"14":20,"15":136,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":36,"25":204,"26":240,"27":249,"28":159,"29":76,"30":1,"31":146},"n":20,"threshold":32765,"expiry":30000000}}

async function displayValidationForm(req, res) {
  res.write(`
    <head></head>
    <body>
    <noscript>You need Javascript for CAPTCHA verification to submit this form.</noscript>

    <script nomodule src="https://unnoModulefriendly-challenge@0.6.1/widget.min.js" async defer></script>
    
    <script>
      function myCallback(solution) {
        console.log("Captcha finished with solution " + JSON.stringify(solution));
      }
    </script>
    
    <form>
      Your Ghost server is currently stopped.
      <div class="frc-captcha" data-sitekey="${process.env.FRIENDLY_CAPTCHA_SITEKEY}" data-callback="myCallback" startMode="none"></div>
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

async function validateRequest(req, res, parts) {
  // console.log("validating", parts.query['frc-captcha-solution']);

  // await axios
  //   .post( captchaVerifyUrl, {
  //     solution: parts.query['frc-captcha-solution'],
  //     secret: proces.env.FRIENDLY_CAPTCHA_APIKEY,
  //     sitekey: process.env.FRIENDLY_CAPTCHA_SITEKEY
  //   })
  //   .then(res => {
  //     console.log(`statusCode: ${res.statusCode}`)
  //     console.log(res)
  //   })
  //   .catch(error => {
  //     console.error(error)
  //   })


  // IF validated
  // displayStatusPage(req, res);

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

    let parts = url.parse(req.url, true);
    console.log('entering:', JSON.stringify(parts));
    if ( parts.query['frc-captcha-solution'] ) {
      console.log('validating');
      res.end()
      validateRequest(req,res, parts);
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