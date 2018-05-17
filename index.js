/*
  Copyright 2018 EchoLink Pte. Ltd.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  
  You may obtain a copy of the License at:
  http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  
  See the License.txt for the specific language governing permissions and
  limitations under the License.
*/


var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');
var Eth = require('ethjs');
window.Eth = Eth;

/**
 * Reaction when the user click on the EchoLink button.
 * There are three responses:
 * 1. No Metamask installation detected.
 * 2. Metamask isn't logged in.
 * 3. Already logged in.
 */
checkMetamask.addEventListener('click', 
  function(event) {
    event.preventDefault();
    console.log("checking metamask");
    if (web3 === 'undefined') {
      statusDisplay.innerHTML = "please install Metamask";
      return;
    } else if (web3.eth.accounts.length === 0) {
      statusDisplay.innerHTML = "not logged in";
      return;
    } else {
      statusDisplay.innerHTML = "already logged in";
      return;
    }
  }
);

/**
 * Generate JSON data by parsing current html.
 * @param from The public key of the user who initiates the process.
 */
var generateProfileJSON = function(from) {
  var profile = {};
  profile["firstName"] = document.getElementById("topcard-firstname").value;
  profile["headline"] = document.getElementById("topcard-headline").value;
  profile["lastName"] = document.getElementById("topcard-lastname").value;
  profile["publicProfileUrl"] = window.location.href.replace("/edit/topcard/", "");
  profile["summary"] = document.getElementById("topcard-summary").value + "|" + from;
  return JSON.stringify(profile, null, 2);
}

/**
 * The response of Sign Profile button.
 * Collect profile data and sign it using Metamask API.
 * Write the result into profile summary.
 */
personalSignButton.addEventListener('click', 
  function(event) {
    event.preventDefault();
    console.log("scraping profile data");
    // Use the first account.
    var from = web3.eth.accounts[0];

    var text = generateProfileJSON(from);
    var msg = ethUtil.bufferToHex(new Buffer(text, 'utf8'))
    console.log(msg)

    console.log('CLICKED, SENDING PERSONAL SIGN REQ')
    var params = [msg, from]
    var method = 'personal_sign'

    // Prompt sign window using the user's Metamask account.
    web3.currentProvider.sendAsync({
      method,
      params,
      from,
    }, function (err, result) {
      if (err) return console.error(err)
      if (result.error) return console.error(result.error)
      console.log('PERSONAL SIGNED:' + JSON.stringify(result.result))

      console.log('recovering...')
      const msgParams = { data: msg }
      msgParams.sig = result.result

      // Write public key and signature to summary
      document.getElementById("topcard-summary").focus();
      document.getElementById("topcard-summary").value = document.getElementById("topcard-summary").value + "|" + from + "|" + result.result;

      console.dir({ msgParams })
      const recovered = sigUtil.recoverPersonalSignature(msgParams)
      console.dir({ recovered })

      // Just some demo code showing how to verify messages.
      if (recovered === from ) {
        console.log('SigUtil Successfully verified signer as ' + from)
      } else {
        console.dir(recovered)
        console.log('SigUtil Failed to verify signer when comparing ' + recovered.result + ' to ' + from)
        console.log('Failed, comparing %s to %s', recovered, from)
      }
    })
  }
);
