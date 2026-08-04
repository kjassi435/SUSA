/* ═══════════════ SUSA PUBLIC PAGE RENDERER ═══════════════ */
(function () {
  'use strict';

  var meta = document.querySelector('meta[name="page-id"]');
  if (!meta) return;
  var pageId = meta.getAttribute('content');
  if (!pageId) return;

  fetch('/api/content?page=' + encodeURIComponent(pageId))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      (data.sections || []).forEach(function (sec) {
        var el = document.querySelector('[data-section="' + sec.key + '"]');
        if (!el) return;
        var fields;
        try { fields = JSON.parse(sec.html); } catch (e) { return; }
        Object.keys(fields).forEach(function (name) {
          var val = fields[name];
          if (val == null || val === '') return;
          var targets = el.querySelectorAll('[data-field="' + name + '"]');
          targets.forEach(function (t) {
            var type = t.getAttribute('data-type') || (t.tagName === 'IMG' ? 'image' : (t.tagName === 'A' ? 'text' : ''));
            if (type === 'image') {
              t.setAttribute('src', val);
            } else if (type === 'bg') {
              t.style.backgroundImage = 'url(' + val + ')';
            } else if (type === 'href') {
              t.setAttribute('href', val);
            } else if (type === 'html') {
              t.innerHTML = val;
            } else {
              t.textContent = val;
            }
          });
        });
      });
    })
    .catch(function () {});
})();
