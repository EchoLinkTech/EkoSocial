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


/**
 * This is the front-end code for the LinkedIn profile verification process.
 * The script interacts with Metamask accounts and knows which account is
 * currently in use, then perform verification process with the account.
 */

let onload = function() {
	console.log("onload");
	let verify = document.getElementById("verify");
	let personalSignButton = document.getElementById("personalSignButton");
	let checkMetamask = document.getElementById("checkMetamask");
	personalSignButton.style.visibility = "hidden";
	checkMetamask.style.visibility = "hidden";
	verify.addEventListener('click', 
	  function(event) {
	    event.preventDefault();
	    console.log("verifying account");
	    if (web3 === 'undefined') {
	      statusDisplay.innerHTML = "please install Metamask";
	      return;
	    } else if (web3.eth.accounts.length === 0) {
	      statusDisplay.innerHTML = "not logged in";
	      return;
	    } else {
	      statusDisplay.innerHTML = "already logged in";
	      var from = web3.eth.accounts[0];
	      window.location.href = 'https://localhost:1337/callback/' + from;
	      return;
	    }
	  }
	);
}

setTimeout(onload, 2000);
