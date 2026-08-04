const fs = require('node:fs');
const path = require('node:path');
const { getDB, readBody, currentUser } = require('./db');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    if (req.method === 'GET') {
      if (!fs.existsSync(UPLOAD_DIR)) return res.json({ files: [] });
      const files = fs.readdirSync(UPLOAD_DIR).map(f => {
        const st = fs.statSync(path.join(UPLOAD_DIR, f));
        return { name: f, size: st.size, url: '/uploads/' + encodeURIComponent(f) };
      }).sort((a, b) => a.name.localeCompare(b.name));
      return res.json({ files });
    }
    if (req.method === 'POST') {
      const email = await currentUser(req, db);
      if (!email) return res.status(401).json({ error: 'Not authenticated' });
      if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const body = await readBody(req);
      const name = String(body.name || '').replace(/[^\w.\- ]+/g, '').trim();
      const ext = path.extname(name).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf'].includes(ext)) {
        return res.status(400).json({ error: 'Unsupported file type' });
      }
      const m = String(body.dataBase64 || '').match(/^data:[^;]+;base64,(.+)$/);
      const finalName = name || 'upload' + Date.now() + ext;
      fs.writeFileSync(path.join(UPLOAD_DIR, finalName), Buffer.from(m ? m[1] : '', 'base64'));
      return res.json({ ok: true, url: '/uploads/' + encodeURIComponent(finalName) });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
