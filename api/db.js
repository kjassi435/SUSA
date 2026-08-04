const { createClient } = require('@libsql/client');

let db = null;

async function getDB() {
  if (db) return db;
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  await db.execute('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS content (key TEXT PRIMARY KEY, page TEXT NOT NULL, label TEXT NOT NULL, html TEXT NOT NULL DEFAULT \'\', updated_at INTEGER NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL DEFAULT \'\', type TEXT NOT NULL DEFAULT \'image\', url TEXT NOT NULL, caption TEXT NOT NULL DEFAULT \'\', sort INTEGER NOT NULL DEFAULT 0)');
  await db.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT \'\')');
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

function readBody(req) {
  return new Promise((resolve, reject) => {
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

module.exports = { getDB, readBody, getCookie, currentUser, scryptHash, crypto };
