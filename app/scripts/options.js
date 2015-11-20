'use strict';

function loadOptions() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    autolookup: true,
    autolookupOnMultiple: true
  }, function (items) {
    $("input[name='autolookup']").prop('checked', items.autolookup);
    $("input[name='autolookupOnMultiple']").prop('checked', items.autolookupOnMultiple);
  });
}

function saveOptions() {
  var autolookup = $("input[name='autolookup']").prop('checked');
  var autolookupOnMultiple = $("input[name='autolookupOnMultiple']").prop('checked');

  chrome.storage.sync.set({
    autolookup: autolookup,
    autolookupOnMultiple: autolookupOnMultiple
  }, function () {});
}

$('button').click(function () {
  saveOptions();
  self.close();
  return false;
});

document.addEventListener('DOMContentLoaded', loadOptions);
//# sourceMappingURL=options.js.map
