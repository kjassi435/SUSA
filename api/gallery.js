const { getDB, readBody, currentUser } = require('../lib/db');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    const url = new URL(req.url, 'http://localhost');
    const id = url.searchParams.get('id');

    if (req.method === 'GET') {
      const publicOnly = url.searchParams.get('public') === '1';
      const sql = publicOnly
        ? 'SELECT id, title, type, url, caption, sort FROM gallery WHERE active = 1 ORDER BY sort, id'
        : 'SELECT id, title, type, url, caption, sort, active FROM gallery ORDER BY sort, id';
      const r = await db.execute(sql);
      return res.json({ items: r.rows });
    }

    if (req.method === 'POST') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      const mx = (await db.execute('SELECT COALESCE(MAX(sort),-1) AS m FROM gallery')).rows[0].m;
      const info = await db.execute({ sql: 'INSERT INTO gallery (title, type, url, caption, sort) VALUES (?, ?, ?, ?, ?)', args: [body.title || '', body.type || 'image', body.url || '', body.caption || '', mx + 1] });
      return res.json({ ok: true, id: Number(info.lastInsertRowid) });
    }

    if (!id) return res.status(400).json({ error: 'Missing id' });

    if (req.method === 'PUT') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      if (body.order) {
        for (const [i, itemId] of body.order.entries()) await db.execute({ sql: 'UPDATE gallery SET sort = ? WHERE id = ?', args: [i, Number(itemId)] });
        return res.json({ ok: true });
      }
      await db.execute({ sql: 'UPDATE gallery SET title=?, type=?, url=?, caption=?, active=? WHERE id=?', args: [body.title || '', body.type || 'image', body.url || '', body.caption || '', body.active === undefined ? 1 : Number(body.active), Number(id)] });
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      await db.execute({ sql: 'DELETE FROM gallery WHERE id = ?', args: [Number(id)] });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};