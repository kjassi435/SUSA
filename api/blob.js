const { getDB } = require('../lib/db');

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const id = Number(url.searchParams.get('id'));
    const name = url.searchParams.get('name');
    const db = await getDB();
    if (id) {
      const r = await db.execute({ sql: 'SELECT name, type, data64 FROM media_lib WHERE id = ?', args: [id] });
      if (!r.rows[0]) { res.statusCode = 404; return res.end('not found'); }
      const row = r.rows[0];
      const mime = row.type === 'video' ? 'video/mp4' : row.data64.match(/^data:([^;]+);/);
      const b64 = row.data64.replace(/^data:[^;]+;base64,/, '');
      res.statusCode = 200;
      res.setHeader('Content-Type', mime ? mime[1] : 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.end(Buffer.from(b64, 'base64'));
    }
    if (name) {
      const r = await db.execute({ sql: 'SELECT name, type, data64 FROM media_lib WHERE name = ? ORDER BY id DESC LIMIT 1', args: [name] });
      if (!r.rows[0]) { res.statusCode = 404; return res.end('not found'); }
      const row = r.rows[0];
      const mime = row.type === 'video' ? 'video/mp4' : row.data64.match(/^data:([^;]+);/);
      const b64 = row.data64.replace(/^data:[^;]+;base64,/, '');
      res.statusCode = 200;
      res.setHeader('Content-Type', mime ? mime[1] : 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.end(Buffer.from(b64, 'base64'));
    }
    res.statusCode = 400;
    return res.end('id or name required');
  } catch (e) {
    res.statusCode = 500;
    res.end(String(e && e.message || e));
  }
};