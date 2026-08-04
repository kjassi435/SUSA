const { getDB } = require('./db');
const { readBody } = require('./crud');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET') {
      const publicOnly = url.searchParams.get('public') === '1';
      const r = await db.execute("SELECT key, value FROM settings WHERE key IN ('promoEnabled','promoText','promoUrl')");
      const promo = { enabled: '', text: '', url: '' };
      for (const row of r.rows) {
        if (row.key === 'promoEnabled') promo.enabled = row.value;
        if (row.key === 'promoText') promo.text = row.value;
        if (row.key === 'promoUrl') promo.url = row.value;
      }
      if (publicOnly) {
        const enabled = promo.enabled === '1' || promo.enabled === 'true';
        return res.json({ enabled, text: promo.text, url: promo.url });
      }
      return res.json(promo);
    }

    if (req.method === 'PUT') {
      const email = await require('./db').currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      const map = { promoEnabled: body.enabled, promoText: body.text, promoUrl: body.url };
      for (const [k, v] of Object.entries(map)) {
        if (v !== undefined) {
          await db.execute({ sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', args: [k, String(v)] });
        }
      }
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};