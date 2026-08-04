/* ═══════════════ SUSA ADMIN PANEL ═══════════════ */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  const state = { email: null, activePage: null, pageData: {}, galleryItems: [], mediaItems: [], submissions: [], activeSubId: null };

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
    const titles = {
      dashboard: 'Dashboard', pages: 'Pages', settings: 'Settings', gallery: 'Gallery',
      media: 'Media Library', testimonials: 'Testimonials', faqs: 'FAQs',
      services: 'Services & Pricing', documents: 'Documents', seo: 'SEO', promo: 'Promo Bar',
      submissions: 'Submissions'
    };
    $('#tabTitle').textContent = titles[name] || name;
    if (name === 'dashboard') loadDashboard();
    if (name === 'settings') loadSettings();
    if (name === 'gallery') loadGallery();
    if (name === 'media') loadMediaLibrary();
    if (name === 'testimonials') loadTestimonials();
    if (name === 'faqs') loadFaqs();
    if (name === 'services') { loadServices(); loadFormats(); }
    if (name === 'documents') loadDocuments();
    if (name === 'seo') loadSeo();
    if (name === 'promo') loadPromo();
    if (name === 'submissions') loadSubmissions();
  }

  $$('.admin-nav-item').forEach(n => n.addEventListener('click', () => switchTab(n.dataset.tab)));
  $$('.admin-quick').forEach(q => q.addEventListener('click', () => switchTab(q.dataset.go)));

  // ─── DASHBOARD ───
  async function loadDashboard() {
    try {
      await api('/api/ping');
      await api('/api/content');
      const gallery = await api('/api/gallery');
      const subs = await api('/api/submissions').catch(() => ({ submissions: [] }));
      const tests = await api('/api/testimonials').catch(() => ({ items: [] }));
      const faqs = await api('/api/faqs').catch(() => ({ items: [] }));
      $('#statPages').textContent = PAGES.length;
      $('#statSections').textContent = PAGES.reduce((n, p) => n + p.sections.length, 0);
      $('#statGallery').textContent = gallery.items.length;
      $('#statSubmissions').textContent = (subs.submissions || []).length;
      $('#statTestimonials').textContent = (tests.items || []).length;
      $('#statFaqs').textContent = (faqs.items || []).length;
    } catch (e) {
      $('#statSubmissions').textContent = '—';
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
        body: JSON.stringify({ sections: [{ key: sec.key, page: pageId, label: sec.label, html: JSON.stringify(data) }] })
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
      const media = await api('/api/media-library', { method: 'POST', body: JSON.stringify({ name: file.name, type: (file.type || '').startsWith('video') ? 'video' : 'image', url: '', data64: dataBase64, size: file.size }) });
      const url = '/api/blob?id=' + media.id;
      input.value = url;
      if (preview) { preview.src = url; preview.style.display = ''; }
      else {
        const img = document.createElement('img');
        img.className = 'admin-image-preview';
        img.src = url;
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

  // ─── GALLERY ───
  async function loadGallery() {
    const grid = $('#galleryGrid');
    const empty = $('#galleryEmpty');
    grid.innerHTML = '<p class="admin-hint">Loading...</p>';
    empty.hidden = true;
    try {
      const res = await api('/api/gallery');
      state.galleryItems = res.items || [];
      if (!state.galleryItems.length) { grid.innerHTML = ''; empty.hidden = false; return; }
      renderGalleryGrid();
    } catch (e) { grid.innerHTML = '<p class="admin-hint">Error: ' + esc(e.message) + '</p>'; }
  }

  function renderGalleryGrid() {
    const grid = $('#galleryGrid');
    grid.innerHTML = '';
    state.galleryItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.dataset.id = item.id;
      div.innerHTML =
        '<div class="gallery-item-img">' +
          '<img src="' + escAttr(item.url) + '" alt="' + escAttr(item.title) + '" onerror="this.style.display=\'none\'">' +
          '<span class="gallery-item-type">' + esc(item.type) + '</span>' +
        '</div>' +
        '<div class="gallery-item-info">' +
          '<input type="text" class="gallery-item-title" value="' + escAttr(item.title) + '" placeholder="Title">' +
          '<div class="gallery-item-actions">' +
            '<button class="admin-btn admin-btn-ghost gallery-save-btn" data-id="' + item.id + '"><i class="fas fa-check"></i></button>' +
            '<button class="admin-btn gallery-del-btn" data-id="' + item.id + '" style="background:var(--a-danger);color:#fff;padding:8px 12px"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>';
      div.querySelector('.gallery-save-btn').addEventListener('click', async () => {
        const title = div.querySelector('.gallery-item-title').value;
        try {
          await api('/api/gallery/' + item.id, { method: 'PUT', body: JSON.stringify({ title, type: item.type, url: item.url, caption: item.caption || '' }) });
          toast('Updated ✓');
        } catch (e) { toast(e.message, 'error'); }
      });
      div.querySelector('.gallery-del-btn').addEventListener('click', async () => {
        if (!confirm('Delete this gallery item?')) return;
        try {
          await api('/api/gallery/' + item.id, { method: 'DELETE' });
          state.galleryItems = state.galleryItems.filter(g => g.id !== item.id);
          renderGalleryGrid();
          toast('Deleted ✓');
        } catch (e) { toast(e.message, 'error'); }
      });
      grid.appendChild(div);
    });
  }

  $('#galleryUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataBase64 = await fileToDataURL(file);
      const media = await api('/api/media-library', { method: 'POST', body: JSON.stringify({ name: file.name, type: 'image', url: '', data64: dataBase64, size: file.size }) });
      await api('/api/gallery', { method: 'POST', body: JSON.stringify({ title: file.name.replace(/\.[^.]+$/, ''), type: 'image', url: '/api/blob?id=' + media.id, caption: '' }) });
      toast('Image uploaded ✓');
      loadGallery();
    } catch (err) { toast(err.message, 'error'); }
    e.target.value = '';
  });

  // ─── SUBMISSIONS ───
  async function loadSubmissions() {
    const body = $('#submissionsBody');
    const empty = $('#subEmpty');
    body.innerHTML = '<tr><td colspan="10" class="admin-hint">Loading...</td></tr>';
    empty.hidden = true;
    try {
      const res = await api('/api/submissions');
      state.submissions = res.submissions || [];
      renderSubmissions();
    } catch (e) { body.innerHTML = '<tr><td colspan="10" class="admin-hint">Error: ' + esc(e.message) + '</td></tr>'; }
  }

  function renderSubmissions() {
    const body = $('#submissionsBody');
    const empty = $('#subEmpty');
    const typeFilter = $('#subFilter').value;
    const statusFilter = $('#subStatusFilter').value;
    let items = state.submissions;
    if (typeFilter) items = items.filter(s => s.type === typeFilter);
    if (statusFilter) items = items.filter(s => s.status === statusFilter);
    if (!items.length) { body.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;
    body.innerHTML = '';
    const statusLabels = { new: 'New', contacted: 'Contacted', in_review: 'In Review', completed: 'Completed' };
    const statusColors = { new: '#C8962E', contacted: '#3F6B4A', in_review: '#2C513C', completed: '#8B877C' };
    items.forEach(sub => {
      let d = {};
      try { d = JSON.parse(sub.data); } catch (e) {}
      const tr = document.createElement('tr');
      if (!sub.is_read) tr.className = 'sub-unread';
      const payLabel = { paid: 'Paid', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' }[sub.payment_status];
      tr.innerHTML =
        '<td>' + (sub.is_read ? '' : '<span class="sub-dot" title="Unread"></span>') + '</td>' +
        '<td>#' + sub.id + '</td>' +
        '<td><span class="sub-type-badge">' + esc(sub.type) + '</span></td>' +
        '<td>' + esc(d.fullName || d.name || '—') + '</td>' +
        '<td>' + esc(d.email || '—') + '</td>' +
        '<td>' + esc(d.phone || '—') + '</td>' +
        '<td><span class="sub-status-badge" style="background:' + (statusColors[sub.status] || '#888') + '">' + (statusLabels[sub.status] || sub.status) + '</span></td>' +
        '<td>' + (payLabel ? '<span class="sub-pay-badge">' + payLabel + '</span>' : '—') + '</td>' +
        '<td>' + formatDate(sub.created_at) + '</td>' +
        '<td><button class="admin-btn admin-btn-ghost sub-view-btn" data-id="' + sub.id + '" style="padding:6px 10px;font-size:11px"><i class="fas fa-eye"></i> View</button></td>';
      tr.querySelector('.sub-view-btn').addEventListener('click', () => openSubModal(sub));
      body.appendChild(tr);
    });
  }

  function openSubModal(sub) {
    state.activeSubId = sub.id;
    let d = {};
    try { d = JSON.parse(sub.data); } catch (e) {}
    $('#subModalTitle').textContent = (sub.type === 'franchise' ? 'Franchise' : 'Contact') + ' — #' + sub.id;
    const body = $('#subModalBody');
    body.innerHTML = '';
    const fields = Object.entries(d);
    fields.forEach(([k, v]) => {
      if (!v && v !== 0) return;
      const row = document.createElement('div');
      row.className = 'sub-detail-row';
      row.innerHTML = '<strong>' + esc(k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())) + '</strong><span>' + esc(String(v)) + '</span>';
      body.appendChild(row);
    });
    if (body.children.length === 0) body.innerHTML = '<p class="admin-hint" style="margin:0">No form data captured.</p>';
    $('#subModalStatus').value = sub.status || 'new';
    $('#subModalPayment').value = sub.payment_status || '';
    $('#subModalPaymentId').textContent = sub.payment_id ? 'Payment ID: ' + sub.payment_id + (sub.payment_method ? ' · ' + sub.payment_method : '') : '';
    $('#subModal').hidden = false;
    if (!sub.is_read) {
      api('/api/submissions', { method: 'PUT', body: JSON.stringify({ id: sub.id, is_read: 1 }) })
        .then(() => { sub.is_read = 1; renderSubmissions(); })
        .catch(() => {});
    }
  }

  $('#subModalClose').addEventListener('click', () => { $('#subModal').hidden = true; });
  $('#subModalOverlay').addEventListener('click', () => { $('#subModal').hidden = true; });

  $('#subModalSave').addEventListener('click', async () => {
    try {
      await api('/api/submissions', { method: 'PUT', body: JSON.stringify({
        id: state.activeSubId,
        status: $('#subModalStatus').value,
        payment_status: $('#subModalPayment').value,
        is_read: 1
      }) });
      const sub = state.submissions.find(s => s.id === state.activeSubId);
      if (sub) { sub.status = $('#subModalStatus').value; sub.payment_status = $('#subModalPayment').value; sub.is_read = 1; }
      renderSubmissions();
      toast('Submission updated ✓');
      $('#subModal').hidden = true;
    } catch (e) { toast(e.message, 'error'); }
  });

  $('#subModalDelete').addEventListener('click', async () => {
    if (!confirm('Delete this submission?')) return;
    try {
      await api('/api/submissions?id=' + state.activeSubId, { method: 'DELETE' });
      state.submissions = state.submissions.filter(s => s.id !== state.activeSubId);
      renderSubmissions();
      toast('Deleted ✓');
      $('#subModal').hidden = true;
    } catch (e) { toast(e.message, 'error'); }
  });

  $('#subFilter').addEventListener('change', renderSubmissions);
  $('#subStatusFilter').addEventListener('change', renderSubmissions);

  $('#csvExport').addEventListener('click', () => {
    const type = $('#subFilter').value;
    const status = $('#subStatusFilter').value;
    const qs = [];
    if (type) qs.push('type=' + encodeURIComponent(type));
    if (status) qs.push('status=' + encodeURIComponent(status));
    qs.push('export=csv');
    window.location.href = '/api/submissions?' + qs.join('&');
  });

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ─── MEDIA LIBRARY ───
  async function loadMediaLibrary() {
    const grid = $('#mediaGrid');
    const empty = $('#mediaEmpty');
    grid.innerHTML = '<p class="admin-hint">Loading...</p>';
    empty.hidden = true;
    try {
      const res = await api('/api/media-library');
      const items = res.items || [];
      if (!items.length) { grid.innerHTML = ''; empty.hidden = false; return; }
      state.mediaItems = items;
      renderMediaGrid();
    } catch (e) { grid.innerHTML = '<p class="admin-hint">Error: ' + esc(e.message) + '</p>'; }
  }

  function renderMediaGrid() {
    const grid = $('#mediaGrid');
    grid.innerHTML = '';
    (state.mediaItems || []).forEach(item => {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.title = 'Click to copy URL';
      div.style.cursor = 'pointer';
      const preview = item.type === 'video'
        ? '<video src="' + escAttr('/api/blob?id=' + item.id) + '" muted preload="metadata" class="media-thumb"></video>'
        : '<img src="' + escAttr('/api/blob?id=' + item.id + '&t=' + (item.id || '') + '') + '" alt="' + escAttr(item.name) + '" onerror="this.style.display=\'none\'">';
      div.innerHTML =
        '<div class="gallery-item-img">' + preview + '<span class="gallery-item-type">' + esc(item.type) + '</span></div>' +
        '<div class="gallery-item-info">' +
          '<span class="media-name" title="' + escAttr(item.name) + '">' + esc(item.name) + '</span>' +
          '<div class="gallery-item-actions">' +
            '<button class="admin-btn admin-btn-ghost media-copy-btn" data-id="' + item.id + '" title="Copy URL"><i class="fas fa-copy"></i></button>' +
            '<button class="admin-btn media-del-btn" data-id="' + item.id + '" title="Delete" style="background:var(--a-danger);color:#fff;padding:8px 12px"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>';
      div.querySelector('.media-copy-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        navigator.clipboard.writeText('/api/blob?id=' + item.id).then(() => toast('URL copied ✓')).catch(() => toast('Copy failed', 'error'));
      });
      div.addEventListener('click', (ev) => {
        if (ev.target.closest('button')) return;
        navigator.clipboard.writeText('/api/blob?id=' + item.id).then(() => toast('URL copied ✓')).catch(() => {});
      });
      div.querySelector('.media-del-btn').addEventListener('click', async (ev) => {
        ev.stopPropagation();
        if (!confirm('Delete this media item?\nNote: pages referencing it will break.')) return;
        try {
          await api('/api/media-library?id=' + item.id, { method: 'DELETE' });
          state.mediaItems = state.mediaItems.filter(m => m.id !== item.id);
          renderMediaGrid();
          toast('Deleted ✓');
        } catch (e) { toast(e.message, 'error'); }
      });
      grid.appendChild(div);
    });
  }

  $('#mediaUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataBase64 = await fileToDataURL(file);
      await api('/api/media-library', { method: 'POST', body: JSON.stringify({ name: file.name, type: (file.type || '').startsWith('video') ? 'video' : 'image', url: '', data64: dataBase64, size: file.size }) });
      toast('Media uploaded ✓');
      loadMediaLibrary();
    } catch (err) { toast(err.message, 'error'); }
    e.target.value = '';
  });

  // ─── GENERIC CRUD LIST BUILDER ───
  function crudRow(id, title, sub, cb, badge) {
    const row = document.createElement('div');
    row.className = 'crud-row';
    row.innerHTML =
      '<div class="crud-row-main"><div class="crud-row-title">' + title + '</div>' +
      (sub ? '<div class="crud-row-sub">' + sub + '</div>' : '') + '</div>' +
      (badge || '') +
      '<div style="display:flex;gap:6px;align-items:center">' +
        '<label class="crud-toggle" title="Toggle active"><input type="checkbox"><i></i></label>' +
        '<button class="admin-btn admin-btn-ghost crud-edit" style="padding:6px 10px;font-size:11px"><i class="fas fa-pen"></i></button>' +
        '<button class="admin-btn crud-del" style="background:var(--a-danger);color:#fff;padding:6px 10px;font-size:11px"><i class="fas fa-trash"></i></button>' +
      '</div>';
    const toggle = row.querySelector('.crud-toggle input');
    if (cb.onToggle) toggle.checked = !!cb.onToggle();
    toggle.addEventListener('change', () => { if (cb.onToggleCb) cb.onToggleCb(toggle.checked); });
    row.querySelector('.crud-edit').addEventListener('click', () => cb.onEdit());
    row.querySelector('.crud-del').addEventListener('click', () => cb.onDelete());
    return row;
  }

  // ─── TESTIMONIALS ───
  let testimonialsCache = [];
  async function loadTestimonials() {
    const list = $('#testimonialsList');
    const empty = $('#testimonialsEmpty');
    list.innerHTML = '<p class="admin-hint">Loading...</p>';
    empty.hidden = true;
    try {
      const res = await api('/api/testimonials');
      testimonialsCache = res.items || [];
      if (!testimonialsCache.length) { list.innerHTML = ''; empty.hidden = false; return; }
      renderTestimonials();
    } catch (e) { list.innerHTML = '<p class="admin-hint">Error: ' + esc(e.message) + '</p>'; }
  }

  function renderTestimonials() {
    const list = $('#testimonialsList');
    list.innerHTML = '';
    testimonialsCache.forEach(t => {
      list.appendChild(crudRow(
        t.id,
        '<i class="fas fa-quote-right" style="color:var(--a-gold);margin-right:6px"></i>' + esc(t.name) +
          (t.role ? ' <span style="color:#8B877C;font-weight:400">· ' + esc(t.role) + '</span>' : ''),
        esc((t.quote || '').slice(0, 90)) + (t.quote && t.quote.length > 90 ? '…' : ''),
        {
          onToggle: () => !!t.active,
          onToggleCb: async (checked) => { t.active = checked ? 1 : 0; try { await api('/api/testimonials?id=' + t.id, { method: 'PUT', body: JSON.stringify({ active: t.active }) }); toast('Updated ✓'); } catch (e) { toast(e.message, 'error'); } },
          onEdit: () => openTestimonialModal(t),
          onDelete: async () => { if (!confirm('Delete this testimonial?')) return; try { await api('/api/testimonials?id=' + t.id, { method: 'DELETE' }); testimonialsCache = testimonialsCache.filter(x => x.id !== t.id); renderTestimonials(); toast('Deleted ✓'); } catch (e) { toast(e.message, 'error'); } }
        }
      ));
    });
  }

  let testimonialEditingId = null;
  function openTestimonialModal(t) {
    testimonialEditingId = t ? t.id : null;
    $('#testimonialModalTitle').textContent = t ? 'Edit Testimonial' : 'Add Testimonial';
    $('#tName').value = t ? t.name : '';
    $('#tRole').value = t ? t.role : '';
    $('#tInitial').value = t ? t.initial : '';
    $('#tRating').value = t ? t.rating : 5;
    $('#tQuote').value = t ? t.quote : '';
    $('#tSort').value = t ? t.sort : 0;
    $('#tActive').checked = t ? !!t.active : true;
    $('#tDelete').hidden = !t;
    $('#testimonialModal').hidden = false;
  }

  $('#addTestimonial').addEventListener('click', () => openTestimonialModal(null));
  $('#testimonialModalClose').addEventListener('click', () => { $('#testimonialModal').hidden = true; });
  $('#testimonialModalOverlay').addEventListener('click', () => { $('#testimonialModal').hidden = true; });

  $('#tSave').addEventListener('click', async () => {
    const body = {
      name: $('#tName').value.trim(),
      role: $('#tRole').value.trim(),
      initial: $('#tInitial').value.trim(),
      rating: Number($('#tRating').value) || 5,
      quote: $('#tQuote').value.trim(),
      sort: Number($('#tSort').value) || 0,
      active: $('#tActive').checked ? 1 : 0
    };
    if (!body.name) return toast('Name is required', 'error');
    try {
      if (testimonialEditingId) await api('/api/testimonials?id=' + testimonialEditingId, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/api/testimonials', { method: 'POST', body: JSON.stringify(body) });
      toast('Saved ✓');
      $('#testimonialModal').hidden = true;
      loadTestimonials();
    } catch (e) { toast(e.message, 'error'); }
  });

  $('#tDelete').addEventListener('click', async () => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      await api('/api/testimonials?id=' + testimonialEditingId, { method: 'DELETE' });
      toast('Deleted ✓');
      $('#testimonialModal').hidden = true;
      loadTestimonials();
    } catch (e) { toast(e.message, 'error'); }
  });

  // ─── FAQS ───
  let faqsCache = [];
  async function loadFaqs() {
    const list = $('#faqsList');
    const empty = $('#faqsEmpty');
    list.innerHTML = '<p class="admin-hint">Loading...</p>';
    empty.hidden = true;
    try {
      const res = await api('/api/faqs');
      faqsCache = res.items || [];
      if (!faqsCache.length) { list.innerHTML = ''; empty.hidden = false; return; }
      renderFaqs();
    } catch (e) { list.innerHTML = '<p class="admin-hint">Error: ' + esc(e.message) + '</p>'; }
  }

  function renderFaqs() {
    const list = $('#faqsList');
    list.innerHTML = '';
    faqsCache.forEach(f => {
      const pageBadge = f.page ? '<span class="sub-type-badge" style="margin-left:6px">' + esc(f.page) + '</span>' : '';
      list.appendChild(crudRow(
        f.id,
        esc(f.question || ''),
        esc((f.answer || '').slice(0, 90)) + (f.answer && f.answer.length > 90 ? '…' : '') + pageBadge,
        {
          onToggle: () => !!f.active,
          onToggleCb: async (checked) => { f.active = checked ? 1 : 0; try { await api('/api/faqs?id=' + f.id, { method: 'PUT', body: JSON.stringify({ active: f.active }) }); toast('Updated ✓'); } catch (e) { toast(e.message, 'error'); } },
          onEdit: () => openFaqModal(f),
          onDelete: async () => { if (!confirm('Delete this FAQ?')) return; try { await api('/api/faqs?id=' + f.id, { method: 'DELETE' }); faqsCache = faqsCache.filter(x => x.id !== f.id); renderFaqs(); toast('Deleted ✓'); } catch (e) { toast(e.message, 'error'); } }
        }
      ));
    });
  }

  let faqEditingId = null;
  function openFaqModal(f) {
    faqEditingId = f ? f.id : null;
    $('#faqModalTitle').textContent = f ? 'Edit FAQ' : 'Add FAQ';
    $('#fPage').value = f ? f.page : '';
    $('#fQuestion').value = f ? f.question : '';
    $('#fAnswer').value = f ? f.answer : '';
    $('#fSort').value = f ? f.sort : 0;
    $('#fActive').checked = f ? !!f.active : true;
    $('#fDelete').hidden = !f;
    $('#faqModal').hidden = false;
  }

  $('#addFaq').addEventListener('click', () => openFaqModal(null));
  $('#faqModalClose').addEventListener('click', () => { $('#faqModal').hidden = true; });
  $('#faqModalOverlay').addEventListener('click', () => { $('#faqModal').hidden = true; });

  $('#fSave').addEventListener('click', async () => {
    const body = {
      page: $('#fPage').value,
      question: $('#fQuestion').value.trim(),
      answer: $('#fAnswer').value.trim(),
      sort: Number($('#fSort').value) || 0,
      active: $('#fActive').checked ? 1 : 0
    };
    if (!body.question) return toast('Question is required', 'error');
    try {
      if (faqEditingId) await api('/api/faqs?id=' + faqEditingId, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/api/faqs', { method: 'POST', body: JSON.stringify(body) });
      toast('Saved ✓');
      $('#faqModal').hidden = true;
      loadFaqs();
    } catch (e) { toast(e.message, 'error'); }
  });

  $('#fDelete').addEventListener('click', async () => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await api('/api/faqs?id=' + faqEditingId, { method: 'DELETE' });
      toast('Deleted ✓');
      $('#faqModal').hidden = true;
      loadFaqs();
    } catch (e) { toast(e.message, 'error'); }
  });

  // ─── SERVICES ───
  let servicesCache = [];
  async function loadServices() {
    const list = $('#servicesList');
    const empty = $('#servicesEmpty');
    list.innerHTML = '<p class="admin-hint">Loading...</p>';
    empty.hidden = true;
    try {
      const res = await api('/api/services');
      servicesCache = res.items || [];
      if (!servicesCache.length) { list.innerHTML = ''; empty.hidden = false; }
      else renderServices();
    } catch (e) { list.innerHTML = '<p class="admin-hint">Error: ' + esc(e.message) + '</p>'; }
  }

  function renderServices() {
    const list = $('#servicesList');
    list.innerHTML = '';
    servicesCache.forEach(s => {
      list.appendChild(crudRow(
        s.id,
        '<i class="fas ' + esc(s.icon) + '" style="color:var(--a-gold);margin-right:6px"></i>' + esc(s.title),
        esc((s.description || '').slice(0, 90)) + (s.description && s.description.length > 90 ? '…' : ''),
        {
          onToggle: () => !!s.active,
          onToggleCb: async (checked) => { s.active = checked ? 1 : 0; try { await api('/api/services?id=' + s.id, { method: 'PUT', body: JSON.stringify({ active: s.active }) }); toast('Updated ✓'); } catch (e) { toast(e.message, 'error'); } },
          onEdit: () => openServiceModal(s),
          onDelete: async () => { if (!confirm('Delete this service?')) return; try { await api('/api/services?id=' + s.id, { method: 'DELETE' }); servicesCache = servicesCache.filter(x => x.id !== s.id); renderServices(); toast('Deleted ✓'); } catch (e) { toast(e.message, 'error'); } }
        }
      ));
    });
  }

  let serviceEditingId = null;
  function openServiceModal(s) {
    serviceEditingId = s ? s.id : null;
    $('#serviceModalTitle').textContent = s ? 'Edit Service' : 'Add Service';
    $('#sIcon').value = s ? s.icon : '';
    $('#sColor').value = s ? s.color : 'gold';
    $('#sTitle').value = s ? s.title : '';
    $('#sDesc').value = s ? s.description : '';
    $('#sSort').value = s ? s.sort : 0;
    $('#sActive').checked = s ? !!s.active : true;
    $('#sDelete').hidden = !s;
    $('#serviceModal').hidden = false;
  }

  $('#addService').addEventListener('click', () => openServiceModal(null));
  $('#serviceModalClose').addEventListener('click', () => { $('#serviceModal').hidden = true; });
  $('#serviceModalOverlay').addEventListener('click', () => { $('#serviceModal').hidden = true; });

  $('#sSave').addEventListener('click', async () => {
    const body = {
      icon: $('#sIcon').value.trim(),
      color: $('#sColor').value,
      title: $('#sTitle').value.trim(),
      description: $('#sDesc').value.trim(),
      sort: Number($('#sSort').value) || 0,
      active: $('#sActive').checked ? 1 : 0
    };
    if (!body.title) return toast('Title is required', 'error');
    try {
      if (serviceEditingId) await api('/api/services?id=' + serviceEditingId, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/api/services', { method: 'POST', body: JSON.stringify(body) });
      toast('Saved ✓');
      $('#serviceModal').hidden = true;
      loadServices();
    } catch (e) { toast(e.message, 'error'); }
  });

  $('#sDelete').addEventListener('click', async () => {
    if (!confirm('Delete this service?')) return;
    try {
      await api('/api/services?id=' + serviceEditingId, { method: 'DELETE' });
      toast('Deleted ✓');
      $('#serviceModal').hidden = true;
      loadServices();
    } catch (e) { toast(e.message, 'error'); }
  });

  // ─── FORMATS ───
  let formatsCache = [];
  async function loadFormats() {
    const list = $('#formatsList');
    list.innerHTML = '<p class="admin-hint">Loading...</p>';
    try {
      const res = await api('/api/formats');
      formatsCache = res.items || [];
      renderFormats();
    } catch (e) { list.innerHTML = '<p class="admin-hint">Error: ' + esc(e.message) + '</p>'; }
  }

  function renderFormats() {
    const list = $('#formatsList');
    list.innerHTML = '';
    formatsCache.forEach(fm => {
      list.appendChild(crudRow(
        fm.id,
        esc(fm.name) + ' <span style="color:var(--a-gold)">· ' + esc(fm.range) + '</span>',
        esc((fm.description || '').slice(0, 90)) + (fm.description && fm.description.length > 90 ? '…' : ''),
        {
          onToggle: () => !!fm.active,
          onToggleCb: async (checked) => { fm.active = checked ? 1 : 0; try { await api('/api/formats?id=' + fm.id, { method: 'PUT', body: JSON.stringify({ active: fm.active }) }); toast('Updated ✓'); } catch (e) { toast(e.message, 'error'); } },
          onEdit: () => openFormatModal(fm),
          onDelete: async () => { if (!confirm('Delete this format?')) return; try { await api('/api/formats?id=' + fm.id, { method: 'DELETE' }); formatsCache = formatsCache.filter(x => x.id !== fm.id); renderFormats(); toast('Deleted ✓'); } catch (e) { toast(e.message, 'error'); } }
        }
      ));
    });
  }

  let formatEditingId = null;
  function openFormatModal(fm) {
    formatEditingId = fm ? fm.id : null;
    $('#formatModalTitle').textContent = fm ? 'Edit Format' : 'Add Format';
    $('#fmName').value = fm ? fm.name : '';
    $('#fmRange').value = fm ? fm.range : '';
    $('#fmDesc').value = fm ? fm.description : '';
    $('#fmSort').value = fm ? fm.sort : 0;
    $('#fmActive').checked = fm ? !!fm.active : true;
    $('#fmDelete').hidden = !fm;
    $('#formatModal').hidden = false;
  }

  $('#addFormat').addEventListener('click', () => openFormatModal(null));
  $('#formatModalClose').addEventListener('click', () => { $('#formatModal').hidden = true; });
  $('#formatModalOverlay').addEventListener('click', () => { $('#formatModal').hidden = true; });

  $('#fmSave').addEventListener('click', async () => {
    const body = {
      name: $('#fmName').value.trim(),
      range: $('#fmRange').value.trim(),
      description: $('#fmDesc').value.trim(),
      sort: Number($('#fmSort').value) || 0,
      active: $('#fmActive').checked ? 1 : 0
    };
    if (!body.name) return toast('Name is required', 'error');
    try {
      if (formatEditingId) await api('/api/formats?id=' + formatEditingId, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/api/formats', { method: 'POST', body: JSON.stringify(body) });
      toast('Saved ✓');
      $('#formatModal').hidden = true;
      loadFormats();
    } catch (e) { toast(e.message, 'error'); }
  });

  $('#fmDelete').addEventListener('click', async () => {
    if (!confirm('Delete this format?')) return;
    try {
      await api('/api/formats?id=' + formatEditingId, { method: 'DELETE' });
      toast('Deleted ✓');
      $('#formatModal').hidden = true;
      loadFormats();
    } catch (e) { toast(e.message, 'error'); }
  });

  // ─── DOCUMENTS ───
  let documentsCache = [];
  async function loadDocuments() {
    const list = $('#documentsList');
    list.innerHTML = '<p class="admin-hint">Loading...</p>';
    try {
      const res = await api('/api/documents');
      documentsCache = res.items || [];
      renderDocuments();
    } catch (e) { list.innerHTML = '<p class="admin-hint">Error: ' + esc(e.message) + '</p>'; }
  }

  function renderDocuments() {
    const list = $('#documentsList');
    list.innerHTML = '';
    documentsCache.forEach(d => {
      const linkEl = '<i class="' + esc(d.icon || 'fas fa-file') + '" style="color:var(--a-gold);margin-right:6px"></i>' + esc(d.title) +
        ' <a class="crud-link" href="' + escAttr(d.url) + '" target="_blank" rel="noopener">open <i class="fas fa-external-link-alt"></i></a>';
      list.appendChild(crudRow(
        d.id,
        linkEl,
        esc(d.url || ''),
        {
          onToggle: () => !!d.active,
          onToggleCb: async (checked) => { d.active = checked ? 1 : 0; try { await api('/api/documents?id=' + d.id, { method: 'PUT', body: JSON.stringify({ active: d.active }) }); toast('Updated ✓'); } catch (e) { toast(e.message, 'error'); } },
          onEdit: () => openDocumentModal(d),
          onDelete: async () => { if (!confirm('Delete this document?')) return; try { await api('/api/documents?id=' + d.id, { method: 'DELETE' }); documentsCache = documentsCache.filter(x => x.id !== d.id); renderDocuments(); toast('Deleted ✓'); } catch (e) { toast(e.message, 'error'); } }
        }
      ));
    });
  }

  let documentEditingId = null;
  function openDocumentModal(d) {
    documentEditingId = d ? d.id : null;
    $('#documentModalTitle').textContent = d ? 'Edit Document' : 'Add Document';
    $('#dTitle').value = d ? d.title : '';
    $('#dIcon').value = d ? d.icon : 'fas fa-file';
    $('#dUrl').value = d ? d.url : '';
    $('#dFile').value = '';
    $('#dSort').value = d ? d.sort : 0;
    $('#dActive').checked = d ? !!d.active : true;
    $('#dDelete').hidden = !d;
    $('#documentModal').hidden = false;
  }

  $('#addDocument').addEventListener('click', () => openDocumentModal(null));
  $('#documentModalClose').addEventListener('click', () => { $('#documentModal').hidden = true; });
  $('#documentModalOverlay').addEventListener('click', () => { $('#documentModal').hidden = true; });

  $('#dFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataBase64 = await fileToDataURL(file);
      const media = await api('/api/media-library', { method: 'POST', body: JSON.stringify({ name: file.name, type: file.type && file.type.startsWith('video') ? 'video' : 'image', url: '', data64: dataBase64, size: file.size }) });
      $('#dUrl').value = '/api/blob?id=' + media.id;
      toast('File uploaded — URL set ✓');
    } catch (err) { toast(err.message, 'error'); }
  });

  $('#dSave').addEventListener('click', async () => {
    const body = {
      title: $('#dTitle').value.trim(),
      icon: $('#dIcon').value.trim() || 'fas fa-file',
      url: $('#dUrl').value.trim(),
      sort: Number($('#dSort').value) || 0,
      active: $('#dActive').checked ? 1 : 0
    };
    if (!body.title || !body.url) return toast('Title and URL are required', 'error');
    try {
      if (documentEditingId) await api('/api/documents?id=' + documentEditingId, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/api/documents', { method: 'POST', body: JSON.stringify(body) });
      toast('Saved ✓');
      $('#documentModal').hidden = true;
      loadDocuments();
    } catch (e) { toast(e.message, 'error'); }
  });

  $('#dDelete').addEventListener('click', async () => {
    if (!confirm('Delete this document?')) return;
    try {
      await api('/api/documents?id=' + documentEditingId, { method: 'DELETE' });
      toast('Deleted ✓');
      $('#documentModal').hidden = true;
      loadDocuments();
    } catch (e) { toast(e.message, 'error'); }
  });

  // ─── SEO ───
  async function loadSeo() {
    const list = $('#seoList');
    list.innerHTML = '<p class="admin-hint">Loading...</p>';
    try {
      const res = await api('/api/seo');
      const items = res.items || [];
      list.innerHTML = '';
      items.forEach(s => {
        const card = document.createElement('div');
        card.className = 'seo-card';
        card.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
            '<strong style="color:var(--a-primary);font-size:13px;text-transform:capitalize">' + esc(s.page) + '</strong>' +
            '<button class="admin-btn admin-btn-gold seo-save-btn" data-page="' + escAttr(s.page) + '" style="padding:6px 12px;font-size:11px"><i class="fas fa-floppy-disk"></i> Save</button>' +
          '</div>' +
          '<label class="admin-field" style="margin-bottom:8px"><span>Title</span><input type="text" class="seo-field" data-k="title" value="' + escAttr(s.title || '') + '"></label>' +
          '<label class="admin-field" style="margin-bottom:8px"><span>Meta description</span><textarea class="seo-field" data-k="description" rows="2">' + esc(s.description || '') + '</textarea></label>' +
          '<label class="admin-field" style="margin-bottom:8px"><span>OG image URL</span><input type="text" class="seo-field" data-k="og_image" value="' + escAttr(s.og_image || '') + '"></label>' +
          '<label class="admin-field" style="margin-bottom:0"><span>Keywords</span><input type="text" class="seo-field" data-k="keywords" value="' + escAttr(s.keywords || '') + '"></label>';
        const btn = card.querySelector('.seo-save-btn');
        btn.addEventListener('click', async () => {
          const data = { page: s.page };
          card.querySelectorAll('.seo-field').forEach(inp => { data[inp.dataset.k] = inp.value; });
          try {
            await api('/api/seo', { method: 'PUT', body: JSON.stringify(data) });
            toast('SEO saved ✓');
          } catch (e) { toast(e.message, 'error'); }
        });
        list.appendChild(card);
      });
    } catch (e) { list.innerHTML = '<p class="admin-hint">Error: ' + esc(e.message) + '</p>'; }
  }

  // ─── PROMO BAR ───
  async function loadPromo() {
    try {
      const res = await api('/api/promo');
      $('#promoForm').elements['promoText'].value = res.text || '';
      $('#promoForm').elements['promoUrl'].value = res.url || '';
      $('#promoForm').elements['promoEnabled'].checked = res.enabled === '1' || res.enabled === 'true' || res.enabled === true;
    } catch (e) { toast('Failed to load promo: ' + e.message, 'error'); }
  }

  $('#promoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const enabled = $('#promoForm').elements['promoEnabled'].checked ? '1' : '';
    try {
      await api('/api/promo', { method: 'PUT', body: JSON.stringify({ enabled, text: e.target.elements['promoText'].value, url: e.target.elements['promoUrl'].value }) });
      toast('Promo bar saved ✓');
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
