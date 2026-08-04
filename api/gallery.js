const { getDB, readBody, currentUser } = require('./db');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    if (req.method === 'GET') {
      const r = await db.execute('SELECT id, title, type, url, caption, sort FROM gallery ORDER BY sort, id');
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
    if (req.method === 'PUT') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      if (body.order) {
        for (const [i, id] of body.order.entries()) await db.execute({ sql: 'UPDATE gallery SET sort = ? WHERE id = ?', args: [i, Number(id)] });
        return res.json({ ok: true });
      }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
