/**
 * Listening the command sent from Chrome Extension.
 * 1. scrape_profile_data: Ready to sign and will scrape data
 *    from LinkedIn profile page.
 * 2. check_metamask: Check whether Metamask is ready and logged in.
 */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "scrape_profile_data" ) {
      console.log("scraping profile data");
      personalSignButton.click();
    } else if( request.message === "check_metamask" ) {
      console.log("scraping profile data");
      checkMetamask.click();
	    setTimeout(function () {
			chrome.runtime.sendMessage({message: statusDisplay.innerHTML, type: "metamask_status"});
	    }, 1000);
    }
  }
);

/**
 * Triggered when Chrome Extension loads. Inject some DOM elements for
 * activating different actions.
 */
var extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
if (!location.ancestorOrigins.contains(extensionOrigin)) {
	// For triggering signing data
    var button = document.createElement('button');
    button.id = "personalSignButton";
    button.visibility = "hidden";
    document.body.appendChild(button);

    // For checking Metamask status
    var checkButton = document.createElement('button');
    checkButton.id = "checkMetamask";
    checkButton.visibility = "hidden";
    document.body.appendChild(checkButton);

    // For storing resonse message
    var statusDisplay = document.createElement('p');
    statusDisplay.id = "statusDisplay";
    statusDisplay.visibility = "hidden";
    document.body.appendChild(statusDisplay);

    // Inject javascript into current web page to access all the actions.
    var script = document.createElement('script');
    // Must be declared at web_accessible_resources in manifest.json
    script.src = 'https://localhost:1337/injection.js';
    document.body.appendChild(script);
}