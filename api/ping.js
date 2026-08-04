const { getDB } = require('./db');

module.exports = async function handler(req, res) {
  const result = { ok: true, hasUrl: !!process.env.TURSO_DATABASE_URL, hasToken: !!process.env.TURSO_AUTH_TOKEN, dbOk: false, dbError: null };
  try {
    const db = await getDB();
    await db.execute('SELECT 1');
    result.dbOk = true;
  } catch (e) {
    result.dbError = e.message;
  }
  return res.json(result);
};
