const { getDB } = require('../lib/db');

// Table metadata: field validation is intentionally minimal; admin.js sends correct shapes.
const TABLES = ['testimonials', 'faqs', 'services', 'formats', 'documents', 'media_lib'];
const KEYED = { seo: 'page', promo: null };

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) { try { resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); return; } catch (e) { reject(new Error('invalid JSON')); return; } }
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 30*1024*1024) { reject(new Error('too large')); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch (e) { reject(new Error('invalid JSON')); } });
    req.on('error', reject);
  });
}

function isAuthed(db, req) {
  const m = (req.headers.cookie || '').match(/susa_session=([^;]+)/);
  if (!m) return false;
  return db.execute({ sql: 'SELECT email, expires_at FROM sessions WHERE token = ?', args: [m[1]] })
    .then(r => !!(r.rows[0] && r.rows[0].expires_at > Date.now()));
}

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    const url = new URL(req.url, 'http://localhost');
    const table = url.searchParams.get('table') || '';
    const id = url.searchParams.get('id');
    const publicOnly = url.searchParams.get('public') === '1';

    // ─── PROMO (settings-backed) ───
    if (table === 'promo') {
      const keys = ['promoEnabled', 'promoText', 'promoUrl'];
      if (req.method === 'GET') {
        const r = await db.execute("SELECT key, value FROM settings WHERE key IN ('promoEnabled','promoText','promoUrl')");
        const promo = { enabled: '', text: '', url: '' };
        for (const row of r.rows) { if (row.key === 'promoEnabled') promo.enabled = row.value; if (row.key === 'promoText') promo.text = row.value; if (row.key === 'promoUrl') promo.url = row.value; }
        if (publicOnly) return res.json({ enabled: promo.enabled === '1' || promo.enabled === 'true', text: promo.text, url: promo.url });
        return res.json(promo);
      }
      if (req.method === 'PUT') {
        if (!(await isAuthed(db, req))) return res.status(401).json({ error: 'Not authenticated' });
        const body = await readBody(req);
        const map = { promoEnabled: body.enabled, promoText: body.text, promoUrl: body.url };
        for (const [k, v] of Object.entries(map)) {
          if (v !== undefined) await db.execute({ sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', args: [k, String(v)] });
        }
        return res.json({ ok: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ─── SEO (page-keyed) ───
    if (table === 'seo') {
      if (req.method === 'GET') {
        const r = await db.execute('SELECT page, title, description, og_image, keywords FROM seo');
        const page = url.searchParams.get('page');
        if (publicOnly && page) {
          const one = r.rows.find(x => x.page === page);
          if (!one) return res.status(404).json({ error: 'not found' });
          return res.json(one);
        }
        if (publicOnly) return res.json({ items: r.rows });
        return res.json({ items: r.rows });
      }
      if (req.method === 'PUT') {
        if (!(await isAuthed(db, req))) return res.status(401).json({ error: 'Not authenticated' });
        const body = await readBody(req);
        const page = String(body.page || '');
        if (!page) return res.status(400).json({ error: 'Missing page' });
        await db.execute({
          sql: 'INSERT INTO seo (page, title, description, og_image, keywords) VALUES (?, ?, ?, ?, ?) ON CONFLICT(page) DO UPDATE SET title = excluded.title, description = excluded.description, og_image = excluded.og_image, keywords = excluded.keywords',
          args: [page, String(body.title || ''), String(body.description || ''), String(body.og_image || ''), String(body.keywords || '')]
        });
        return res.json({ ok: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ─── MEDIA LIBRARY (base64-backed) ───
    if (table === 'media_lib') {
      const allowed = ['id', 'name', 'type', 'url', 'data64', 'size', 'created_at'];
      if (req.method === 'GET') {
        const r = await db.execute('SELECT id, name, type, url, size, created_at FROM media_lib ORDER BY id DESC');
        if (id) {
          const one = await db.execute({ sql: 'SELECT * FROM media_lib WHERE id = ?', args: [Number(id)] });
          if (!one.rows[0]) return res.status(404).json({ error: 'not found' });
          return res.json(one.rows[0]);
        }
        return res.json({ items: r.rows });
      }
      if (!(await isAuthed(db, req))) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      if (req.method === 'POST') {
        const info = await db.execute({
          sql: 'INSERT INTO media_lib (name, type, url, data64, size, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          args: [String(body.name || '').trim() || 'untitled', String(body.type || 'image'), String(body.url || ''), String(body.data64 || ''), Number(body.size || 0), Date.now()]
        });
        const r = await db.execute({ sql: 'SELECT id, name, type, url, size, created_at FROM media_lib WHERE id = ?', args: [Number(info.lastInsertRowid)] });
        return res.json(r.rows[0]);
      }
      if (!id) return res.status(400).json({ error: 'Missing id' });
      if (req.method === 'PUT') {
        const sets = []; const args = [];
        for (const k of ['name', 'type', 'url', 'data64']) {
          if (body[k] !== undefined) { sets.push(k + ' = ?'); args.push(String(body[k])); }
        }
        if (!sets.length) return res.status(400).json({ error: 'No fields' });
        args.push(Number(id));
        await db.execute({ sql: 'UPDATE media_lib SET ' + sets.join(', ') + ' WHERE id = ?', args });
        const r = await db.execute({ sql: 'SELECT id, name, type, url, size, created_at FROM media_lib WHERE id = ?', args: [Number(id)] });
        return res.json(r.rows[0]);
      }
      if (req.method === 'DELETE') {
        await db.execute({ sql: 'DELETE FROM media_lib WHERE id = ?', args: [Number(id)] });
        return res.json({ ok: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ─── GENERIC CRUD TABLES ───
    if (!TABLES.includes(table)) return res.status(400).json({ error: 'invalid table' });

    if (req.method === 'GET') {
      let sql = 'SELECT * FROM ' + table;
      if (publicOnly) sql += ' WHERE active = 1';
      sql += ' ORDER BY sort ASC, id ASC';
      const r = await db.execute(sql);
      if (id) {
        const one = r.rows.find(x => String(x.id) === id);
        if (!one) return res.status(404).json({ error: 'not found' });
        return res.json(one);
      }
      return res.json({ items: r.rows });
    }

    if (!(await isAuthed(db, req))) return res.status(401).json({ error: 'Not authenticated' });
    const body = await readBody(req);

    if (req.method === 'POST') {
      const d = { ...body };
      delete d.id;
      const keys = Object.keys(d);
      if (!keys.length) return res.status(400).json({ error: 'No fields' });
      const info = await db.execute({
        sql: 'INSERT INTO ' + table + ' (' + keys.join(', ') + ') VALUES (' + keys.map(() => '?').join(', ') + ')',
        args: keys.map(k => d[k])
      });
      const r = await db.execute({ sql: 'SELECT * FROM ' + table + ' WHERE id = ?', args: [Number(info.lastInsertRowid)] });
      return res.json(r.rows[0]);
    }

    if (!id) return res.status(400).json({ error: 'Missing id' });

    if (req.method === 'PUT') {
      const d = { ...body };
      delete d.id;
      const keys = Object.keys(d);
      if (!keys.length) return res.status(400).json({ error: 'No fields' });
      await db.execute({ sql: 'UPDATE ' + table + ' SET ' + keys.map(k => k + ' = ?').join(', ') + ' WHERE id = ?', args: [...keys.map(k => d[k]), Number(id)] });
      const r = await db.execute({ sql: 'SELECT * FROM ' + table + ' WHERE id = ?', args: [Number(id)] });
      return res.json(r.rows[0]);
    }

    if (req.method === 'DELETE') {
      await db.execute({ sql: 'DELETE FROM ' + table + ' WHERE id = ?', args: [Number(id)] });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};