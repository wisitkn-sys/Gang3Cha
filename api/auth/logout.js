const { clearSessionCookie } = require("../../server/auth");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
};
