const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3001;
const DB_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DB_DIR, 'susa.db');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BODY = 30 * 1024 * 1024;

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    page TEXT NOT NULL,
    label TEXT NOT NULL,
    html TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );
`);

function scryptHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return salt + ':' + hash;
}
function scryptVerify(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

function seed() {
  const users = db.prepare('SELECT COUNT(*) AS c FROM users').get();
  if (users.c === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@susaenterprise.com';
    const password = process.env.ADMIN_PASSWORD || 'Susa@4999!Admin';
    db.prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)')
      .run(email, scryptHash(password), Date.now());
    console.log('Seeded admin user: ' + email);
  }

  const settings = [
    ['phoneIndia', '+91 96094 06997'],
    ['phoneKSA', '+966 590831351'],
    ['email', 'hello@susaenterprise.com'],
    ['addressLine1', '82/6 Shaikh Para Lane, Chatterjee Hat'],
    ['addressLine2', 'Howrah, West Bengal 711104, India'],
    ['socialInstagram', ''],
    ['socialLinkedin', ''],
    ['socialFacebook', ''],
    ['registrationFee', '₹4,999'],
  ];
  const setStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of settings) setStmt.run(k, v);

  const sections = [
    ['index-hero', 'index', 'Hero — badge / heading / subheading'],
    ['index-stats', 'index', 'Stats band (stores / cities / partners / rating)'],
    ['index-product-lines', 'index', 'Product lines intro + cards'],
    ['index-gallery', 'index', 'Gallery strip heading + text'],
    ['index-faq', 'index', 'FAQ heading'],
    ['about-hero', 'about', 'About hero text'],
    ['about-story', 'about', 'Story / brand narrative'],
    ['about-mission', 'about', 'Mission & values'],
    ['franchise-hero', 'franchise', 'Franchise hero text'],
    ['franchise-process', 'franchise', 'Process section'],
    ['franchise-commitments', 'franchise', 'What SUSA provides / expects'],
    ['franchise-faq', 'franchise', 'Franchise FAQ'],
    ['gallery-heading', 'gallery', 'Gallery page heading'],
    ['services-hero', 'services', 'Services hero text'],
    ['services-list', 'services', 'Services list intro'],
    ['contact-hero', 'contact', 'Contact hero text'],
    ['contact-info', 'contact', 'Contact info cards'],
    ['legal-privacy', 'privacy', 'Privacy policy content'],
    ['legal-terms', 'terms', 'Terms & conditions content'],
    ['legal-refund', 'refund', 'Refund policy content'],
  ];
  const insStmt = db.prepare('INSERT OR IGNORE INTO content (key, page, label, html, updated_at) VALUES (?, ?, ?, ?, ?)');
  for (const [k, p, l] of sections) insStmt.run(k, p, l, '', Date.now());

  const gCount = db.prepare('SELECT COUNT(*) AS c FROM gallery').get();
  if (gCount.c === 0) {
    const gallery = [
      ['Bakery display counters', 'image', 'images/ms95sv7dslcgii.jpeg', ''],
      ['Counter & cafe front', 'image', 'images/ms96chdzyprn13.jpeg', ''],
      ['Bakery bar setup', 'image', 'images/ms96h5of97hsiy.jpeg', ''],
      ['Cafe lounge seating', 'image', 'images/ms96ljvrd7qb13.jpeg', ''],
      ['Merchandising display', 'image', 'images/ms95pxbhfcqeff.jpeg', ''],
      ['Store interior', 'image', 'images/ms903o7mucwo2w.jpeg', ''],
      ['Fit-out progress', 'image', 'images/ms91fajqr825ij.jpeg', ''],
      ['Counter detail', 'image', 'images/ms90s7pwfaa5fw.jpeg', ''],
      ['Brand merchandising', 'image', 'images/ms90ijlo3xa53q.jpeg', ''],
      ['Seating corner', 'image', 'images/ms90ib75sx68p6.jpeg', ''],
      ['Counter range', 'image', 'images/ms8zrllphzt896.jpeg', ''],
      ['Bakery shelf display', 'image', 'images/ms8zra2nroqe4y.jpeg', ''],
    ];
    const gStmt = db.prepare('INSERT INTO gallery (title, type, url, caption, sort) VALUES (?, ?, ?, ?, ?)');
    gallery.forEach(([t, ty, u, c], i) => gStmt.run(t, ty, u, c, i));
  }
}
seed();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch (e) { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function currentUser(req) {
  const token = getCookie(req, 'susa_session');
  if (!token) return null;
  const row = db.prepare('SELECT s.token, s.email, s.expires_at FROM sessions s WHERE s.token = ?').get(token);
  if (!row || row.expires_at < Date.now()) return null;
  return row.email;
}

function requireAuth(req, res) {
  const email = currentUser(req);
  if (!email) {
    sendJSON(res, 401, { error: 'Not authenticated' });
    return null;
  }
  return email;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  try {
    if (p === '/api/login' && req.method === 'POST') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!row || !scryptVerify(String(body.password || ''), row.password_hash)) {
        return sendJSON(res, 401, { error: 'Invalid email or password' });
      }
      const token = crypto.randomBytes(24).toString('hex');
      db.prepare('INSERT INTO sessions (token, email, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .run(token, row.email, Date.now(), Date.now() + SESSION_TTL_MS);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': 'susa_session=' + token + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + Math.floor(SESSION_TTL_MS / 1000),
      });
      return res.end(JSON.stringify({ ok: true, email: row.email }));
    }

    if (p === '/api/logout' && req.method === 'POST') {
      const token = getCookie(req, 'susa_session');
      if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'susa_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
      return res.end('{"ok":true}');
    }

    if (p === '/api/me') {
      const email = currentUser(req);
      return sendJSON(res, email ? 200 : 401, email ? { email } : { error: 'Not authenticated' });
    }

    if (p === '/api/content' && req.method === 'GET') {
      const page = url.searchParams.get('page') || '';
      const rows = page
        ? db.prepare('SELECT key, page, label, html, updated_at FROM content WHERE page = ? ORDER BY key').all(page)
        : db.prepare('SELECT key, page, label, html, updated_at FROM content ORDER BY page, key').all();
      return sendJSON(res, 200, { sections: rows });
    }

    if (p === '/api/content' && req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const rows = body.sections || [];
      const stmt = db.prepare('UPDATE content SET html = ?, updated_at = ? WHERE key = ?');
      for (const s of rows) {
        if (typeof s.key === 'string' && typeof s.html === 'string') {
          stmt.run(s.html, Date.now(), s.key);
        }
      }
      return sendJSON(res, 200, { ok: true, updated: rows.length });
    }

    if (p === '/api/settings' && req.method === 'GET') {
      const rows = db.prepare('SELECT key, value FROM settings').all();
      const settings = {};
      for (const r of rows) settings[r.key] = r.value;
      return sendJSON(res, 200, { settings });
    }

    if (p === '/api/settings' && req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
      for (const [k, v] of Object.entries(body.settings || {})) stmt.run(k, String(v ?? ''));
      return sendJSON(res, 200, { ok: true });
    }

    if (p === '/api/gallery' && req.method === 'GET') {
      const rows = db.prepare('SELECT id, title, type, url, caption, sort FROM gallery ORDER BY sort, id').all();
      return sendJSON(res, 200, { items: rows });
    }

    if (p === '/api/gallery' && req.method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const max = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM gallery').get().m;
      const info = db.prepare('INSERT INTO gallery (title, type, url, caption, sort) VALUES (?, ?, ?, ?, ?)')
        .run(String(body.title || ''), String(body.type || 'image'), String(body.url || ''), String(body.caption || ''), max + 1);
      return sendJSON(res, 200, { ok: true, id: Number(info.lastInsertRowid) });
    }

    if (p === '/api/gallery/reorder' && req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const stmt = db.prepare('UPDATE gallery SET sort = ? WHERE id = ?');
      for (const [i, id] of (body.order || []).entries()) stmt.run(i, Number(id));
      return sendJSON(res, 200, { ok: true });
    }

    if (p.startsWith('/api/gallery/') && req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = Number(p.split('/').pop());
      const body = await readBody(req);
      db.prepare('UPDATE gallery SET title = ?, type = ?, url = ?, caption = ? WHERE id = ?')
        .run(String(body.title || ''), String(body.type || 'image'), String(body.url || ''), String(body.caption || ''), id);
      return sendJSON(res, 200, { ok: true });
    }

    if (p.startsWith('/api/gallery/') && req.method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = Number(p.split('/').pop());
      db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
      return sendJSON(res, 200, { ok: true });
    }

    if (p === '/api/media' && req.method === 'GET') {
      const files = fs.readdirSync(UPLOAD_DIR).map((f) => {
        const st = fs.statSync(path.join(UPLOAD_DIR, f));
        return { name: f, size: st.size, url: '/uploads/' + encodeURIComponent(f) };
      }).sort((a, b) => a.name.localeCompare(b.name));
      return sendJSON(res, 200, { files });
    }

    if (p === '/api/media' && req.method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const name = String(body.name || '').replace(/[^\w.\- ]+/g, '').trim();
      const ext = path.extname(name).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf'].includes(ext)) {
        return sendJSON(res, 400, { error: 'Unsupported file type' });
      }
      const data = String(body.dataBase64 || '');
      const m = data.match(/^data:[^;]+;base64,(.+)$/);
      const buf = Buffer.from(m ? m[1] : data, 'base64');
      const finalName = name || 'upload' + Date.now() + ext;
      fs.writeFileSync(path.join(UPLOAD_DIR, finalName), buf);
      return sendJSON(res, 200, { ok: true, url: '/uploads/' + encodeURIComponent(finalName) });
    }

    if (p === '/api/ping') {
      return sendJSON(res, 200, { ok: true, db: DB_PATH });
    }

    // ─── static files ───
    if (p.startsWith('/api/')) return sendJSON(res, 404, { error: 'Not found' });

    let filePath = path.join(ROOT, decodeURIComponent(p));
    if (p === '/') filePath = path.join(ROOT, 'index.html');
    if (!filePath.startsWith(ROOT)) return sendJSON(res, 403, { error: 'Forbidden' });

    const st = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    if (!st || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h2 style="font-family:sans-serif">404 — Not found</h2>');
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    sendJSON(res, 400, { error: err.message || 'Bad request' });
  }
});

server.listen(PORT, () => {
  console.log('SUSA local server: http://localhost:' + PORT);
  console.log('Admin panel:       http://localhost:' + PORT + '/admin.html');
});
