const { getDB } = require('./db');

function makeCrud(table, allowed) {
  allowed = allowed || {};
  return async function handler(req, res) {
    try {
      const db = await getDB();
      const url = new URL(req.url, 'http://localhost');
      const id = url.searchParams.get('id');

      if (req.method === 'GET') {
        const publicOnly = url.searchParams.get('public') === '1';
        let sql = 'SELECT * FROM ' + table;
        if (publicOnly && allowed.active !== false) sql += ' WHERE active = 1';
        sql += ' ORDER BY sort ASC, id ASC';
        const r = await db.execute(sql);
        if (id) {
          const one = r.rows.find(x => String(x.id) === id);
          if (!one) return res.status(404).json({ error: 'not found' });
          return res.json(one);
        }
        return res.json({ items: r.rows });
      }

      if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

      const email = await require('./db').currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });

      if (req.method === 'POST') {
        const body = await readBody(req);
        const d = { ...body };
        delete d.id;
        const keys = Object.keys(d);
        if (!keys.length) return res.status(400).json({ error: 'No fields' });
        const cols = keys.join(', ');
        const marks = keys.map(() => '?').join(', ');
        const info = await db.execute({ sql: 'INSERT INTO ' + table + ' (' + cols + ') VALUES (' + marks + ')', args: keys.map(k => d[k]) });
        const r = await db.execute({ sql: 'SELECT * FROM ' + table + ' WHERE id = ?', args: [Number(info.lastInsertRowid)] });
        return res.json(r.rows[0]);
      }

      if (!id) return res.status(400).json({ error: 'Missing id' });

      if (req.method === 'PUT') {
        const body = await readBody(req);
        delete body.id;
        const keys = Object.keys(body);
        if (!keys.length) return res.status(400).json({ error: 'No fields' });
        const sets = keys.map(k => k + ' = ?').join(', ');
        await db.execute({ sql: 'UPDATE ' + table + ' SET ' + sets + ' WHERE id = ?', args: [...keys.map(k => body[k]), Number(id)] });
        const r = await db.execute({ sql: 'SELECT * FROM ' + table + ' WHERE id = ?', args: [Number(id)] });
        return res.json(r.rows[0]);
      }

      if (req.method === 'DELETE') {
        await db.execute({ sql: 'DELETE FROM ' + table + ' WHERE id = ?', args: [Number(id)] });
        return res.json({ ok: true });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) { try { resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); return; } catch (e) { reject(new Error('invalid JSON')); return; } }
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 30*1024*1024) { reject(new Error('too large')); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch (e) { reject(new Error('invalid JSON')); } });
    req.on('error', reject);
  });
}

module.exports = { makeCrud, readBody };
