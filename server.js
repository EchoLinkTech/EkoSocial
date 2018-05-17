/**
 * This is an Express server that performs the following two functions:
 * 1. Host the Javascript required for interacting with Metamask and
 *    signing LinkedIn profile.
 *    https://localhost:1337/injection.js
 *
 * 2. Validate LinkedIn profile through Metamask public key.
 *    https://localhost:1337/callback
 */

const express = require('express');
var https = require('https');
var pem = require('pem');
const argv = require('./argv');
const port = require('./port');
const isDev = process.env.NODE_ENV !== 'production';
const ngrok = require('ngrok');
var fs = require('fs');
var path = require('path');
var url = require('url');
var parser = require('json-parser');
var sigUtil = require('eth-sig-util');
var ethUtil = require('ethereumjs-util')

//////////////////////////////////////////////////////////////
// Below are the linkedin API credentials that can be used to authenticate Echolink backend with LinkedIn API 
var APIKey = "773uvp91vm45p4";
var APIKeySecret = "xRwy9ExUtJGLdHNm";
var callbackURL = "https://localhost:1337/callback/";
var APIVersion = "v1";

// Below variable describes the scope of the data access.Since basic access is available without vetting we have used it. It can be changed if needed.
var APIScope = 'r_basicprofile';

// Create certificate for https website.
pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
  if (err) {
    throw err
  }
  const app = express();

  // get the intended host and port number, use localhost and port 3000 if not provided
  const customHost = argv.host || process.env.HOST;
  const host = customHost || null; // Let http.Server use its default IPv6/4 host
  const prettyHost = customHost || 'localhost';

  app.use(function(req, res, next) {
    res.setHeader("Content-Security-Policy", "script-src 'self' https://localhost:1337 https://platform.linkedin.com https://www.linkedin.com 'unsafe-inline'");
    return next();
  });

  // Host verification website.
  app.get('/callback/*', linkedinFunc);
  
  // Host Javascript for profile signing
  app.get('/injection.js', (req, res) => res.sendFile(path.resolve(__dirname, 'injection.js')));

  // Host Javascript for profile verification
  app.get('/verification.js', (req, res) => res.sendFile(path.resolve(__dirname, 'verification.js')));

  https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(port);
});

/**
 * The function that handles incoming verification request. If Access token is
 * absent, this server will call LinkedIn for access granting page. If the access
 * token is present, this server will call LinkedIn to access the requester's 
 * LinkedIn profile data.
 *
 * @param req Request object of the verification requester.
 * @param response The response object for this request.
 */
var linkedinFunc = function(req, response) {
  // Make sure the browser isn't requesting a /favicon.ico
  console.log(req.url);
  if (req.url !='/favicon.ico') {
    var pKey = req.url.split("/")[2];

    // Check to see if authorization for end user has already been made and in that case skip the oAuth dance
    var cookies = {};
      req.headers.cookie && req.headers.cookie.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
      });
    
    // If we have the access_token in the cookie skip the Oauth authentication
    if (cookies['LIAccess_token']){
      // STEP 3 - Get LinkedIn API Data and validate the data with public key.
      // console.log("we have the cookie value" + cookies['LIAccess_token']);
      OauthStep3(req, response, cookies['LIAccess_token'], APICalls['myProfile'], null, pKey);
    
    } else {  
      var queryObject = url.parse(req.url, true).query;

      if (!queryObject.code) {
        // STEP 1 - If this is the first run send them to LinkedIn for Auth
        OauthStep1(req, response);
      } else {
        // STEP 2 - If they have given consent and are at the callback do the final token request
        OauthStep2(req, response, queryObject.code);
      }
    }
  }
}

/**
 * Generate a random string as session ID.
 *
 * @param howLong The length of the desired session ID. Default is 18 characters.
 * @return The string session ID.
 */
