const { getDB } = require('./db');
const { readBody } = require('./crud');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    const url = new URL(req.url, 'http://localhost');
    const id = url.searchParams.get('id');

    if (req.method === 'GET') {
      const publicOnly = url.searchParams.get('public') === '1';
      const r = await db.execute('SELECT id, name, type, url, size, created_at FROM media_lib ORDER BY id DESC');
      if (publicOnly) return res.json({ items: r.rows });
      if (id) {
        const one = await db.execute({ sql: 'SELECT * FROM media_lib WHERE id = ?', args: [Number(id)] });
        if (!one.rows[0]) return res.status(404).json({ error: 'not found' });
        return res.json(one.rows[0]);
      }
      return res.json({ items: r.rows });
    }

    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

    const email = await require('./db').currentUser(req, db);
    if (!email) return res.status(401).json({ error: 'Not authenticated' });

    if (req.method === 'POST') {
      const body = await readBody(req);
      const name = String(body.name || '').trim() || 'untitled';
      const type = String(body.type || 'image');
      const url = String(body.url || '');
      const data64 = String(body.data64 || '');
      const size = Number(body.size || 0);
      const info = await db.execute({
        sql: 'INSERT INTO media_lib (name, type, url, data64, size, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [name, type, url, data64, size, Date.now()]
      });
      const r = await db.execute({ sql: 'SELECT id, name, type, url, size, created_at FROM media_lib WHERE id = ?', args: [Number(info.lastInsertRowid)] });
      return res.json(r.rows[0]);
    }

    if (!id) return res.status(400).json({ error: 'Missing id' });

    if (req.method === 'PUT') {
      const body = await readBody(req);
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
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};