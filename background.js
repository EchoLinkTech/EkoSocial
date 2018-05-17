/**
 * When the user click on the Chrome EchoLink logo, this file is triggered.
 */

// Send a message to the browser, with action name as the message.
chrome.browserAction.onClicked.addListener(function(tab) {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    console.log("sending message");
    chrome.tabs.sendMessage(activeTab.id, {"message": "scrape_profile_data"});
  });
});