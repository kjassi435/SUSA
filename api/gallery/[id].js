const { getDB, readBody, currentUser } = require('../../db');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    if (req.method === 'PUT') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      await db.execute({ sql: 'UPDATE gallery SET title=?, type=?, url=?, caption=? WHERE id=?', args: [body.title || '', body.type || 'image', body.url || '', body.caption || '', id] });
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      await db.execute({ sql: 'DELETE FROM gallery WHERE id = ?', args: [id] });
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
