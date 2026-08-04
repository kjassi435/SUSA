const { getDB, readBody, currentUser } = require('./db');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    if (req.method === 'GET') {
      const r = await db.execute('SELECT key, value FROM settings');
      const s = {}; for (const row of r.rows) s[row.key] = row.value;
      return res.json({ settings: s });
    }
    if (req.method === 'PUT') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      for (const [k, v] of Object.entries(body.settings || {})) {
        await db.execute({ sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', args: [k, String(v ?? '')] });
      }
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
