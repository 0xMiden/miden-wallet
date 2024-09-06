/* eslint-disable */

try {
  const window = globalThis;
  // This is the file produced by webpack
  importScripts('background.js');

  window.chrome.runtime.onConnect.addListener(function(port) {
    if (port.name == 'Popup Connection') {
      port.onDisconnect.addListener(async function() {
        await chrome.storage.local.set({'last-page-closure-timestamp': Date.now().toString()});
      });
    }
  });

  // wake up signal
  chrome.runtime.onMessage.addListener(() => {
    console.debug('Ping worker');
  });

  function openFullPage() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('fullpage.html')
    });
  }

  chrome.runtime.onInstalled.addListener(({ reason }) => (reason === 'install' ? openFullPage() : null));
} catch (e) {
  // This will allow you to see error logs during registration/execution
  console.error(e);
}