var RandomState = function(howLong) {
  howLong=parseInt(howLong);
  
  if (!howLong || howLong<=0) {
    howLong=18;
  }
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";

  for (var i = 0; i < howLong; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Oauth Step 1 - Redirect end-user for authorization.
 *
 * @param req The request object.
 * @param response The response object.
 */
var OauthStep1 = function(req, response) {
  console.log("Step1");

  response.writeHead(302, {
    'Location': 'https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=' + APIKey + '&scope=' + APIScope + '&state=RNDM_' + RandomState(18) + '&redirect_uri=' + callbackURL
  });
  response.end();
};

/**
 * Oauth Step 2 - The callback post authorization.
 *
 * @param request The request object.
 * @param response The response object.
 * @param code The code of thee post request.
 */
var OauthStep2 = function(request, response, code) {
  console.log("Step2");

  var options = {
    host: 'api.linkedin.com',
    port: 443,
    path: "/uas/oauth2/accessToken?grant_type=authorization_code&code=" + code + "&redirect_uri=" + callbackURL + "&client_id=" + APIKey + "&client_secret=" + APIKeySecret
  };

  var req = https.request(options, function(res) {
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);

    res.on('data', function(d) {
      // STEP 3 - Get LinkedIn API Data
      // We have successfully completed Oauth and have received our access_token.  Congrats! 
      // Now let's make a real API call (Example API call referencing APICalls['peopleSearchWithKeywords'] below)
      // See more example API Calls at the end of this file
      
      access_token = JSON.parse(d).access_token;
      
      var ExpiresIn29days = new Date();
      ExpiresIn29days.setDate(ExpiresIn29days.getDate() + 29);
      response.writeHead(200, {
        'Set-Cookie':'LIAccess_token=' + access_token + '; Expires=' + ExpiresIn29days
      });
          
      OauthStep3(request, response, access_token, APICalls['myProfile']);
    });
  });

  req.on('error', function(e) {
    console.error("There was an error with our Oauth Call in Step 2: " + e);
    response.end("There was an error with our Oauth Call in Step 2");
  });
  req.end();
};

/**
 * Oauth Step 3 - This step does the real API call for authenticating with LinkedIn.
 *
 * @param request The request obect.
 * @param response The response object.
 * @param access_token The token for the data access for LinkedIn profile.
 * @param APICall List of column names for the requested profile data.
 * @param callback Optional callback function.
 * @param pKey public key of the user
 */
var OauthStep3 = function(request, response, access_token, APICall, callback, pKey) {

    console.log("Step3");
    // console.log(request);

    if (APICall.indexOf("?")>=0) {
      var JSONformat="&format=json";
    } else {
      var JSONformat="?format=json";
    }
    
    var options = {
      host: 'api.linkedin.com',
      port: 443,
      path: '/'+APIVersion+'/' + APICall + JSONformat + "&oauth2_access_token=" + access_token
    };

    var req = https.request(options, function(res) {
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);
      // response.write(`<script type="text/javascript" src="//platform.linkedin.com/in.js">api_key: [${APIKey}]</script>`);
      
      // Inject front-end code for verification
      response.write('<script type="text/javascript" src="https://localhost:1337/verification.js"></script>');

      res.on('data', function(d) {
        // We have LinkedIn data!  Process it and continue with your application here
        // apiResponse =JSON.parse(d)
        if (!pKey) {
          response.write("Login Metamask account and click verify");
        } else {
            var linkedinProfile = parser.parse(d);
            console.log(linkedinProfile);
            var summaryData = linkedinProfile['summary'].split("|");
          if (summaryData.length > 1) {
            var publicKey = summaryData[1];
            var signature = summaryData[2];
            // Validate signature
            console.log(d.toString().replace("|" + signature, ""));
            var data = d.toString().replace("|" + signature, "");
            if (verify(data, signature, pKey)) {
              response.write(generateProfileDisplay(linkedinProfile, pKey));
            } else {
              response.write(
              `<h3>Verification Failed!</h3>
                <p>Failed to verify public key "${pKey}" with requested profile, not the right public key holder!</p>
              `);
            }
          } else {
            response.write('<p>You need to sign your LinkedIn profile</p>');
          }
        }
        response.end('<br/><button id="verify">Verify</button>');
      });
    });
    
    req.on('error', function(e) {
      console.error("There was an error with our LinkedIn API Call in Step 3: " + e);
      response.end("There was an error with our LinkedIn API Call in Step 3");
    });
    req.end();
};

var generateProfileDisplay = function(linkedinProfile, pKey) {
  var toReturn =   `
    <h3>Verification successful!</h3>
    <p>Established mapping between public key "${pKey}" and the following profile:</p>
    <p>Name: ${linkedinProfile.firstName} ${linkedinProfile.lastName}</p>
    <p>LinkedIn ID: ${linkedinProfile.publicProfileUrl.split("/")[4]}</p>
    <p>Headline: ${linkedinProfile.headline}</p>
  `;
  return toReturn;
}

var verify = function(data, signature, publicKey) {
  var msg = ethUtil.bufferToHex(new Buffer(data, 'utf8'));
  const msgParams = { data: msg };
  msgParams.sig = signature;
  console.log("publicKey: " + publicKey);
  console.log("signature: " + signature);
  const recovered = sigUtil.recoverPersonalSignature(msgParams);
  console.log("publicKey: " + publicKey);
  console.log("recovered: " + recovered);
  return recovered === publicKey;
}

//////////////////////////////////////////////////////////////
// More information can be found here: http://developer.linkedin.com/rest
var APICalls = [];
APICalls['myProfile'] = 'people/~:(first-name,last-name,headline,summary,public-profile-url)';
