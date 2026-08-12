const { createClient } = require('@libsql/client');

let db = null;

async function migrate(db) {
  async function addCol(table, col, def) {
    try {
      const info = await db.execute('PRAGMA table_info(' + table + ')');
      if (!info.rows.some(r => r.name === col)) {
        await db.execute('ALTER TABLE ' + table + ' ADD COLUMN ' + col + ' ' + def);
      }
    } catch (e) {}
  }
  await addCol('gallery', 'data64', 'TEXT DEFAULT \'\'');
  await addCol('gallery', 'active', 'INTEGER DEFAULT 1');
  await addCol('submissions', 'payment_status', 'TEXT DEFAULT \'\'');
  await addCol('submissions', 'payment_id', 'TEXT DEFAULT \'\'');
  await addCol('submissions', 'payment_method', 'TEXT DEFAULT \'\'');
  await addCol('submissions', 'is_read', 'INTEGER DEFAULT 0');
}

async function getDB() {
  if (db) return db;
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');
  db = createClient({ url, authToken: token || undefined });
  await db.execute('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS content (key TEXT PRIMARY KEY, page TEXT NOT NULL, label TEXT NOT NULL, html TEXT NOT NULL DEFAULT \'\', updated_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL DEFAULT \'\', type TEXT NOT NULL DEFAULT \'image\', url TEXT NOT NULL, caption TEXT NOT NULL DEFAULT \'\', sort INTEGER NOT NULL DEFAULT 0)');
  await db.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT \'\')');
  await db.execute('CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, data TEXT NOT NULL DEFAULT \'{}\', status TEXT NOT NULL DEFAULT \'new\', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT \'\', role TEXT NOT NULL DEFAULT \'\', quote TEXT NOT NULL DEFAULT \'\', rating INTEGER NOT NULL DEFAULT 5, initial TEXT NOT NULL DEFAULT \'\', sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1)');
  await db.execute('CREATE TABLE IF NOT EXISTS faqs (id INTEGER PRIMARY KEY AUTOINCREMENT, page TEXT NOT NULL DEFAULT \'\', question TEXT NOT NULL DEFAULT \'\', answer TEXT NOT NULL DEFAULT \'\', sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1)');
  await db.execute('CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, icon TEXT NOT NULL DEFAULT \'\', title TEXT NOT NULL DEFAULT \'\', description TEXT NOT NULL DEFAULT \'\', color TEXT NOT NULL DEFAULT \'gold\', sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1)');
  await db.execute('CREATE TABLE IF NOT EXISTS formats (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT \'\', range TEXT NOT NULL DEFAULT \'\', description TEXT NOT NULL DEFAULT \'\', sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1)');
  await db.execute('CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL DEFAULT \'\', icon TEXT NOT NULL DEFAULT \'fas fa-file\', url TEXT NOT NULL DEFAULT \'\', sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1)');
  await db.execute('CREATE TABLE IF NOT EXISTS media_lib (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT \'\', type TEXT NOT NULL DEFAULT \'image\', url TEXT NOT NULL DEFAULT \'\', data64 TEXT NOT NULL DEFAULT \'\', size INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS seo (page TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT \'\', description TEXT NOT NULL DEFAULT \'\', og_image TEXT NOT NULL DEFAULT \'\', keywords TEXT NOT NULL DEFAULT \'\')');
  await migrate(db);
  await seed(db);
  return db;
}

const crypto = require('node:crypto');
function scryptHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  return salt + ':' + crypto.scryptSync(password, salt, 32).toString('hex');
}

