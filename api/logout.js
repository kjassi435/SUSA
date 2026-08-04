const { getDB, getCookie } = require('./db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const db = await getDB();
    const token = getCookie(req, 'susa_session');
    if (token) await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
    res.setHeader('Set-Cookie', 'susa_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
