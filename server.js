require('dotenv').config();
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createClient } = require('@libsql/client');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3001;
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BODY = 30 * 1024 * 1024;

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let db;

async function connectDB() {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    try {
      const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
      await client.execute('SELECT 1');
      db = client;
      console.log('Connected to Turso: ' + process.env.TURSO_DATABASE_URL);
      return;
    } catch (e) {
      console.log('Turso failed (' + e.message + '), using local SQLite...');
    }
  }
  const { DatabaseSync } = require('node:sqlite');
  const DB_DIR = path.join(ROOT, 'data');
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const localDb = new DatabaseSync(path.join(DB_DIR, 'susa.db'));
  db = {
    async execute(opts) {
      const sql = typeof opts === 'string' ? opts : opts.sql;
      const args = (typeof opts === 'object' && opts.args) || [];
      const upper = sql.trim().toUpperCase();
      if (upper.startsWith('SELECT') || upper.startsWith('PRAGMA')) {
        const rows = args.length ? localDb.prepare(sql).all(...args) : localDb.prepare(sql).all();
        return { rows };
      }
      const info = args.length ? localDb.prepare(sql).run(...args) : localDb.prepare(sql).run();
      return { rows: [], lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    }
  };
  console.log('Using local SQLite');
}

async function initDB() {
  await db.execute('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS content (key TEXT PRIMARY KEY, page TEXT NOT NULL, label TEXT NOT NULL, html TEXT NOT NULL DEFAULT \'\', updated_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL DEFAULT \'\', type TEXT NOT NULL DEFAULT \'image\', url TEXT NOT NULL, caption TEXT NOT NULL DEFAULT \'\', sort INTEGER NOT NULL DEFAULT 0)');
  await db.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT \'\')');
}

function scryptHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  return salt + ':' + crypto.scryptSync(password, salt, 32).toString('hex');
}
function scryptVerify(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(crypto.scryptSync(password, salt, 32).toString('hex'), 'hex'));
}

async function seed() {
  const r = await db.execute('SELECT COUNT(*) AS c FROM users');
  if (r.rows[0].c === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@susaenterprise.com';
    const pw = process.env.ADMIN_PASSWORD || 'Susa@4999!Admin';
    await db.execute({ sql: 'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)', args: [email, scryptHash(pw), Date.now()] });
    console.log('Seeded admin: ' + email);
  }
  const settings = [
    ['phoneIndia', '+91 96094 06997'], ['phoneKSA', '+966 590831351'],
    ['email', 'hello@susaenterprise.com'], ['addressLine1', '82/6 Shaikh Para Lane, Chatterjee Hat'],
    ['addressLine2', 'Howrah, West Bengal 711104, India'],
    ['socialInstagram', ''], ['socialLinkedin', ''], ['socialFacebook', ''],
    ['registrationFee', '\u20B94,999'],
  ];
  for (const [k, v] of settings) await db.execute({ sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', args: [k, v] });
  const gc = await db.execute('SELECT COUNT(*) AS c FROM gallery');
  if (gc.rows[0].c === 0) {
    const imgs = [
      ['Bakery display counters', 'image', 'images/ms95sv7dslcgii.jpeg'],
      ['Counter & cafe front', 'image', 'images/ms96chdzyprn13.jpeg'],
      ['Bakery bar setup', 'image', 'images/ms96h5of97hsiy.jpeg'],
      ['Cafe lounge seating', 'image', 'images/ms96ljvrd7qb13.jpeg'],
      ['Merchandising display', 'image', 'images/ms95pxbhfcqeff.jpeg'],
      ['Store interior', 'image', 'images/ms903o7mucwo2w.jpeg'],
      ['Fit-out progress', 'image', 'images/ms91fajqr825ij.jpeg'],
      ['Counter detail', 'image', 'images/ms90s7pwfaa5fw.jpeg'],
      ['Brand merchandising', 'image', 'images/ms90ijlo3xa53q.jpeg'],
      ['Seating corner', 'image', 'images/ms90ib75sx68p6.jpeg'],
      ['Counter range', 'image', 'images/ms8zrllphzt896.jpeg'],
      ['Bakery shelf display', 'image', 'images/ms8zra2nroqe4y.jpeg'],
    ];
    for (let i = 0; i < imgs.length; i++) {
      await db.execute({ sql: 'INSERT INTO gallery (title, type, url, caption, sort) VALUES (?, ?, ?, ?, ?)', args: [imgs[i][0], imgs[i][1], imgs[i][2], '', i] });
    }
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); return; } chunks.push(c); });
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

