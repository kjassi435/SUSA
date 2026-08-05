const { getDB, readBody, scryptHash, crypto } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const db = await getDB();
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const r = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    const row = r.rows[0];
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });
    const [salt, hash] = row.password_hash.split(':');
    const candidate = crypto.scryptSync(String(body.password || ''), salt, 32).toString('hex');
    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    await db.execute({ sql: 'INSERT INTO sessions (token, email, created_at, expires_at) VALUES (?, ?, ?, ?)', args: [token, row.email, Date.now(), Date.now() + 7*24*60*60*1000] });
    res.setHeader('Set-Cookie', 'susa_session=' + token + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800');
    return res.json({ ok: true, email: row.email });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
