/* EL0M Editorial — copy-to-clipboard helpers. */
(function () {
  'use strict';

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(field);
    return Promise.resolve();
  }

  document.addEventListener('click', function (event) {
    var targetButton = event.target.closest('[data-elomai-copy-target]');
    if (targetButton) {
      var field = document.getElementById(targetButton.getAttribute('data-elomai-copy-target'));
      if (!field) return;
      copy(field.value).then(function () {
        var feedback = targetButton.parentNode.querySelector('.elomai-copy-feedback');
        if (feedback) {
          feedback.textContent = 'Kopiert';
          setTimeout(function () { feedback.textContent = ''; }, 1800);
        }
      });
      return;
    }

    var rawButton = event.target.closest('[data-elomai-copy]');
    if (rawButton) {
      copy(rawButton.getAttribute('data-elomai-copy')).then(function () {
        var previous = rawButton.textContent;
        rawButton.textContent = 'Kopiert';
        setTimeout(function () { rawButton.textContent = previous; }, 1800);
      });
    }
  });
})();
