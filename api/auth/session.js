const { configured, registerConfigured, sessionFromRequest } = require("../../server/auth");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const session = sessionFromRequest(req);
  return res.status(200).json({
    ok: true,
    configured: configured(),
    registrationConfigured: registerConfigured(),
    authenticated: Boolean(session),
    username: session?.username || null
  });
};
