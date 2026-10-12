const crypto = require("crypto");
const { readFile, writeFile, githubToken } = require("./github");

const USERS_PATH = "System/users.enc.json";
const COOKIE_NAME = "uso_uploader_session";
const SESSION_SECONDS = 8 * 60 * 60;
const PBKDF2_ITERATIONS = 210000;

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 24) {
    const error = new Error("ระบบผู้บันทึกยังไม่ได้ตั้งค่า AUTH_SECRET");
    error.statusCode = 503;
    throw error;
  }
  return secret;
}

function configured() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 24);
}

function registerConfigured() {
  return configured() && Boolean(process.env.REGISTRATION_CODE);
}

function keyFor(purpose) {
  return crypto.createHash("sha256").update(authSecret() + ":" + purpose).digest();
}

function encryptUsers(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyFor("users"), iv);
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.from(JSON.stringify({
    v: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: encrypted.toString("base64")
  }), "utf8");
}

function decryptUsers(buffer) {
  if (!buffer || !buffer.length) return { version: 1, users: [] };
  const envelope = JSON.parse(buffer.toString("utf8"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyFor("users"), Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final()
  ]);
  const data = JSON.parse(decrypted.toString("utf8"));
  if (!Array.isArray(data.users)) data.users = [];
  return data;
}

async function loadUsers() {
  githubToken();
  const file = await readFile(USERS_PATH);
  return {
    sha: file?.sha || null,
    data: file ? decryptUsers(file.buffer) : { version: 1, users: [] }
  };
}

async function saveUsers(data, sha, message) {
  return writeFile(USERS_PATH, encryptUsers(data), message, sha);
}

function validUsername(username) {
  return /^[\p{L}\p{N}._-]{3,40}$/u.test(username);
}

function passwordRecord(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, "sha256");
  return { salt: salt.toString("base64"), hash: hash.toString("base64") };
}

function passwordMatches(password, record) {
  const actual = crypto.pbkdf2Sync(password, Buffer.from(record.salt, "base64"), PBKDF2_ITERATIONS, 32, "sha256");
  const expected = Buffer.from(record.hash, "base64");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function safeEqualText(a, b) {
  const ah = crypto.createHash("sha256").update(String(a)).digest();
  const bh = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ah, bh);
}

async function registerUser({ username, password, registrationCode }) {
  username = String(username || "").trim();
  password = String(password || "");
  if (!registerConfigured()) {
    const error = new Error("ระบบลงทะเบียนยังไม่ได้ตั้งค่า REGISTRATION_CODE");
    error.statusCode = 503;
    throw error;
  }
  if (!safeEqualText(registrationCode, process.env.REGISTRATION_CODE)) {
    const error = new Error("รหัสลงทะเบียนผู้บันทึกไม่ถูกต้อง");
    error.statusCode = 403;
    throw error;
  }
  if (!validUsername(username)) {
    const error = new Error("Username ต้องยาว 3-40 ตัว และใช้ตัวอักษร ตัวเลข . _ -");
    error.statusCode = 400;
    throw error;
  }
  if (password.length < 10) {
    const error = new Error("Password ต้องมีอย่างน้อย 10 ตัวอักษร");
    error.statusCode = 400;
    throw error;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { sha, data } = await loadUsers();
    if (data.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      const error = new Error("Username นี้ถูกลงทะเบียนแล้ว");
      error.statusCode = 409;
      throw error;
    }
    const pw = passwordRecord(password);
    data.users.push({
      username,
      salt: pw.salt,
      hash: pw.hash,
      createdAt: new Date().toISOString()
    });
    try {
      await saveUsers(data, sha, `Register USO uploader: ${username}`);
      return { username };
    } catch (error) {
      if (error.statusCode !== 409 && error.statusCode !== 422) throw error;
    }
  }
  const error = new Error("มีการลงทะเบียนพร้อมกัน กรุณาลองใหม่");
  error.statusCode = 409;
  throw error;
}

async function authenticateUser({ username, password }) {
  username = String(username || "").trim();
  password = String(password || "");
  const { data } = await loadUsers();
  const user = data.users.find((item) => item.username.toLowerCase() === username.toLowerCase());
  if (!user || !passwordMatches(password, user)) {
    const error = new Error("Username หรือ Password ไม่ถูกต้อง");
    error.statusCode = 401;
    throw error;
  }
  return { username: user.username };
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function issueSession(username) {
  const payload = base64url(JSON.stringify({
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS
  }));
  const sig = crypto.createHmac("sha256", keyFor("session")).update(payload).digest("base64url");
  return payload + "." + sig;
}

function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", keyFor("session")).update(payload).digest("base64url");
  if (!safeEqualText(signature, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.username || Number(data.exp) <= Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

function cookies(req) {
  const header = String(req.headers.cookie || "");
  return Object.fromEntries(header.split(";").map((part) => {
    const index = part.indexOf("=");
    if (index < 0) return ["", ""];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function sessionFromRequest(req) {
  if (!configured()) return null;
  return verifySessionToken(cookies(req)[COOKIE_NAME]);
}

function requireSession(req) {
  const session = sessionFromRequest(req);
  if (!session) {
    const error = new Error("กรุณาเข้าสู่ระบบผู้บันทึกก่อนนำเข้าไฟล์");
    error.statusCode = 401;
    throw error;
  }
  return session;
}

function setSessionCookie(res, username) {
  const token = issueSession(username);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function apiError(res, error) {
  const status = Number(error.statusCode) || 500;
  res.status(status).json({ ok: false, error: status >= 500 ? error.message : error.message });
}

module.exports = {
  configured,
  registerConfigured,
  registerUser,
  authenticateUser,
  sessionFromRequest,
  requireSession,
  setSessionCookie,
  clearSessionCookie,
  readJsonBody,
  apiError
};
