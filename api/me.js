const { getDB, currentUser } = require('../lib/db');

module.exports = async function handler(req, res) {
  try {
    const db = await getDB();
    const email = await currentUser(req, db);
    return email ? res.json({ email }) : res.status(401).json({ error: 'Not authenticated' });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
