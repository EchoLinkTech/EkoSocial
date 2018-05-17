/**
 * popup.js specifies the behavior embeded in Chrome Extension.
 * It can also interact with what's going on in the current web page.
 */

// The dom element that shows current state and message to the users.
let status = document.getElementById('status');

// The loadinng animation.
let loader = document.getElementById('loader');

// The sign button that allows user to start signing LinkedIn profile.
let signButton = document.getElementById('signButton');

// The LinkedIn button that redirect the user to LinkedIn website.
let linkedin = document.getElementById('linkedin');

/**
 * Check url and see if it is a valid one.
 * @param url The url to be checked.
 */
var checkURL = function(url) {
	var expression = /https?:\/\/(www\.linkedin\.com\/in\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\/edit\/topcard)/gi;
	var regex = new RegExp(expression);
	return url.match(regex);
}

/**
 * Starting function when EchoLink Extension is clicked.
 * Checks url and start application if the url is valid.
 * If the url isn't valid, the extension asks user to go to LinkedIn website.
 */
chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (activeTabs) {
        activeTabs.map(function (tab) {
        	var url = tab.url;
        	if (checkURL(url)) {
	            chrome.tabs.sendMessage(tab.id, {"message": "check_metamask"});
				loader.hidden = false;
				status.hidden = true;
			 	signButton.hidden = true;
				linkedin.hidden = true;
				chrome.browserAction.setBadgeText ( { text: "1" } );
        	} else {
        		status.innerHTML = "Please go to LinkedIn profile editing page";
				loader.hidden = true;
				status.hidden = false;
			 	signButton.hidden = true;
				linkedin.hidden = false;
				chrome.browserAction.setBadgeText ( { text: "" } );
        	}
        });
    });
});

/**
 * An event listener that listens to the following commands:
 * 1. metamask_status: Request to check if Metamask is installed and logged in.
 */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.type == "metamask_status") {
		  if(request.message == "not logged in")
			status.innerHTML = "Please log in to MetaMask";
		  else
			  status.innerHTML = "All set to sign data";
	      loader.hidden = true;
	      status.hidden = false;
		  linkedin.hidden = true;
	      signButton.hidden = !(status.innerHTML === "All set to sign data");
    }
  }
);

/**
 * An event listener fot the sign button.
 * If clicked, send scrape_profile_data message to front-end code
 * and starts the signature process.
 */
signButton.addEventListener('click', 
  function(event) {
	if (status.innerHTML === "All set to sign data") {
		chrome.windows.getCurrent(function (currentWindow) {
		    chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (activeTabs) {
		        activeTabs.map(function (tab) {
		            chrome.tabs.sendMessage(tab.id, {"message": "scrape_profile_data"});
		        });
		    });
		});
	}
  }
);

/**
 * Event listener for LinkedIn redirection.
 */
linkedin.addEventListener('click', 
  function(event) {
	chrome.tabs.update({ url: "https://www.linkedin.com/" });    
  }
);

/**
 * Event listener for scrapping LinkedIn profile data.
 */
chrome.browserAction.onClicked.addListener(function(tab) {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    console.log("sending message");
    chrome.tabs.sendMessage(activeTab.id, {"message": "scrape_profile_data"});
  });
});

