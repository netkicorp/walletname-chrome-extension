'use strict';

/***********************************************
 * Generic Show Notification Utility Function
 * @param title
 * @param message
 */

function showNotification(title, message, popupWindow) {
  // Clear Existing Notifications
  chrome.notifications.getAll(function (notifications) {
    for (var i = 0; i < notifications.length; i++) {
      chrome.notifications.clear(notifications[i].notificationId);
    }
  });

  var notificationDate = new Date();
  chrome.notifications.create(
    "nkPopupNotification" + notificationDate.getTime(),
    {
      'type': 'basic',
      'iconUrl': '../images/icon-128.png',
      'title': title,
      'message': message
    },
    function (notificationId) {
      popupWindow.close();
    }
  );
}

/**************************************
 * Submit Non-working URL to Netki Support
 * @param url Non-working URL
 */
function submitNonWorkingUrl(url) {

  var req = new XMLHttpRequest();
  var postData = {
    url: url,
    browser: 'Chrome',
    browserVersion: /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1],
    extensionVersion: chrome.runtime.getManifest().version
  };

  req.open('POST', NETKI_API_HOST + '/api/browsersupport/nonworkingurl');
  req.setRequestHeader('Content-type', 'application/json');
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if(req.status !== 200) {
        return showNotification('Submission Error', 'Unable to submit website to Netki, please try again later or e-mail opensource@netki.com to report a non-working website.', self);
      }

      var data = JSON.parse(req.responseText);
      if(data.success) {
        showNotification('Thank You', 'Thank you for letting us know that this website does not work with the Netki Wallet Name Lookup extension!', self);
      } else {
        showNotification('Submission Error', 'Unable to submit website to Netki, please try again later or e-mail opensource@netki.com to report a non-working website.', self);
      }
    }
  };
  req.send(JSON.stringify(postData));
}

/*****************************************
 * Get Tab URL and Submit, otherwise show
 * error notification.
 */
$("a[name='notworking']").click(function() {
  chrome.tabs.query(
    {'active': true, 'lastFocusedWindow': true},
    function(tabs) {
      if(tabs != null && tabs.length > 0 && tabs[0].url !== "") {
        submitNonWorkingUrl(tabs[0].url);
      } else {
        showNotification('Error', 'Unable to get URL of problem website. Please try again later or e-mail opensource@netki.com to report a non-working website.');
      }
    }
  );
});

/*****************************************
 * Lookup Wallet Name in Popup
 */
function lookupWalletName() {

  // Reset Copy Button
  var copyButton = $("#copyButton");
  copyButton.hide();
  copyButton.text('Copy Wallet Address');

  var inputElem = $("input[name='lookupText']");
  var cSelect = $("#currencySelect");

  if(!isWalletName(inputElem.val())) {
    $("#msgLi").text("Not a valid Wallet Name");
    $("#msgLi").slideDown(200);
    return;
  }

  if($("#msgLi").is(":visible")) {
    $("#msgLi").slideUp();
  }

  if(inputElem.val() !== "" && cSelect.val() !== null && cSelect.val() !== "") {
    return resolveWalletName(inputElem.val(), cSelect.val(), inputElem);
  }

  var currencyReq = new XMLHttpRequest();
  currencyReq.open('GET', NETKI_PUBAPI_HOST + '/api/wallet_lookup/' + inputElem.val() + '/available_currencies');
  currencyReq.onreadystatechange = function() {
    if(currencyReq.readyState === 4) {
      var data = JSON.parse(currencyReq.responseText);

      if(data.success) {

        if(data.available_currencies.length > 1) {
          $("#lookMeUp").text("Get Currency Address");
          $("#currencyLi").slideDown(200);
          var cSelect = $("#currencySelect");

          // Clear Select if previously used
          cSelect.find("option").remove().end();
          data.available_currencies.forEach(function(value) {
            cSelect.append("<option value='" + value + "'>" + SHORTCODES[value] + "</option>");
          });
        } else {
          return resolveWalletName(inputElem.val(), data.available_currencies[0], inputElem);
        }

      } else {
        inputElem.val('Wallet Name Not Found');
      }
    }
  };
  currencyReq.send();

}

function resolveWalletName(walletName, currency, inputElem) {
  var req = new XMLHttpRequest();
  req.open('GET', NETKI_PUBAPI_HOST + '/api/wallet_lookup/' + walletName + '/' + currency);
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      var data = JSON.parse(req.responseText);

      if(data.success) {
        inputElem.val(data.wallet_address);
        var copyButton = $("#copyButton");
        copyButton.slideDown(200);
      } else {
        inputElem.val('Wallet Name Not Found');
      }
      $("#currencyLi").slideUp(200);
      var cSelect = $("#currencySelect");
      cSelect.find("option").remove().end();
      cSelect.prop("selectedIndex", 0);
      $("#lookMeUp").text("Lookup Wallet Name");
    }
  };
  req.send();
}

$("#lookMeUp").click(function() {
  lookupWalletName();
  return false;
});

$("form[name='lookup']").submit(function() {
  lookupWalletName();
  return false;
});

$("#copyButton").click(function () {
  var inputElem = $("input[name='lookupText']");
  inputElem.focus();
  inputElem.select();

  try {
    var copyOk = document.execCommand('copy');
    var copyButton = $("#copyButton");

    if(copyOk) {
      copyButton.text('Wallet Address Copied');
      copyButton.css("background-color", "#4abc30");
      copyButton.delay(700).slideUp(200);
      inputElem.val("");
    } else {
      copyButton.parent().css("background-color", "#f05455");
      copyButton.text('Copy Failed');
    }
  } catch (err) {
    console.log('Copy Error: ' +  err);
  }
  inputElem.blur();
});

$("#msgLi").hide();
$("#lookMeUp").text("Lookup Wallet Name");