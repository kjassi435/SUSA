const { getDB, readBody, currentUser } = require('./db');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();

    if (req.method === 'GET') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const r = await db.execute('SELECT id, type, data, status, created_at, updated_at FROM submissions ORDER BY created_at DESC');
      return res.json({ submissions: r.rows });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const type = String(body.type || '').trim();
      if (!type || !['franchise', 'contact'].includes(type)) {
        return res.status(400).json({ error: 'Invalid submission type' });
      }
      const data = JSON.stringify(body.data || {});
      const now = Date.now();
      const info = await db.execute({
        sql: 'INSERT INTO submissions (type, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        args: [type, data, 'new', now, now]
      });
      return res.json({ ok: true, id: Number(info.lastInsertRowid) });
    }

    if (req.method === 'PUT') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Missing id' });
      if (body.status) {
        const validStatuses = ['new', 'contacted', 'in_review', 'completed'];
        if (!validStatuses.includes(body.status)) return res.status(400).json({ error: 'Invalid status' });
        await db.execute({ sql: 'UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?', args: [body.status, Date.now(), id] });
      }
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const url = new URL(req.url, 'http://localhost');
      const id = Number(url.searchParams.get('id'));
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await db.execute({ sql: 'DELETE FROM submissions WHERE id = ?', args: [id] });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
