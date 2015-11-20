'use strict';

var clickedElem = null;
var popupElem = null;

var inputTypes = ['text', 'search', 'url', 'email'];

var autolookup;
var autolookupOnMultiple;

function loadOptions() {
  chrome.storage.sync.get({
    autolookup: true,
    autolookupOnMultiple: true
  }, function (items) {
    autolookup = items.autolookup;
    autolookupOnMultiple = items.autolookupOnMultiple;
  });
}

document.addEventListener("mousedown", function (event) {
  if (event.button === 2 && event.target.tagName.toLowerCase() === 'input') {
    clickedElem = event.target;
  }
});

document.addEventListener("blur", function (event) {
  loadOptions();
  if (autolookup && event.target.tagName.toLowerCase() === 'input' && typeof event.target.attributes['type'] !== 'undefined' && inputTypes.indexOf(event.target.attributes['type'].value) != -1) {
    chrome.runtime.sendMessage(chrome.runtime.id, { type: 'getWalletCurrencies', lookupValue: event.target.value });
    return true;
  }
}, true);

function fireEvent(obj, evt) {
  var fireOnThis = obj;
  if (document.createEvent) {
    var evObj = document.createEvent('MouseEvents');
    evObj.initEvent(evt, true, false);
    fireOnThis.dispatchEvent(evObj);
  } else if (document.createEventObject) {
    //IE
    var evObj = document.createEventObject();
    fireOnThis.fireEvent('on' + evt, evObj);
  }
}

function updateInputWithWalletName(walletName, walletAddress) {

  var updatedElem = null;

  // If we already know the element, skip search
  if (clickedElem != null && clickedElem.tagName.toLowerCase() === 'input') {
    if (clickedElem.value === walletName) {
      clickedElem.value = walletAddress;
      updatedElem = clickedElem;
    }
  } else {
    // If we don't have the element, search for it
    var elements = document.getElementsByTagName('input');
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      if (element.value === walletName) {
        element.value = walletAddress;
        updatedElem = element;
        break;
      }
    }
  }

  // Fire a blur event if we've updated an input field to activate data-binding found in Angular/React/etc.
  if (updatedElem != null) {
    window.setTimeout(function () {
      fireEvent(updatedElem, 'change');
      fireEvent(updatedElem, 'blur');
    }, 50);
  }
}

function showAvailableCurrencies(walletName, currencies) {

  loadOptions();
  if (currencies.length > 1 && !autolookupOnMultiple) {
    return;
  }

  // Convert Shortcode to Currency Names -> IF AVAILABLE
  var optStr = "";
  for (var i = 0; i < currencies.length; i++) {
    var option = $('<option value="' + currencies[i] + '">' + SHORTCODES[currencies[i]] + '</option>');
    optStr += option.prop('outerHTML');
  }

  // Open Popup with options and lookup button
  var modalHtml = '<div class="nk-currency-popup-modal" id="netki-currency-popup">';
  modalHtml += '<div class="nk-modal-header"><img src="' + chrome.extension.getURL('images/icon-38.png') + '" border="0" style="vertical-align: middle">&nbsp;Netki Wallet Name Lookup</div>';
  modalHtml += '<div class="nk-modal-body">';
  modalHtml += '<form><div class="nk-form-group">';
  modalHtml += '<label class="nk-avail-currencies-label" for="lookupCurrency">Available Currencies</label>';
  modalHtml += '<select class="nk-form-control" name="lookupCurrency">';
  modalHtml += optStr;
  modalHtml += '</select></div><br/>';
  modalHtml += '<button class="nk-lookup-button" type="submit">Lookup Currency Address</button>';
  modalHtml += '</form></div></div>';

  popupElem = $(modalHtml);
  var formElem = popupElem.find('form');
  formElem.submit(function () {
    lookupWalletName(walletName);
    return false;
  });

  popupElem.appendTo('body').modal({ showSpinner: false, zIndex: 99998 });
}

function showNotFoundMessage(walletName) {
  if (clickedElem == null) {
    return;
  }

  var modalHtml = '<div class="nk-currency-popup-modal">';
  modalHtml += '<div class="nk-modal-header nk-failed"><img src="' + chrome.extension.getURL('images/icon-38.png') + '" border="0" style="vertical-align: middle">&nbsp;Wallet Name Lookup Failed</div>';
  modalHtml += '<div class="nk-modal-body">Wallet Name <strong>' + walletName + '</strong> does not exist!</div>';
  modalHtml += '</div>';
  var errorElem = $(modalHtml);
  errorElem.appendTo('body').modal({ showSpinner: false, zIndex: 99998 });
}

function lookupWalletName(walletName) {
  $("#netki-currency-popup select").each(function () {
    if ($(this).attr('name') === 'lookupCurrency') {
      var msg = {
        type: 'walletNameLookup',
        wn: walletName,
        currency: $(this).val()
      };

      chrome.runtime.sendMessage(chrome.runtime.id, msg);
    }
    $.modal.close();
    popupElem.remove();
  });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.args.type) {
    case 'walletNameResolution':
      return updateInputWithWalletName(message.args.walletName, message.args.walletAddress);

    case 'availableCurrencies':
      return showAvailableCurrencies(message.args.walletName, message.args.currencies);

    case 'walletNameNotFound':
      return showNotFoundMessage(message.args.walletName);
  }
});

// Add Hidden Popup Div
var cssUrl = chrome.extension.getURL("styles/jquery.modal.css");
var link = $('<link href="' + cssUrl + '" type="text/css" rel="stylesheet">');
$('head').append(link);

loadOptions();
//# sourceMappingURL=contentscript.js.map
