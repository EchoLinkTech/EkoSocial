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