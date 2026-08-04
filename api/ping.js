module.exports = async function handler(req, res) {
  return res.json({ ok: true, env: !!process.env.TURSO_DATABASE_URL });
};
