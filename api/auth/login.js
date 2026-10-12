const { authenticateUser, setSessionCookie, readJsonBody, apiError } = require("../../server/auth");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  try {
    const body = await readJsonBody(req);
    const user = await authenticateUser(body);
    setSessionCookie(res, user.username);
    return res.status(200).json({ ok: true, username: user.username });
  } catch (error) {
    return apiError(res, error);
  }
};