async function seed(db) {
  const r = await db.execute('SELECT COUNT(*) AS c FROM users');
  if (r.rows[0].c === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@susaenterprise.com';
    const pw = process.env.ADMIN_PASSWORD || 'Susa@4999!Admin';
    await db.execute({ sql: 'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)', args: [email, scryptHash(pw), Date.now()] });
  }
  const settings = [
    ['phoneIndia', '+91 96094 06997'], ['phoneKSA', '+966 590831351'],
    ['email', 'hello@susaenterprise.com'], ['addressLine1', '82/6 Shaikh Para Lane, Chatterjee Hat'],
    ['addressLine2', 'Howrah, West Bengal 711104, India'],
    ['socialInstagram', ''], ['socialLinkedin', ''], ['socialFacebook', ''],
    ['registrationFee', '\u20B94,999'],
    ['promoEnabled', ''], ['promoText', ''], ['promoUrl', ''],
    ['notifyWebhook', ''],
  ];
  for (const [k, v] of settings) await db.execute({ sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', args: [k, v] });

  const gc = await db.execute('SELECT COUNT(*) AS c FROM gallery');
  if (gc.rows[0].c === 0) {
    const imgs = [
      ['Bakery display counters', 'image', 'images/ms95sv7dslcgii.webp'],
      ['Counter & cafe front', 'image', 'images/ms96chdzyprn13.webp'],
      ['Bakery bar setup', 'image', 'images/ms96h5of97hsiy.webp'],
      ['Cafe lounge seating', 'image', 'images/ms96ljvrd7qb13.webp'],
      ['Merchandising display', 'image', 'images/ms95pxbhfcqeff.webp'],
      ['Store interior', 'image', 'images/ms903o7mucwo2w.webp'],
      ['Fit-out progress', 'image', 'images/ms91fajqr825ij.webp'],
      ['Counter detail', 'image', 'images/ms90s7pwfaa5fw.webp'],
      ['Brand merchandising', 'image', 'images/ms90ijlo3xa53q.webp'],
      ['Seating corner', 'image', 'images/ms90ib75sx68p6.webp'],
      ['Counter range', 'image', 'images/ms8zrllphzt896.webp'],
      ['Bakery shelf display', 'image', 'images/ms8zra2nroqe4y.webp'],
    ];
    for (let i = 0; i < imgs.length; i++) {
      await db.execute({ sql: 'INSERT INTO gallery (title, type, url, caption, sort) VALUES (?, ?, ?, ?, ?)', args: [imgs[i][0], imgs[i][1], imgs[i][2], '', i] });
    }
  }

  const tc = await db.execute('SELECT COUNT(*) AS c FROM testimonials');
  if (tc.rows[0].c === 0) {
    const tests = [
      ['Sarah Mitchell', 'Partner, Chicago', 'SUSA made the entire process seamless. From design to grand opening, their team was with me every step of the way. Our store exceeded every expectation.', 'SM'],
      ['Marcus Chen', 'Partner, Seattle', 'The design-led approach is what drew me to SUSA. Our customers constantly compliment the space. It is not just a bakery - it is an experience.', 'MC'],
      ['James & Priya', 'Multi-Unit Partners, DFW', 'We opened our first unit and signed for two more territories. The support system SUSA provides makes scaling effortless.', 'JP'],
    ];
    for (let i = 0; i < tests.length; i++) {
      await db.execute({ sql: 'INSERT INTO testimonials (name, role, quote, rating, initial, sort) VALUES (?, ?, ?, 5, ?, ?)', args: [tests[i][0], tests[i][1], tests[i][2], tests[i][3], i] });
    }
  }

  const fc = await db.execute('SELECT COUNT(*) AS c FROM faqs');
  if (fc.rows[0].c === 0) {
    const faqRows = [
      ['home', 'What does the franchise investment include?', 'Your investment covers store design & 3D renders, complete interior fit-out, display counter(s), bakery equipment, furniture, signage, branding materials, staff training, operations manual, and launch support. A one-time \u20B94,999 registration fee applies at application.'],
      ['home', 'Why should I invest in a bakery franchise in India?', "India's bakery market is valued at over \u20B9800 Crore and growing at 25-30% annually. It's one of the fastest-growing businesses with high demand driven by changing lifestyles and celebrations. With up to 40% profit margins, it's a highly profitable opportunity."],
      ['home', 'How do I start a bakery franchise with SUSA?', 'Simply fill out our franchise application form or call us. Our team will schedule a discovery call, discuss your goals, and guide you through the entire process from site selection to grand opening.'],
      ['home', 'What licenses are needed to open a bakery?', "You'll need GST registration, FSSAI license, Local Municipal Corporation Health license, Fire license, and Police Eating House license. The first three are required before opening; the others can be obtained after launch."],
      ['home', 'How much can I earn from a SUSA franchise?', 'ROI depends on your chosen format, location, and operations. Kiosk owners can expect $5K-$10K monthly, while Flagship operators can earn $35K-$60K monthly. Our team provides detailed projections during the discovery call.'],
      ['home', 'Do I need bakery experience?', 'No. SUSA is designed for first-time owners as well as experienced operators. We provide comprehensive training, a detailed operations manual, and ongoing support so you can run your store with confidence.'],
      ['home', 'How long does it take to open?', 'Most SUSA stores open within 10-12 weeks from design approval. Timelines vary by format, site readiness, and local permits.'],
      ['home', 'What ongoing support do you provide?', 'We offer 24/7 partner support, quarterly business reviews, marketing guidance, supply chain access, menu development assistance, regular menu updates, and access to our partner portal with training resources.'],
      ['home', 'What makes SUSA different from other franchises?', "SUSA is a turnkey bakery concept - we don't just sell a franchise, we build your entire store. From design to equipment to training, everything is included. Registration is a one-time \u20B94,999; there's no franchise fee."],
      ['home', 'Can I own multiple SUSA outlets?', 'Yes! Many of our partners operate multiple units. After successfully running your first store, we offer expanded territory opportunities and multi-unit franchise options.'],
      ['franchise', 'How do I start a bakery franchise with SUSA?', 'Fill out our franchise application form or call us. Our team will schedule a discovery call, discuss your goals, and guide you through the entire process from site selection to grand opening.'],
      ['franchise', 'What licenses are needed to open a bakery?', "You'll need GST registration, FSSAI license, Local Municipal Corporation Health license, Fire license, and Police Eating House license. The first three are required before opening."],
      ['franchise', 'How much can I earn from a SUSA franchise?', 'ROI depends on your chosen format, location, and operations. Kiosk owners can expect $5K-$10K monthly, while Flagship operators can earn $35K-$60K monthly.'],
      ['franchise', 'Do I need bakery experience?', 'No. SUSA is designed for first-time owners as well as experienced operators. We provide comprehensive training and ongoing support.'],
      ['franchise', 'How long does it take to open?', 'Most SUSA stores open within 10-12 weeks from design approval. Timelines vary by format, site readiness, and local permits.'],
      ['franchise', 'Can I own multiple SUSA outlets?', 'Yes! Many of our partners operate multiple units. After successfully running your first store, we offer expanded territory opportunities.'],
      ['contact', 'Is there an application fee?', 'Yes. A one-time, non-refundable registration fee of \u20B94,999 is payable when you submit your franchise application. There is no separate franchise fee - your investment goes directly into your store.'],
      ['contact', 'What territories are available?', 'We operate on a single-region model to ensure focused support. Contact us to discuss availability in your target area.'],
      ['contact', 'How long does the process take?', 'Most SUSA stores open within 10-12 weeks from design approval. Timelines vary by format, site readiness, and local permits.'],
      ['contact', 'Do I need bakery experience?', 'No. Our comprehensive training program and operations manual are designed for first-time owners as well as experienced operators.'],
      ['contact', 'What ongoing support is provided?', 'We offer 24/7 partner support, quarterly business reviews, marketing guidance, supply chain access, menu development assistance, and access to our partner portal.'],
      ['contact', 'Can I buy equipment without a franchise?', 'Yes. We supply display counters, bakery equipment, and fit-out services to independent bakeries and other food businesses. Contact us for a trade quote.'],
    ];
    for (let i = 0; i < faqRows.length; i++) {
      await db.execute({ sql: 'INSERT INTO faqs (page, question, answer, sort) VALUES (?, ?, ?, ?)', args: [faqRows[i][0], faqRows[i][1], faqRows[i][2], i] });
    }
  }

  const sc = await db.execute('SELECT COUNT(*) AS c FROM services');
  if (sc.rows[0].c === 0) {
    const rows = [
      ['fa-display', 'Display Counters', 'Curved & straight glass counters with integrated LED lighting, temperature control, and modular configurations for any store format.', 'gold'],
      ['fa-bread-slice', 'Brand Merchandising', 'Wire baskets, hanging racks, hexagon shelves, arched back-wall displays, and glass viennoiserie cases that drive impulse purchases.', 'lavender'],
      ['fa-building', 'Full Fit-Out', 'Complete store interior design - flooring, ceiling, lighting, materials, branded feature walls, and full project management.', 'gold'],
      ['fa-couch', 'Caf\u00e9 Seating', 'Industrial, lounge, biophilic, and bar-counter seating styles designed for comfort and atmosphere across every format.', 'lavender'],
      ['fa-lightbulb', 'Lighting & Signage', 'Dome pendants, track systems, menu board frames, digital screens, and external signage packages that define your brand.', 'green'],
      ['fa-fire-burner', 'Bakery Equipment', 'Deck ovens, espresso stations, proofer cabinets, mixers, POS hardware, and commercial refrigeration systems.', 'gold'],
    ];
    for (let i = 0; i < rows.length; i++) {
      await db.execute({ sql: 'INSERT INTO services (icon, title, description, color, sort) VALUES (?, ?, ?, ?, ?)', args: [rows[i][0], rows[i][1], rows[i][2], rows[i][3], i] });
    }
  }

  const fmtc = await db.execute('SELECT COUNT(*) AS c FROM formats');
  if (fmtc.rows[0].c === 0) {
    const rows = [
      ['Kiosk', '\u20B910 - 15 Lakh', 'Compact high-street kiosk concept with counter service, ideal for malls and transit hubs.'],
      ['Compact', '\u20B920 - 30 Lakh', 'Full bakery & caf\u00e9 with seating for 12-20 guests, perfect for neighbourhood high streets.'],
      ['Lounge', '\u20B935 - 50 Lakh', 'Premium caf\u00e9 lounge with seating for 30-50 guests, complete menu range, and merchandising wall.'],
      ['Flagship', '\u20B950 - 80 Lakh', 'Large-format flagship store with full bakery production, lounge seating, and brand experience centre.'],
    ];
    for (let i = 0; i < rows.length; i++) {
      await db.execute({ sql: 'INSERT INTO formats (name, range, description, sort) VALUES (?, ?, ?, ?)', args: [rows[i][0], rows[i][1], rows[i][2], i] });
    }
  }

  const docc = await db.execute('SELECT COUNT(*) AS c FROM documents');
  if (docc.rows[0].c === 0) {
    const rows = [
      ['Udyam Registration', 'fa-certificate', 'images/Print  Udyam Registration Certificate.pdf'],
      ['Online NOC', 'fa-file-contract', 'images/Online NOC.pdf'],
      ['Company PAN Card', 'fa-id-card', 'images/PHOTO-2025-11-27-15-19-44.jpg.jpeg'],
      ['TAN Number', 'fa-hashtag', 'images/PHOTO-2025-11-28-13-44-45.jpg.jpeg'],
    ];
    for (let i = 0; i < rows.length; i++) {
      await db.execute({ sql: 'INSERT INTO documents (title, icon, url, sort) VALUES (?, ?, ?, ?)', args: [rows[i][0], rows[i][1], rows[i][2], i] });
    }
  }

  const seoc = await db.execute('SELECT COUNT(*) AS c FROM seo');
  if (seoc.rows[0].c === 0) {
    const rows = [
      ['home', 'SUSA ENTERPRISE — Bakery & Café Franchise in Howrah, West Bengal', 'Start your bakery franchise in Howrah, West Bengal. SUSA ENTERPRISE delivers turnkey bakery & café store concepts — design, equipment, training & support. Investment from ₹10 Lakh.', 'images/Untitled design (2).png', 'bakery franchise Howrah, café franchise West Bengal, bakery franchise Kolkata, turnkey bakery India, SUSA Enterprise'],
      ['about', 'About Us — SUSA ENTERPRISE | Bakery Franchise Howrah, West Bengal', 'Learn about SUSA ENTERPRISE, a design-led bakery & café franchise brand based in Howrah, West Bengal. 8+ years of franchise experience delivering turnkey store concepts.', 'images/Untitled design (2).png', 'about SUSA ENTERPRISE, bakery franchise company Howrah, franchise company West Bengal'],
      ['franchise', 'Bakery Franchise Opportunities in West Bengal — SUSA ENTERPRISE', 'Explore bakery & café franchise opportunities in Howrah, West Bengal & Kolkata. Investment from ₹10 Lakh. Turnkey store concepts with full support.', 'images/Untitled design (2).png', 'bakery franchise West Bengal, café franchise Howrah, franchise opportunity India, bakery investment'],
      ['gallery', 'Bakery Store Gallery — SUSA ENTERPRISE Franchise Concepts', 'Browse SUSA ENTERPRISE bakery & café store designs — display counters, seating, merchandising, and full fit-outs from franchise projects in Howrah, West Bengal.', 'images/Untitled design (2).png', 'bakery store design, café interior, bakery franchise gallery, store concepts Howrah'],
      ['services', 'Bakery Equipment & Fit-Out Services — SUSA ENTERPRISE Howrah', 'SUSA ENTERPRISE supplies display counters, bakery equipment, café seating, lighting & complete store fit-outs in Howrah, West Bengal.', 'images/Untitled design (2).png', 'bakery equipment Howrah, display counters West Bengal, bakery fit-out service, café seating India'],
      ['contact', 'Contact Us — SUSA ENTERPRISE | Bakery Franchise Howrah, West Bengal', 'Contact SUSA ENTERPRISE about bakery franchise opportunities, equipment, or general enquiries. Visit us in Howrah, West Bengal or call +91 96094 06997.', 'images/Untitled design (2).png', 'contact SUSA ENTERPRISE, bakery franchise Howrah, franchise enquiry West Bengal'],
      ['privacy', 'Privacy Policy — SUSA ENTERPRISE', 'Read the SUSA ENTERPRISE privacy policy. Learn how we collect, use, and protect your personal information when you apply for a bakery franchise or contact us.', 'images/Untitled design (2).png', ''],
      ['terms', 'Terms & Conditions — SUSA ENTERPRISE', 'The terms that govern your use of the SUSA ENTERPRISE website and franchise application.', 'images/Untitled design (2).png', ''],
      ['refund', 'Refund Policy — SUSA ENTERPRISE', 'Clear, simple refund terms for the SUSA ENTERPRISE application fee and store investment.', 'images/Untitled design (2).png', ''],
    ];
    for (const row of rows) {
      await db.execute({ sql: 'INSERT OR IGNORE INTO seo (page, title, description, og_image, keywords) VALUES (?, ?, ?, ?, ?)', args: row });
    }
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) { try { resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); return; } catch (e) { reject(new Error('invalid JSON')); return; } }
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 30*1024*1024) { reject(new Error('too large')); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch (e) { reject(new Error('invalid JSON')); } });
    req.on('error', reject);
  });
}

function getCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

async function currentUser(req, db) {
  const token = getCookie(req, 'susa_session');
  if (!token) return null;
  const r = await db.execute({ sql: 'SELECT email, expires_at FROM sessions WHERE token = ?', args: [token] });
  if (!r.rows[0] || r.rows[0].expires_at < Date.now()) return null;
  return r.rows[0].email;
}

async function notifyWebhook(db, payload) {
  try {
    const r = await db.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: ['notifyWebhook'] });
    const url = r.rows[0] && r.rows[0].value;
    if (!url) return;
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) {}
}

module.exports = { getDB, readBody, getCookie, currentUser, scryptHash, crypto, notifyWebhook };
