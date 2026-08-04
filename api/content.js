const { getDB, readBody, currentUser } = require('./db');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    if (req.method === 'GET') {
      const page = new URL(req.url, 'http://localhost').searchParams.get('page') || '';
      const r = page
        ? await db.execute({ sql: 'SELECT key, page, label, html, updated_at FROM content WHERE page = ? ORDER BY key', args: [page] })
        : await db.execute('SELECT key, page, label, html, updated_at FROM content ORDER BY page, key');
      return res.json({ sections: r.rows });
    }
    if (req.method === 'PUT') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      for (const s of (body.sections || [])) {
        if (typeof s.key === 'string' && typeof s.html === 'string') {
          const page = s.page || s.key.split('.')[0];
          const label = s.label || s.key;
          await db.execute({ sql: 'INSERT INTO content (key, page, label, html, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET html = excluded.html, updated_at = excluded.updated_at', args: [s.key, page, label, s.html, Date.now()] });
        }
      }
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
