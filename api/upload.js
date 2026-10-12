const crypto = require("crypto");
const { commitFiles } = require("../server/github");

const MAX_FILE_BYTES = 3 * 1024 * 1024;

function safeFileName(name) {
  const base = String(name || "report.xlsx")
    .replace(/[\\/\0\r\n]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return base || "report.xlsx";
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
  return res.status(status).json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
}

function looksLikeExcel(buffer, fileName) {
  if (/\.xlsx$/i.test(fileName)) return buffer[0] === 0x50 && buffer[1] === 0x4b; // ZIP / OOXML
  if (/\.xls$/i.test(fileName)) {
    return buffer.length >= 8 &&
      buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
  }
  return false;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  try {
    const body = await readJsonBody(req);
    const fileName = safeFileName(body.fileName);

    if (!/\.(xlsx|xls)$/i.test(fileName)) {
      const error = new Error("รองรับเฉพาะไฟล์ Excel .xlsx หรือ .xls");
      error.statusCode = 400;
      throw error;
    }

    const buffer = Buffer.from(String(body.contentBase64 || ""), "base64");
    if (!buffer.length) {
      const error = new Error("ไม่พบข้อมูลไฟล์");
      error.statusCode = 400;
      throw error;
    }
    if (buffer.length > MAX_FILE_BYTES) {
      const error = new Error("ไฟล์มีขนาดเกิน 3 MB");
      error.statusCode = 413;
      throw error;
    }
    if (!looksLikeExcel(buffer, fileName)) {
      const error = new Error("ไฟล์ที่เลือกไม่ใช่ไฟล์ Excel ที่ถูกต้อง");
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const stamp = now.toISOString().replace(/[:.]/g, "-");
    const suffix = crypto.randomBytes(3).toString("hex");
    const archivePath = `Data/imports/${date}/${stamp}-${suffix}-${fileName}`;

    const metadata = {
      version: now.getTime(),
      uploadedAt: now.toISOString(),
      uploadedBy: "public-import",
      originalFileName: fileName,
      archivePath,
      sizeBytes: buffer.length
    };

    const commitSha = await commitFiles([
      { path: archivePath, content: buffer.toString("base64"), encoding: "base64" },
      { path: "Data/live/latest.json", content: JSON.stringify(metadata, null, 2) + "\n", encoding: "utf-8" }
    ], `Import USO report: ${fileName}`);

    return res.status(200).json({ ok: true, commitSha, metadata });
  } catch (error) {
    return apiError(res, error);
  }
};