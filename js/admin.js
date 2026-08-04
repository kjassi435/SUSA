/* ═══════════════ SUSA ADMIN PANEL ═══════════════ */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  const state = { email: null, activePage: null, pageData: {} };

  // ─── TOAST ───
  const toastEl = $('#toast');
  let toastTimer = null;
  function toast(msg, type) {
    toastEl.textContent = msg;
    toastEl.className = 'admin-toast show ' + (type || 'ok');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = 'admin-toast'; }, 2600);
  }

  // ─── API ───
  async function api(path, opts) {
    const res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    return data;
  }

  // ─── PAGE SCHEMAS ───
  // Each page: { name, icon, sections: [ { key, label, fields: [ {name, label, type, default} ] } ] }
  // type: text | textarea | image (url + upload)
  const PAGES = [
    { id: 'home', name: 'Home', icon: 'fa-house', sections: [
      { key: 'hero', label: 'Hero Section', fields: [
        ['badge', 'Badge Text', 'text', 'FRANCHISE OPPORTUNITIES'],
        ['heading', 'Main Heading', 'text', 'We Build the Bakery. You Own the Brand.'],
        ['subheading', 'Subheading', 'textarea', 'Turnkey bakery and café franchise concepts — from design and fit-out to equipment and ongoing support.'],
        ['ctaText', 'CTA Button Text', 'text', 'Become a Partner'],
        ['ctaUrl', 'CTA Button URL', 'text', 'franchise.html#franchise-form'],
        ['heroImage', 'Hero Background Image', 'image', ''],
      ]},
      { key: 'stats', label: 'Stats Band', fields: [
        ['stat1Num', 'Stat 1 Number', 'text', '100+'],
        ['stat1Label', 'Stat 1 Label', 'text', 'Stores Designed'],
        ['stat2Num', 'Stat 2 Number', 'text', '25+'],
        ['stat2Label', 'Stat 2 Label', 'text', 'Cities'],
        ['stat3Num', 'Stat 3 Number', 'text', '50+'],
        ['stat3Label', 'Stat 3 Label', 'text', 'Partners'],
        ['stat4Num', 'Stat 4 Number', 'text', '4.9'],
        ['stat4Label', 'Stat 4 Label', 'text', 'Rating'],
      ]},
      { key: 'productLines', label: 'Product Lines', fields: [
        ['heading', 'Section Heading', 'text', 'Six integrated product lines. One complete store.'],
        ['intro', 'Intro Text', 'textarea', 'From display counters to complete fit-outs, every element designed to work together.'],
      ]},
      { key: 'galleryStrip', label: 'Gallery Strip', fields: [
        ['heading', 'Section Heading', 'text', 'See what we build'],
        ['description', 'Description', 'textarea', 'Every project is different. Browse our portfolio of bakery and café fit-outs across India.'],
        ['ctaText', 'CTA Button Text', 'text', 'View Full Gallery'],
        ['ctaUrl', 'CTA Button URL', 'text', 'gallery.html'],
      ]},
      { key: 'faq', label: 'FAQ Section', fields: [
        ['heading', 'Section Heading', 'text', 'Franchise questions'],
        ['q1', 'Question 1', 'text', 'How do I start a bakery franchise with SUSA?'],
        ['a1', 'Answer 1', 'textarea', 'Fill out our franchise application form or call us. Our team will schedule a discovery call and guide you through the entire process.'],
        ['q2', 'Question 2', 'text', 'What licenses are needed to open a bakery?'],
        ['a2', 'Answer 2', 'textarea', "You'll need GST registration, FSSAI license, Local Municipal Corporation Health license, Fire license, and Police Eating House license."],
        ['q3', 'Question 3', 'text', 'How much can I earn from a SUSA franchise?'],
        ['a3', 'Answer 3', 'textarea', 'ROI depends on your chosen format, location, and operations. Kiosk owners can expect $5K-$10K monthly, while Flagship operators can earn $35K-$60K monthly.'],
        ['q4', 'Question 4', 'text', 'Do I need bakery experience?'],
        ['a4', 'Answer 4', 'textarea', 'No. SUSA is designed for first-time owners as well as experienced operators. We provide comprehensive training and ongoing support.'],
        ['q5', 'Question 5', 'text', 'How long does it take to open?'],
        ['a5', 'Answer 5', 'textarea', 'Most SUSA stores open within 10-12 weeks from design approval. Timelines vary by format, site readiness, and local permits.'],
      ]},
    ]},

    { id: 'about', name: 'About', icon: 'fa-circle-info', sections: [
      { key: 'hero', label: 'Hero Section', fields: [
        ['badge', 'Badge Text', 'text', 'OUR STORY'],
        ['heading', 'Main Heading', 'text', 'From vision to venture — how SUSA began'],
        ['description', 'Description', 'textarea', 'We started with one idea: bakery ownership should be accessible, beautiful, and supported from day one.'],
      ]},
      { key: 'story', label: 'Brand Story', fields: [
        ['heading', 'Section Heading', 'text', 'The SUSA story'],
        ['content', 'Story Content', 'textarea', 'SUSA was born from a simple observation: starting a bakery is overwhelming. Between finding the right equipment, designing a beautiful space, and building operational systems, first-time owners face an impossible learning curve.'],
      ]},
      { key: 'mission', label: 'Mission & Values', fields: [
        ['heading', 'Section Heading', 'text', 'What we believe in'],
        ['mission', 'Mission Statement', 'textarea', 'Make bakery ownership accessible, beautiful, and supported.'],
        ['values', 'Core Values', 'textarea', 'Design-led thinking, Turnkey delivery, Honest partnerships, Quality first'],
      ]},
    ]},

    { id: 'franchise', name: 'Franchise', icon: 'fa-handshake', sections: [
      { key: 'hero', label: 'Hero Section', fields: [
        ['badge', 'Badge Text', 'text', 'FRANCHISE OPPORTUNITIES'],
        ['heading', 'Main Heading', 'text', 'Own a bakery. We build it. You run it.'],
        ['description', 'Description', 'textarea', 'SUSA delivers turnkey bakery and café franchises — complete with design, equipment, training, and ongoing support.'],
      ]},
      { key: 'process', label: 'The Process', fields: [
        ['heading', 'Section Heading', 'text', 'Your journey to opening day'],
        ['intro', 'Intro Text', 'textarea', 'From enquiry to grand opening — clear, supported, every step of the way.'],
      ]},
      { key: 'commitments', label: 'Franchise Commitments', fields: [
        ['providesHeading', 'SUSA Provides Heading', 'text', 'What SUSA provides'],
        ['providesList', 'SUSA Provides List', 'textarea', 'Help in finding locations and validate the site|Providing national and local market reports|Detailed infrastructure layout plans|Initial and ongoing training for you and your team|Complete bakery launch support|Marketing operations all year long|Online retail delivery customer acquisition|Regular menu range renewals|Constant support through franchise advisors'],
        ['expectsHeading', 'Partner Obligations Heading', 'text', 'What we expect'],
        ['expectsList', 'Partner Obligations List', 'textarea', 'Warm and friendly customer welcome|Maintaining standards at par with the parent brand|Following product range specifications|Adhering to raw material specifications|Participating in promotion drives|Attending ongoing training sessions|Maintaining hygiene and cleanliness|Delivering excellent service quality|Becoming a real ambassador for our brand'],
      ]},
      { key: 'whyChoose', label: 'Why Choose SUSA', fields: [
        ['heading', 'Section Heading', 'text', 'Why choose SUSA as your bakery partner'],
      ]},
      { key: 'faq', label: 'Franchise FAQ', fields: [
        ['heading', 'Section Heading', 'text', 'Franchise questions'],
        ['q1', 'Question 1', 'text', 'How do I start a bakery franchise with SUSA?'],
        ['a1', 'Answer 1', 'textarea', 'Fill out our franchise application form or call us. Our team will schedule a discovery call, discuss your goals, and guide you through the entire process.'],
        ['q2', 'Question 2', 'text', 'What licenses are needed to open a bakery?'],
        ['a2', 'Answer 2', 'textarea', "You'll need GST registration, FSSAI license, Local Municipal Corporation Health license, Fire license, and Police Eating House license. The first three are required before opening."],
        ['q3', 'Question 3', 'text', 'How much can I earn from a SUSA franchise?'],
        ['a3', 'Answer 3', 'textarea', 'ROI depends on your chosen format, location, and operations. Kiosk owners can expect $5K-$10K monthly, while Flagship operators can earn $35K-$60K monthly.'],
        ['q4', 'Question 4', 'text', 'Do I need bakery experience?'],
        ['a4', 'Answer 4', 'textarea', 'No. SUSA is designed for first-time owners as well as experienced operators. We provide comprehensive training and ongoing support.'],
        ['q5', 'Question 5', 'text', 'How long does it take to open?'],
        ['a5', 'Answer 5', 'textarea', 'Most SUSA stores open within 10-12 weeks from design approval. Timelines vary by format, site readiness, and local permits.'],
        ['q6', 'Question 6', 'text', 'Can I own multiple SUSA outlets?'],
        ['a6', 'Answer 6', 'textarea', 'Yes! Many of our partners operate multiple units. After successfully running your first store, we offer expanded territory opportunities.'],
      ]},
      { key: 'cta', label: 'Bottom CTA', fields: [
        ['heading', 'CTA Heading', 'text', 'Apply for a SUSA franchise'],
        ['description', 'CTA Description', 'textarea', 'Take the first step toward a beautiful, proven bakery concept. Register for just \u20B94,999.'],
        ['btnText', 'Button Text', 'text', 'Apply Now'],
      ]},
    ]},

    { id: 'gallery', name: 'Gallery', icon: 'fa-images', sections: [
      { key: 'hero', label: 'Hero Section', fields: [
        ['badge', 'Badge Text', 'text', 'PORTFOLIO'],
        ['heading', 'Main Heading', 'text', 'See what we build'],
        ['description', 'Description', 'textarea', 'Browse our gallery of bakery and café fit-outs, display counters, and brand merchandising across India.'],
      ]},
    ]},

    { id: 'services', name: 'Services', icon: 'fa-truck', sections: [
      { key: 'hero', label: 'Hero Section', fields: [
        ['badge', 'Badge Text', 'text', 'WHAT WE SUPPLY'],
        ['heading', 'Main Heading', 'text', 'Everything your bakery needs. One supplier.'],
        ['description', 'Description', 'textarea', 'From display counters to complete fit-outs, SUSA supplies every element your franchise store requires.'],
      ]},
      { key: 'services', label: 'Services List', fields: [
        ['heading', 'Section Heading', 'text', 'Our complete service range'],
        ['intro', 'Intro Text', 'textarea', 'Six integrated product lines designed to work together as one complete store solution.'],
      ]},
    ]},

    { id: 'contact', name: 'Contact', icon: 'fa-envelope', sections: [
      { key: 'hero', label: 'Hero Section', fields: [
        ['badge', 'Badge Text', 'text', 'GET IN TOUCH'],
        ['heading', 'Main Heading', 'text', "Let's start your bakery journey"],
        ['description', 'Description', 'textarea', 'Have a question about our franchise opportunity? Ready to take the first step? Reach out — we are here to help.'],
      ]},
      { key: 'info', label: 'Contact Info', fields: [
        ['email', 'Email', 'text', 'hello@susaenterprise.com'],
        ['phoneIndia', 'Phone (India)', 'text', '+91 96094 06997'],
        ['phoneKSA', 'Phone (KSA)', 'text', '+966 590831351'],
        ['address', 'Address', 'text', '82/6 Shaikh Para Lane, Chatterjee Hat, Howrah, West Bengal 711104, India'],
        ['hours', 'Business Hours', 'text', 'Mon\u2013Sat: 9:00 AM \u2013 6:00 PM'],
      ]},
      { key: 'faq', label: 'Contact FAQ', fields: [
        ['heading', 'Section Heading', 'text', 'Common questions'],
        ['q1', 'Question 1', 'text', 'What is the franchise investment?'],
        ['a1', 'Answer 1', 'textarea', 'Investment depends on format: Kiosk (10\u201315 lakh), Compact (20\u201330 lakh), Lounge (35\u201350 lakh), Flagship (50\u201380 lakh). This covers design, equipment, fit-out, and training. A one-time \u20B94,999 registration fee applies.'],
        ['q2', 'Question 2', 'text', 'Do I need bakery experience?'],
        ['a2', 'Answer 2', 'textarea', 'No. SUSA is designed for first-time owners. We provide comprehensive training and ongoing support.'],
        ['q3', 'Question 3', 'text', 'What is the timeline to open?'],
        ['a3', 'Answer 3', 'textarea', 'Most stores open within 10\u201312 weeks from design approval.'],
        ['q4', 'Question 4', 'text', 'Is there a franchise fee?'],
        ['a4', 'Answer 4', 'textarea', 'Yes. A one-time, non-refundable registration fee of \u20B94,999 is payable when you submit your franchise application. There is no separate franchise fee \u2014 your investment goes directly into your store.'],
      ]},
    ]},

    { id: 'privacy', name: 'Privacy Policy', icon: 'fa-shield-halved', sections: [
      { key: 'content', label: 'Page Content', fields: [
        ['heading', 'Page Heading', 'text', 'Privacy Policy'],
        ['body', 'Content (HTML)', 'textarea', '<p>Last updated: 5 August 2026</p><h2>1. Who we are</h2><p>SUSA ENTERPRISE is a turnkey bakery &amp; café franchise company operating from India.</p>'],
      ]},
    ]},

    { id: 'terms', name: 'Terms & Conditions', icon: 'fa-file-contract', sections: [
      { key: 'content', label: 'Page Content', fields: [
        ['heading', 'Page Heading', 'text', 'Terms & Conditions'],
        ['body', 'Content (HTML)', 'textarea', '<p>Last updated: 5 August 2026</p><h2>1. Acceptance of terms</h2><p>By accessing this website or submitting a franchise application, you agree to be bound by these Terms &amp; Conditions.</p>'],
      ]},
    ]},

    { id: 'refund', name: 'Refund Policy', icon: 'fa-rotate-left', sections: [
      { key: 'content', label: 'Page Content', fields: [
        ['heading', 'Page Heading', 'text', 'Refund Policy'],
        ['body', 'Content (HTML)', 'textarea', '<p>Last updated: 5 August 2026</p><h2>1. Application registration fee \u2014 non-refundable</h2><p>The one-time application registration fee of <strong>\u20B94,999</strong> is strictly <strong>non-refundable</strong>.</p>'],
      ]},
    ]},
  ];

  // ─── AUTH ───
  async function checkAuth() {
    try { const me = await api('/api/me'); state.email = me.email; showApp(); }
    catch (e) { showLogin(); }
  }
  function showApp() {
    $('#adminLogin').hidden = true;
    $('#adminApp').hidden = false;
    $('#adminEmail').textContent = state.email;
    renderPageList();
    switchTab('dashboard');
  }
  function showLogin() {
    $('#adminLogin').hidden = false;
    $('#adminApp').hidden = true;
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#loginError').textContent = '';
    const btn = $('#loginBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    try {
      const res = await api('/api/login', { method: 'POST', body: JSON.stringify({ email: $('#loginEmail').value, password: $('#loginPassword').value }) });
      state.email = res.email;
      showApp();
      toast('Welcome back, ' + res.email);
    } catch (err) {
      $('#loginError').textContent = err.message;
    } finally {
      btn.disabled = false; btn.innerHTML = 'Sign In <i class="fas fa-arrow-right"></i>';
    }
  });

  $('#logoutBtn').addEventListener('click', async () => {
    try { await api('/api/logout', { method: 'POST' }); } catch (e) {}
    state.email = null;
    showLogin();
  });

  // ─── TABS ───
  function switchTab(name) {
    $$('.admin-tab').forEach(t => t.classList.remove('active'));
    $$('.admin-nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === name));
    const tab = $('#tab-' + name);
    if (tab) tab.classList.add('active');
    const titles = { dashboard: 'Dashboard', pages: 'Pages', settings: 'Settings' };
    $('#tabTitle').textContent = titles[name] || name;
    if (name === 'dashboard') loadDashboard();
    if (name === 'settings') loadSettings();
  }

  $$('.admin-nav-item').forEach(n => n.addEventListener('click', () => switchTab(n.dataset.tab)));
  $$('.admin-quick').forEach(q => q.addEventListener('click', () => switchTab(q.dataset.go)));

  // ─── DASHBOARD ───
  async function loadDashboard() {
    try {
      await api('/api/ping');
      await api('/api/content');
      const gallery = await api('/api/gallery');
      $('#statPages').textContent = PAGES.length;
      $('#statSections').textContent = PAGES.reduce((n, p) => n + p.sections.length, 0);
      $('#statGallery').textContent = gallery.items.length;
      $('#statStatus').textContent = 'Online';
    } catch (e) {
      $('#statStatus').textContent = 'Offline';
    }
  }

  // ─── PAGES ───
  function renderPageList() {
    const list = $('#pageList');
    list.innerHTML = '';
    PAGES.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'admin-page-btn';
      btn.dataset.page = p.id;
      btn.innerHTML = '<i class="fas ' + p.icon + '"></i> ' + p.name;
      btn.addEventListener('click', () => selectPage(p.id));
      list.appendChild(btn);
    });
  }

  async function selectPage(pageId) {
    state.activePage = pageId;
    $$('.admin-page-btn').forEach(b => b.classList.toggle('active', b.dataset.page === pageId));
    const page = PAGES.find(p => p.id === pageId);
    if (!page) return;
    $('#tabTitle').textContent = 'Pages — ' + page.name;
    const editor = $('#editorContent');
    editor.innerHTML = '<p class="admin-hint">Loading...</p>';
    try {
      const res = await api('/api/content?page=' + pageId);
      const saved = {};
      (res.sections || []).forEach(s => {
        try { saved[s.key] = JSON.parse(s.html || '{}'); } catch (e) { saved[s.key] = {}; }
      });
      state.pageData[pageId] = saved;
      renderPageEditor(page, saved);
    } catch (e) {
      editor.innerHTML = '<p class="admin-hint">Error loading: ' + esc(e.message) + '</p>';
    }
  }

  function renderPageEditor(page, saved) {
    const editor = $('#editorContent');
    editor.innerHTML = '';
    page.sections.forEach((sec, si) => {
      const data = saved[sec.key] || {};
      const div = document.createElement('div');
      div.className = 'section-editor' + (si === 0 ? ' open' : '');
      div.innerHTML =
        '<div class="section-editor-head">' +
          '<strong>' + esc(sec.label) + '</strong>' +
          '<span class="sec-key">' + esc(sec.key) + '</span>' +
          '<i class="fas fa-chevron-down sec-icon"></i>' +
        '</div>' +
        '<div class="section-editor-body">' +
          renderFields(sec.fields, data) +
          '<div class="section-editor-actions">' +
            '<button type="button" class="admin-btn admin-btn-ghost sec-preview"><i class="fas fa-eye"></i> Preview</button>' +
            '<button type="button" class="admin-btn admin-btn-gold sec-save"><i class="fas fa-floppy-disk"></i> Save</button>' +
          '</div>' +
          '<div class="sec-preview-out" hidden></div>' +
        '</div>';
      div.querySelector('.section-editor-head').addEventListener('click', () => div.classList.toggle('open'));
      div.querySelector('.sec-save').addEventListener('click', () => saveSection(page.id, sec, div));
      div.querySelector('.sec-preview').addEventListener('click', () => {
        const out = div.querySelector('.sec-preview-out');
        out.hidden = !out.hidden;
        if (!out.hidden) {
          const html = renderPreview(sec, collectFields(sec.fields, div));
          out.innerHTML = '<div class="admin-hint" style="margin:0 0 8px">Preview</div><div style="background:#fff;border:1px solid var(--a-border);padding:16px;border-radius:10px">' + html + '</div>';
        }
      });
      editor.appendChild(div);
    });
  }

  function renderFields(fields, data) {
    return fields.map(([name, label, type, def]) => {
      const val = data[name] || def || '';
      if (type === 'image') {
        return '<label class="admin-field" style="margin-bottom:12px">' +
          '<span>' + esc(label) + '</span>' +
          '<div class="admin-image-row">' +
            '<input type="text" class="field-input" data-name="' + esc(name) + '" value="' + escAttr(val) + '" placeholder="Image URL or path">' +
            '<label class="admin-btn-upload"><i class="fas fa-upload"></i><input type="file" accept="image/*" hidden class="file-upload" data-name="' + esc(name) + '"></label>' +
            (val ? '<img class="admin-image-preview" src="' + escAttr(val) + '" onerror="this.style.display=\'none\'">' : '') +
          '</div>' +
        '</label>';
      }
      if (type === 'textarea') {
        return '<label class="admin-field" style="margin-bottom:12px">' +
          '<span>' + esc(label) + '</span>' +
          '<textarea class="field-input" data-name="' + esc(name) + '" rows="4">' + esc(val) + '</textarea>' +
        '</label>';
      }
      return '<label class="admin-field" style="margin-bottom:12px">' +
        '<span>' + esc(label) + '</span>' +
        '<input type="text" class="field-input" data-name="' + esc(name) + '" value="' + escAttr(val) + '">' +
      '</label>';
    }).join('');
  }

  function collectFields(fields, container) {
    const result = {};
    fields.forEach(([name]) => {
      const el = container.querySelector('[data-name="' + name + '"]');
      if (el) result[name] = el.value;
    });
    return result;
  }

  function renderPreview(sec, data) {
    if (sec.key === 'hero') {
      return '<h2 style="font-family:\'Playfair Display\',serif;font-size:28px;color:#1F3B2C;margin-bottom:8px">' + esc(data.heading || '') + '</h2>' +
        '<p style="color:#8B877C;font-size:14px;margin-bottom:12px">' + esc(data.subheading || data.description || '') + '</p>' +
        (data.badge ? '<span style="font-size:11px;background:#C8962E;color:#1F3B2C;padding:4px 12px;border-radius:20px;font-weight:600">' + esc(data.badge) + '</span>' : '');
    }
    if (sec.key === 'content') {
      return '<h2 style="font-family:\'Playfair Display\',serif;font-size:24px;color:#1F3B2C;margin-bottom:12px">' + esc(data.heading || '') + '</h2>' +
        '<div style="font-size:13px;line-height:1.8;color:#2B2923">' + (data.body || '') + '</div>';
    }
    return '<pre style="font-size:11px;white-space:pre-wrap;color:#555">' + JSON.stringify(data, null, 2) + '</pre>';
  }

  async function saveSection(pageId, sec, container) {
    const data = collectFields(sec.fields, container);
    try {
      await api('/api/content', {
        method: 'PUT',
        body: JSON.stringify({ sections: [{ key: sec.key, html: JSON.stringify(data) }] })
      });
      toast('Saved: ' + sec.label + ' ✓');
      if (!state.pageData[pageId]) state.pageData[pageId] = {};
      state.pageData[pageId][sec.key] = data;
    } catch (e) { toast(e.message, 'error'); }
  }

  // ─── IMAGE UPLOAD HANDLER ───
  document.addEventListener('change', async (e) => {
    if (!e.target.classList.contains('file-upload')) return;
    const file = e.target.files[0];
    if (!file) return;
    const input = e.target.closest('.admin-image-row').querySelector('input[data-name]');
    const preview = e.target.closest('.admin-image-row').querySelector('.admin-image-preview');
    try {
      const dataBase64 = await fileToDataURL(file);
      const res = await api('/api/media', { method: 'POST', body: JSON.stringify({ name: file.name, dataBase64 }) });
      input.value = res.url;
      if (preview) { preview.src = res.url; preview.style.display = ''; }
      else {
        const img = document.createElement('img');
        img.className = 'admin-image-preview';
        img.src = res.url;
        input.closest('.admin-image-row').appendChild(img);
      }
      toast('Image uploaded ✓');
    } catch (err) { toast(err.message, 'error'); }
  });

  // ─── SETTINGS ───
  async function loadSettings() {
    try {
      const res = await api('/api/settings');
      const form = $('#settingsForm');
      Array.from(form.elements).forEach(el => {
        if (el.name && res.settings[el.name] !== undefined) el.value = res.settings[el.name];
      });
    } catch (e) { toast('Failed to load settings: ' + e.message, 'error'); }
  }

  $('#settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {};
    Array.from(e.target.elements).forEach(el => { if (el.name) data[el.name] = el.value; });
    try {
      await api('/api/settings', { method: 'PUT', body: JSON.stringify({ settings: data }) });
      toast('Settings saved ✓');
    } catch (err) { toast(err.message, 'error'); }
  });

  // ─── HELPERS ───
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escAttr(s) { return esc(s); }

  checkAuth();
})();
