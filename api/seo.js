const { getDB } = require('./db');
const { readBody } = require('./crud');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET') {
      const publicOnly = url.searchParams.get('public') === '1';
      const r = await db.execute('SELECT page, title, description, og_image, keywords FROM seo');
      if (!publicOnly) return res.json({ items: r.rows });
      const page = url.searchParams.get('page');
      if (page) {
        const one = r.rows.find(x => x.page === page);
        if (!one) return res.status(404).json({ error: 'not found' });
        return res.json(one);
      }
      return res.json({ items: r.rows });
    }

    if (req.method === 'PUT') {
      const email = await require('./db').currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      const page = String(body.page || '');
      if (!page) return res.status(400).json({ error: 'Missing page' });
      const title = String(body.title || '');
      const description = String(body.description || '');
      const og_image = String(body.og_image || '');
      const keywords = String(body.keywords || '');
      await db.execute({
        sql: 'INSERT INTO seo (page, title, description, og_image, keywords) VALUES (?, ?, ?, ?, ?) ON CONFLICT(page) DO UPDATE SET title = excluded.title, description = excluded.description, og_image = excluded.og_image, keywords = excluded.keywords',
        args: [page, title, description, og_image, keywords]
      });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};