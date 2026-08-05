/* ═══════════════ SUSA PUBLIC PAGE RENDERER ═══════════════ */
(function () {
  'use strict';

  var meta = document.querySelector('meta[name="page-id"]');
  if (!meta) return;
  var pageId = meta.getAttribute('content');
  if (!pageId) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ─── SEO META ───
  function applySeo(seo) {
    if (seo && seo.title) document.title = seo.title;
    if (seo && seo.description) {
      var md = document.querySelector('meta[name="description"]');
      if (md) md.setAttribute('content', seo.description);
      var ogd = document.querySelector('meta[property="og:description"]');
      if (ogd) ogd.setAttribute('content', seo.description);
      var twd = document.querySelector('meta[name="twitter:description"]');
      if (twd) twd.setAttribute('content', seo.description);
    }
    if (seo && seo.og_image) {
      var og = document.querySelector('meta[property="og:image"]');
      if (og) og.setAttribute('content', seo.og_image);
      var tw = document.querySelector('meta[name="twitter:image"]');
      if (tw) tw.setAttribute('content', seo.og_image);
    }
    if (seo && seo.keywords) {
      var kw = document.querySelector('meta[name="keywords"]');
      if (kw) kw.setAttribute('content', seo.keywords);
    }
  }

  // ─── COLLECTIONS ───
  // Each element with a data-collection attribute gets filled with
  // rows built from the collection API. Empty arrays leave static markup untouched.
  function renderTestimonials(items) {
    $$('[data-collection="testimonials"]').forEach(function (grid) {
      if (!items || !items.length) return;
      grid.innerHTML = '';
      items.forEach(function (t) {
        var card = document.createElement('div');
        card.className = 'test-card fade-up';
        var stars = '';
        var n = Math.max(1, Math.min(5, Number(t.rating) || 5));
        for (var i = 0; i < n; i++) stars += '★';
        card.innerHTML =
          '<div class="test-google-header">' +
            '<div class="test-google-logo" style="width:32px;height:32px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#C8962E;font-size:15px"><i class="fab fa-google"></i></div>' +
            '<span style="font-size:13px;font-weight:600;color:var(--primary)">Partner Review</span>' +
          '</div>' +
          '<div class="test-stars" style="color:var(--gold-light)">' + stars + '</div>' +
          '<blockquote>' + esc(t.quote || '') + '</blockquote>' +
          '<div class="test-author">' +
            '<div class="test-avatar">' + esc(t.initial || (t.name || '?').slice(0, 2).toUpperCase()) + '</div>' +
            '<div class="test-author-info"><strong>' + esc(t.name || '') + '</strong><span>' + esc(t.role || '') + '</span></div>' +
          '</div>';
        grid.appendChild(card);
      });
    });
  }

  function renderServices(items) {
    var targets = $$('[data-collection="services"]');
    if (!targets.length) return;
    targets.forEach(function (grid) {
      if (!items || !items.length) return;
      if (grid.getAttribute('data-managed') === '1') return;
      grid.innerHTML = '';
      grid.setAttribute('data-managed', '1');
      items.forEach(function (s) {
        var card = document.createElement('div');
        card.className = 'service-card fade-up';
        var cls = ['gold', 'lavender', 'green'].indexOf(s.color) >= 0 ? s.color : 'gold';
        card.innerHTML =
          '<div class="service-icon ' + esc(cls) + '"><i class="fas ' + esc(s.icon || 'fa-bag-shopping') + '"></i></div>' +
          '<h3>' + esc(s.title || '') + '</h3>' +
          '<p>' + esc(s.description || '') + '</p>';
        grid.appendChild(card);
      });
    });
  }

  function renderFormats(items) {
    var targets = $$('[data-collection="formats"]');
    if (!targets.length) return;
    targets.forEach(function (wrap) {
      if (!items || !items.length) return;
      if (wrap.querySelector('.format-row') && wrap.getAttribute('data-managed') !== '1') return;
      wrap.innerHTML = '';
      wrap.setAttribute('data-managed', '1');
      items.forEach(function (f) {
        var row = document.createElement('div');
        row.className = 'format-row';
        row.innerHTML =
          '<div class="format-name"><strong>' + esc(f.name || '') + '</strong>' +
          (f.description ? '<span>' + esc(f.description || '') + '</span>' : '') + '</div>' +
          '<div class="format-range">' + esc(f.range || '') + '</div>';
        wrap.appendChild(row);
      });
    });
  }

  function renderDocuments(items) {
    var targets = $$('[data-collection="documents"]');
    if (!targets.length) return;
    targets.forEach(function (grid) {
      if (!items || !items.length) return;
      if (grid.querySelector('.doc-card') && grid.getAttribute('data-managed') !== '1') return;
      grid.innerHTML = '';
      grid.setAttribute('data-managed', '1');
      items.forEach(function (d) {
        var a = document.createElement('a');
        a.className = 'doc-card fade-up';
        a.href = d.url || '#';
        a.target = '_blank';
        a.rel = 'noopener';
        a.innerHTML = '<div class="doc-icon"><i class="' + esc(d.icon || 'fas fa-file') + '"></i></div><strong>' + esc(d.title || '') + '</strong><span class="doc-open">View <i class="fas fa-arrow-right"></i></span>';
        grid.appendChild(a);
      });
    });
  }

  function renderFaqs(items) {
    var targets = $$('[data-collection="faqs"]');
    if (!targets.length) return;
    targets.forEach(function (wrap) {
      var list = items.filter(function (f) { return f.active === 1; });
      list = list.filter(function (f) { return !f.page || f.page === pageId || f.page === ''; });
      if (!list.length) return;
      if (wrap.querySelector('.faq-item') && wrap.getAttribute('data-managed') !== '1') {
        // Keep static seed FAQ and only append extra managed FAQ rows
      } else {
        wrap.innerHTML = '';
      }
      wrap.setAttribute('data-managed', '1');
      list.forEach(function (f) {
        var d = document.createElement('details');
        d.className = 'faq-item';
        d.innerHTML = '<summary>' + esc(f.question || '') + '</summary><p>' + esc(f.answer || '') + '</p>';
        wrap.appendChild(d);
      });
    });
  }

  function galleryCategory(g) {
    var text = ((g.title || '') + ' ' + (g.caption || '')).toLowerCase();
    var map = [
      ['counter', ['counter', 'display']],
      ['brand', ['brand', 'merchandis', 'shelf', 'basket', 'rack']],
      ['seating', ['seating', 'café', 'cafe', 'lounge', 'chair', 'sit']],
      ['fitout', ['fit-out', 'fit out', 'fitout', 'interior', 'store', 'hall']],
      ['equipment', ['equipment', 'oven', 'espresso', 'refrigerat', 'mixer']]
    ];
    for (var i = 0; i < map.length; i++) {
      if (map[i][1].some(function (k) { return text.indexOf(k) >= 0; })) return map[i][0];
    }
    return 'all';
  }

  function renderGallery(items) {
    var targets = $$('[data-collection="gallery"]');
    if (!targets.length) return;
    targets.forEach(function (grid) {
      if (!items || !items.length) return;
      if (grid.getAttribute('data-managed') === '1') return;
      grid.innerHTML = '';
      grid.setAttribute('data-managed', '1');
      items.forEach(function (g) {
        var item = document.createElement('div');
        item.className = 'gallery-item fade-up';
        item.setAttribute('data-category', galleryCategory(g));
        item.innerHTML =
          '<img src="' + esc(g.url) + '" alt="' + esc(g.title || g.caption || '') + '" loading="lazy">' +
          '<div class="gallery-overlay"><h4>' + esc(g.title || '') + '</h4><span>' + esc(g.caption || '') + '</span></div>';
        grid.appendChild(item);
      });
    });
  }

  // ─── PROMO BAR ───
  function renderPromo(p) {
    if (!p || !p.enabled || !p.text) return;
    var el = document.createElement('div');
    el.id = 'susa-promo-bar';
    el.style.cssText = 'background:var(--gold-dark,#a4761f);color:#fff;text-align:center;padding:8px 16px;font-size:13px;font-weight:500;position:relative;z-index:60;letter-spacing:.2px';
    if (p.url) {
      var a = document.createElement('a');
      a.href = p.url;
      a.style.cssText = 'color:#fff;text-decoration:none;display:block';
      a.textContent = p.text;
      el.appendChild(a);
    } else {
      el.textContent = p.text;
    }
    var body = document.body;
    body.insertBefore(el, body.firstChild);
  }

  // ─── HELPERS ───
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

  // ─── MAIN ───
  var jobs = [
    fetch('/api/content?page=' + encodeURIComponent(pageId)),
    fetch('/api/tables?table=seo&public=1&page=' + encodeURIComponent(pageId)).catch(function () { return { json: function () { return Promise.resolve({}); } }; }),
    fetch('/api/tables?table=promo&public=1').catch(function () { return { json: function () { return Promise.resolve({}); } }; }),
    fetch('/api/tables?table=testimonials&public=1').catch(function () { return { json: function () { return Promise.resolve({ items: [] }); } }; }),
    fetch('/api/tables?table=services&public=1').catch(function () { return { json: function () { return Promise.resolve({ items: [] }); } }; }),
    fetch('/api/tables?table=formats&public=1').catch(function () { return { json: function () { return Promise.resolve({ items: [] }); } }; }),
    fetch('/api/tables?table=documents&public=1').catch(function () { return { json: function () { return Promise.resolve({ items: [] }); } }; }),
    fetch('/api/tables?table=faqs&public=1').catch(function () { return { json: function () { return Promise.resolve({ items: [] }); } }; }),
    fetch('/api/gallery?public=1').catch(function () { return { json: function () { return Promise.resolve({ items: [] }); } }; })
  ];

  Promise.all(jobs.map(function (p) { return p.then(function (r) { return r.json(); }).catch(function () { return {}; }); }))
    .then(function (all) {
      var content = all[0], seo = all[1], promo = all[2], tests = all[3],
          services = all[4], formats = all[5], documents = all[6], faqs = all[7], gallery = all[8];

      applySeo(seo);
      renderPromo(promo);

      // ─── FILL CONTENT FIELDS ───
      if (content && content.sections) {
        content.sections.forEach(function (sec) {
          var el = $('[data-section="' + sec.key + '"]');
          if (!el) return;
          var fields;
          try { fields = JSON.parse(sec.html); } catch (e) { return; }
          Object.keys(fields).forEach(function (name) {
            var val = fields[name];
            if (val == null || val === '') return;
            el.querySelectorAll('[data-field="' + name + '"]').forEach(function (t) {
              var type = t.getAttribute('data-type') || (t.tagName === 'IMG' ? 'image' : (t.tagName === 'A' ? 'text' : ''));
              if (type === 'image') { t.setAttribute('src', val); }
              else if (type === 'bg') { t.style.backgroundImage = 'url(' + val + ')'; }
              else if (type === 'href') { t.setAttribute('href', val); }
              else if (type === 'html') { t.innerHTML = val; }
              else { t.textContent = val; }
            });
          });
        });
      }

      // ─── RENDER COLLECTIONS ───
      renderTestimonials((tests && tests.items) || []);
      renderServices((services && services.items) || []);
      renderFormats((formats && formats.items) || []);
      renderDocuments((documents && documents.items) || []);
      renderFaqs((faqs && faqs.items) || []);
      renderGallery((gallery && gallery.items) || []);

      // Re-trigger scroll reveal on new dynamic items
      ['.test-card', '.service-card', '.doc-card', '.gallery-item', '.format-row'].forEach(function (sel) {
        document.querySelectorAll(sel + '.fade-up').forEach(function (el) {
          el.classList.add('visible');
        });
      });
    });
})();