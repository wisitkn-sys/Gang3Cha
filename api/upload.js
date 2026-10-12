const crypto = require("crypto");
const { commitFiles } = require("../server/github");
const { requireSession, readJsonBody, apiError } = require("../server/auth");

const MAX_FILE_BYTES = 3 * 1024 * 1024;

function safeFileName(name) {
  const base = String(name || "report.xlsx")
    .replace(/[\\/\0\r\n]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return base || "report.xlsx";
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  try {
    const session = requireSession(req);
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
      const error = new Error("ไฟล์มีขนาดเกิน 3 MB ซึ่งเกินขนาดที่ระบบอัปโหลดกลางรองรับ");
      error.statusCode = 413;
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
      uploadedBy: session.username,
      originalFileName: fileName,
      archivePath,
      sizeBytes: buffer.length
    };

    const commitSha = await commitFiles([
      { path: archivePath, content: buffer.toString("base64"), encoding: "base64" },
      { path: "Data/live/latest.json", content: JSON.stringify(metadata, null, 2) + "\n", encoding: "utf-8" }
    ], `Import USO report: ${fileName} by ${session.username}`);

    return res.status(200).json({ ok: true, commitSha, metadata });
  } catch (error) {
    return apiError(res, error);
  }
};
