'use strict';

var exceptionUrls = [];
var isExceptionUrl = false;

// ParseURL Utility Functionality
function parseURL(url) {
  var a =  document.createElement('a');
  a.href = url;
  return {
    source: url,
    protocol: a.protocol.replace(':',''),
    host: a.hostname
    };
}

function loadExceptions(exceptionUrls) {
  var req = new XMLHttpRequest();
  req.open('GET', NETKI_API_HOST + '/api/browsersupport/exceptions');
  req.onreadystatechange = function() {

    var urls;

    if(req.readyState === 4) {
      var data = JSON.parse(req.responseText);
      if(data.success) {
        chrome.storage.sync.set({
          exceptionUrls: data.exception_urls
        }, function() {});
        exceptionUrls = data.exception_urls;
        urls = data.exception_urls;
      } else {
        chrome.storage.sync.get({
          exceptionUrls: []
        }, function(items) {
          exceptionUrls = items.exceptionUrls;
          urls = items.exceptionUrls;
        });
      }
      getIsSiteException(urls);
    }
  };
  req.send();
}

// Wallet Name Lookup Handling Functions
function getIsSiteException(exceptionUrls) {
  chrome.tabs.query(
    {'active': true, 'lastFocusedWindow': true},
    function(tabs) {
      isExceptionUrl = false;
      if(tabs != null && tabs.length > 0 && tabs[0].url !== "") {
        exceptionUrls.forEach(function(value) {
          var urlObj = parseURL(tabs[0].url);
          if(urlObj.host.indexOf(value) != -1) {
            isExceptionUrl = true;
          }
        });
      }
    }
  );
}

function resolveWalletName(walletName, currency, tab, editable) {
  var req = new XMLHttpRequest();
  req.open('GET', NETKI_PUBAPI_HOST + '/api/wallet_lookup/' + walletName + '/' + currency);
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      var data = JSON.parse(req.responseText);

      if(data.success) {
        if(editable) {

          chrome.tabs.sendMessage(tab.id, {
            args: {
              type: 'walletNameResolution',
              walletName: walletName,
              walletAddress: data.wallet_address
            }
          });
        }
      } else {
        chrome.tabs.sendMessage(tab.id, {
          args: {
            type: 'walletNameNotFound',
            walletName: walletName
          }
        });
      }
    }
  };
  req.send();
}

function getWalletCurrencies(walletName, tab, editable) {
  var req = new XMLHttpRequest();
  req.open('GET', NETKI_PUBAPI_HOST + '/api/wallet_lookup/' + walletName + '/available_currencies');
  req.onreadystatechange = function() {
    if(req.readyState === 4) {
      var data = JSON.parse(req.responseText);

      if(data.success) {

        if(data.available_currencies.length > 1) {
          chrome.tabs.sendMessage(tab.id, {
            args: {
              type: 'availableCurrencies',
              walletName: walletName,
              currencies: data.available_currencies
            }
          });
        } else {
          resolveWalletName(walletName, data.available_currencies[0], tab, editable);
        }

      } else {
        chrome.tabs.sendMessage(tab.id, {
          args: {
            type: 'walletNameNotFound',
            walletName: walletName
          }
        });
      }
    }
  };
  req.send();
}

function lookupClickHandler(info, tab) {
  if(isWalletName(info.selectionText)) {
    getWalletCurrencies(info.selectionText, tab, info.editable);
  } else {
    chrome.tabs.sendMessage(tab.id, {
      args: {
        type: 'walletNameNotFound',
        walletName: info.selectionText
      }
    });
  }
}

// Setup Context Menu
chrome.runtime.onInstalled.addListener(function() {
  var title = 'Lookup Wallet Name';
  var context = 'selection';
  chrome.contextMenus.create({'title': title, 'contexts':[context],
    'id': 'context' + context});
});

// Setup onload handler to set the exception flag for the URL
chrome.webNavigation.onCompleted.addListener(function(details) {
  loadExceptions();
});

// Setup Chrome Message Passing
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case 'walletNameLookup':
      return resolveWalletName(message.wn, message.currency, sender.tab, true);
    case 'getWalletCurrencies':
      if (!isExceptionUrl && isWalletName(message.lookupValue)) {
        return getWalletCurrencies(message.lookupValue, sender.tab, true);
      }
      return;
  }
});

chrome.contextMenus.onClicked.addListener(lookupClickHandler);