async function currentUser(req) {
  const token = getCookie(req, 'susa_session');
  if (!token) return null;
  const r = await db.execute({ sql: 'SELECT email, expires_at FROM sessions WHERE token = ?', args: [token] });
  if (!r.rows[0] || r.rows[0].expires_at < Date.now()) return null;
  return r.rows[0].email;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  try {
    if (p === '/api/login' && req.method === 'POST') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const r = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
      const row = r.rows[0];
      if (!row || !scryptVerify(String(body.password || ''), row.password_hash)) return sendJSON(res, 401, { error: 'Invalid email or password' });
      const token = crypto.randomBytes(24).toString('hex');
      await db.execute({ sql: 'INSERT INTO sessions (token, email, created_at, expires_at) VALUES (?, ?, ?, ?)', args: [token, row.email, Date.now(), Date.now() + SESSION_TTL_MS] });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'susa_session=' + token + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + Math.floor(SESSION_TTL_MS / 1000) });
      return res.end(JSON.stringify({ ok: true, email: row.email }));
    }
    if (p === '/api/logout' && req.method === 'POST') {
      const token = getCookie(req, 'susa_session');
      if (token) await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'susa_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
      return res.end('{"ok":true}');
    }
    if (p === '/api/me') {
      const email = await currentUser(req);
      return sendJSON(res, email ? 200 : 401, email ? { email } : { error: 'Not authenticated' });
    }
    if (p === '/api/content' && req.method === 'GET') {
      const page = url.searchParams.get('page') || '';
      const r = page ? await db.execute({ sql: 'SELECT key, page, label, html, updated_at FROM content WHERE page = ? ORDER BY key', args: [page] }) : await db.execute('SELECT key, page, label, html, updated_at FROM content ORDER BY page, key');
      return sendJSON(res, 200, { sections: r.rows });
    }
    if (p === '/api/content' && req.method === 'PUT') {
      const email = await currentUser(req);
      if (!email) return sendJSON(res, 401, { error: 'Not authenticated' });
      const body = await readBody(req);
      for (const s of (body.sections || [])) {
        if (typeof s.key === 'string' && typeof s.html === 'string') {
          await db.execute({ sql: 'UPDATE content SET html = ?, updated_at = ? WHERE key = ?', args: [s.html, Date.now(), s.key] });
        }
      }
      return sendJSON(res, 200, { ok: true });
    }
    if (p === '/api/settings' && req.method === 'GET') {
      const r = await db.execute('SELECT key, value FROM settings');
      const s = {}; for (const row of r.rows) s[row.key] = row.value;
      return sendJSON(res, 200, { settings: s });
    }
    if (p === '/api/settings' && req.method === 'PUT') {
      const email = await currentUser(req);
      if (!email) return sendJSON(res, 401, { error: 'Not authenticated' });
      const body = await readBody(req);
      for (const [k, v] of Object.entries(body.settings || {})) {
        await db.execute({ sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', args: [k, String(v ?? '')] });
      }
      return sendJSON(res, 200, { ok: true });
    }
    if (p === '/api/gallery' && req.method === 'GET') {
      const r = await db.execute('SELECT id, title, type, url, caption, sort FROM gallery ORDER BY sort, id');
      return sendJSON(res, 200, { items: r.rows });
    }
    if (p === '/api/gallery' && req.method === 'POST') {
      const email = await currentUser(req);
      if (!email) return sendJSON(res, 401, { error: 'Not authenticated' });
      const body = await readBody(req);
      const mx = (await db.execute('SELECT COALESCE(MAX(sort),-1) AS m FROM gallery')).rows[0].m;
      const info = await db.execute({ sql: 'INSERT INTO gallery (title, type, url, caption, sort) VALUES (?, ?, ?, ?, ?)', args: [body.title || '', body.type || 'image', body.url || '', body.caption || '', mx + 1] });
      return sendJSON(res, 200, { ok: true, id: Number(info.lastInsertRowid) });
    }
    if (p === '/api/gallery/reorder' && req.method === 'PUT') {
      const email = await currentUser(req);
      if (!email) return sendJSON(res, 401, { error: 'Not authenticated' });
      const body = await readBody(req);
      for (const [i, id] of (body.order || []).entries()) await db.execute({ sql: 'UPDATE gallery SET sort = ? WHERE id = ?', args: [i, Number(id)] });
      return sendJSON(res, 200, { ok: true });
    }
    if (p.match(/^\/api\/gallery\/\d+$/) && req.method === 'PUT') {
      const email = await currentUser(req);
      if (!email) return sendJSON(res, 401, { error: 'Not authenticated' });
      const id = Number(p.split('/').pop());
      const body = await readBody(req);
      await db.execute({ sql: 'UPDATE gallery SET title=?, type=?, url=?, caption=? WHERE id=?', args: [body.title || '', body.type || 'image', body.url || '', body.caption || '', id] });
      return sendJSON(res, 200, { ok: true });
    }
    if (p.match(/^\/api\/gallery\/\d+$/) && req.method === 'DELETE') {
      const email = await currentUser(req);
      if (!email) return sendJSON(res, 401, { error: 'Not authenticated' });
      await db.execute({ sql: 'DELETE FROM gallery WHERE id = ?', args: [Number(p.split('/').pop())] });
      return sendJSON(res, 200, { ok: true });
    }
    if (p === '/api/media' && req.method === 'GET') {
      const files = fs.readdirSync(UPLOAD_DIR).map(f => {
        const st = fs.statSync(path.join(UPLOAD_DIR, f));
        return { name: f, size: st.size, url: '/uploads/' + encodeURIComponent(f) };
      }).sort((a, b) => a.name.localeCompare(b.name));
      return sendJSON(res, 200, { files });
    }
    if (p === '/api/media' && req.method === 'POST') {
      const email = await currentUser(req);
      if (!email) return sendJSON(res, 401, { error: 'Not authenticated' });
      const body = await readBody(req);
      const name = String(body.name || '').replace(/[^\w.\- ]+/g, '').trim();
      const ext = path.extname(name).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf'].includes(ext)) return sendJSON(res, 400, { error: 'Unsupported file type' });
      const m = String(body.dataBase64 || '').match(/^data:[^;]+;base64,(.+)$/);
      fs.writeFileSync(path.join(UPLOAD_DIR, name || 'upload' + Date.now() + ext), Buffer.from(m ? m[1] : '', 'base64'));
      return sendJSON(res, 200, { ok: true, url: '/uploads/' + encodeURIComponent(name) });
    }
    if (p === '/api/ping') return sendJSON(res, 200, { ok: true });

    // static files
    if (p.startsWith('/api/')) return sendJSON(res, 404, { error: 'Not found' });
    let filePath = path.join(ROOT, decodeURIComponent(p === '/' ? '/index.html' : p));
    if (!filePath.startsWith(ROOT)) return sendJSON(res, 403, { error: 'Forbidden' });
    const st = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    if (!st || !st.isFile()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    sendJSON(res, 400, { error: err.message });
  }
});

async function start() {
  await connectDB();
  await initDB();
  await seed();
  server.listen(PORT, () => {
    console.log('SUSA: http://localhost:' + PORT);
    console.log('Admin: http://localhost:' + PORT + '/admin.html');
  });
}
start();
