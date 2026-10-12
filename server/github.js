const OWNER = "wisitkn-sys";
const REPO = "Gang3Cha";
const BRANCH = "main";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

function githubToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    const error = new Error("ระบบบันทึกส่วนกลางยังไม่ได้ตั้งค่า GITHUB_TOKEN");
    error.statusCode = 503;
    throw error;
  }
  return token;
}

async function gh(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "uso-monitor",
      ...(options.headers || {})
    }
  });
  if (options.allow404 && response.status === 404) return null;
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(`GitHub API ${response.status}: ${detail.slice(0, 400)}`);
    error.statusCode = response.status === 401 || response.status === 403 ? 503 : response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

function contentPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function readFile(path) {
  const data = await gh(`/contents/${contentPath(path)}?ref=${encodeURIComponent(BRANCH)}`, { allow404: true });
  if (!data) return null;
  return {
    sha: data.sha,
    buffer: Buffer.from(String(data.content || "").replace(/\n/g, ""), "base64")
  };
}

async function writeFile(path, buffer, message, sha) {
  return gh(`/contents/${contentPath(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      branch: BRANCH,
      content: Buffer.from(buffer).toString("base64"),
      ...(sha ? { sha } : {})
    })
  });
}

async function createBlob(content, encoding) {
  const data = await gh("/git/blobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, encoding })
  });
  return data.sha;
}

async function commitFiles(files, message, retries = 3) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const ref = await gh(`/git/ref/heads/${encodeURIComponent(BRANCH)}`);
      const parentSha = ref.object.sha;
      const parentCommit = await gh(`/git/commits/${parentSha}`);

      const blobs = await Promise.all(files.map(async (file) => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: await createBlob(file.content, file.encoding || "utf-8")
      })));

      const tree = await gh("/git/trees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: blobs })
      });

      const commit = await gh("/git/commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] })
      });

      await gh(`/git/refs/heads/${encodeURIComponent(BRANCH)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha: commit.sha, force: false })
      });
      return commit.sha;
    } catch (error) {
      lastError = error;
      if (error.statusCode !== 409 && error.statusCode !== 422) throw error;
    }
  }
  throw lastError || new Error("ไม่สามารถ commit ข้อมูลขึ้น GitHub ได้");
}

module.exports = { OWNER, REPO, BRANCH, readFile, writeFile, commitFiles, githubToken };
