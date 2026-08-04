const { getDB, readBody, currentUser, notifyWebhook } = require('./db');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();

    if (req.method === 'GET') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const url = new URL(req.url, 'http://localhost');
      const status = url.searchParams.get('status') || '';
      const type = url.searchParams.get('type') || '';
      let sql = 'SELECT id, type, data, status, payment_status, payment_id, payment_method, created_at, updated_at FROM submissions';
      const where = [];
      const args = [];
      if (status && ['new', 'contacted', 'in_review', 'completed'].includes(status)) { where.push('status = ?'); args.push(status); }
      if (type && ['franchise', 'contact'].includes(type)) { where.push('type = ?'); args.push(type); }
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY created_at DESC';
      const r = await db.execute({ sql, args });
      const rows = JSON.parse(JSON.stringify(r.rows));

      if (url.searchParams.get('export') === 'csv') {
        let csv = 'ID,Type,Status,Payment Status,Payment ID,Payment Method,Created,Data\n';
        for (const row of rows) {
          const data = row.data;
          csv += [row.id, row.type, row.status, row.payment_status || '', row.payment_id || '', row.payment_method || '', new Date(row.created_at).toISOString(), (data || '').replace(/[\n\r]/g, ' ')].join(',') + '\n';
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
        return res.end(csv);
      }

      const unreadR = await db.execute('SELECT COUNT(*) AS c FROM submissions WHERE is_read = 0');
      return res.json({ submissions: rows, unread: unreadR.rows[0].c });
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
        sql: 'INSERT INTO submissions (type, data, status, payment_status, payment_id, payment_method, created_at, updated_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
        args: [type, data, 'new', String(body.payment_status || ''), String(body.payment_id || ''), String(body.payment_method || ''), now, now]
      });
      await notifyWebhook(db, { event: 'new_submission', type, id: Number(info.lastInsertRowid), data: body.data, payment_status: body.payment_status, payment_id: body.payment_id });
      return res.json({ ok: true, id: Number(info.lastInsertRowid) });
    }

    if (req.method === 'PUT') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      const body = await readBody(req);
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const updates = [];
      const args = [];
      if (body.status) {
        const validStatuses = ['new', 'contacted', 'in_review', 'completed'];
        if (!validStatuses.includes(body.status)) return res.status(400).json({ error: 'Invalid status' });
        updates.push('status = ?'); args.push(body.status);
      }
      if (body.payment_status !== undefined) { updates.push('payment_status = ?'); args.push(String(body.payment_status)); }
      if (body.payment_id !== undefined) { updates.push('payment_id = ?'); args.push(String(body.payment_id)); }
      if (body.payment_method !== undefined) { updates.push('payment_method = ?'); args.push(String(body.payment_method)); }
      if (body.is_read !== undefined) { updates.push('is_read = ?'); args.push(Number(body.is_read)); }
      if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
      updates.push('updated_at = ?'); args.push(Date.now());
      args.push(id);
      await db.execute({ sql: 'UPDATE submissions SET ' + updates.join(', ') + ' WHERE id = ?', args });
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