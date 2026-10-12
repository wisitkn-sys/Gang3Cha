(() => {
  const RAW_BASE = "https://raw.githubusercontent.com/wisitkn-sys/Gang3Cha/main/";
  const LATEST_META = RAW_BASE + "Data/live/latest.json";
  const LEGACY_WORKBOOK = "https://raw.githubusercontent.com/wisitkn-sys/Gang3Cha/main/Data/%23U0e23%23U0e32%23U0e22%23U0e07%23U0e32%23U0e19%23U0e1b%23U0e23%23U0e30%23U0e08%23U0e33%23U0e27%23U0e31%23U0e19%23U0e0a%23U0e38%23U0e21%23U0e2a%23U0e32%23U0e22%20v2.5.xlsx";

  let loadingShared = false;
  let latestVersion = null;

  async function api(path, options = {}) {
    const response = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.readAsDataURL(file);
    });
  }

  async function saveWorkbook(file) {
    if (!file) throw new Error("ไม่พบไฟล์ที่จะนำเข้า");
    if (file.size > 3 * 1024 * 1024) throw new Error("ไฟล์มีขนาดเกิน 3 MB");

    const contentBase64 = await fileToBase64(file);
    const result = await api("/api/upload", {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, contentBase64 })
    });

    latestVersion = String(result.metadata?.version || "");
    return result;
  }

  function rawUrl(path, version) {
    return RAW_BASE + String(path).split("/").map(encodeURIComponent).join("/") +
      "?v=" + encodeURIComponent(version || Date.now());
  }

  async function loadWorkbookFromUrl(url, fileName) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("ไม่สามารถโหลดไฟล์ข้อมูลล่าสุดได้");

    const buffer = await response.arrayBuffer();
    const file = new File([buffer], fileName || "latest.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    if (typeof window.importWorkbook !== "function") throw new Error("ตัวอ่าน Excel ยังไม่พร้อม");
    await window.importWorkbook(file, { upload: false, shared: true, silent: true });
    window.dispatchEvent(new CustomEvent("uso-shared-workbook", { detail: { file } }));
    return file;
  }

  async function loadSharedData({ silent = false, onlyIfChanged = false } = {}) {
    if (loadingShared) return;
    loadingShared = true;
    try {
      const metaResponse = await fetch(LATEST_META + "?cb=" + Date.now(), { cache: "no-store" });

      if (metaResponse.ok) {
        const meta = await metaResponse.json();
        const version = String(meta.version || meta.uploadedAt || meta.archivePath || "");
        if (onlyIfChanged && latestVersion && version === latestVersion) return;

        await loadWorkbookFromUrl(rawUrl(meta.archivePath, meta.version), meta.originalFileName);
        latestVersion = version;

        if (!silent) {
          const toast = document.querySelector("#toast");
          if (toast) {
            toast.textContent = "อัปเดตข้อมูลกลางล่าสุดแล้ว";
            toast.classList.add("show");
            window.setTimeout(() => toast.classList.remove("show"), 2200);
          }
        }
        return;
      }

      if (metaResponse.status !== 404) throw new Error("โหลดข้อมูลล่าสุดไม่สำเร็จ");
      if (onlyIfChanged && latestVersion === "legacy") return;

      await loadWorkbookFromUrl(
        LEGACY_WORKBOOK + "?cb=" + Date.now(),
        "รายงานประจำวันชุมสาย v2.5.xlsx"
      );
      latestVersion = "legacy";
    } catch (error) {
      console.warn("Shared data:", error);
      if (!silent) window.alert(error.message || "ไม่สามารถโหลดข้อมูลกลางล่าสุดได้");
    } finally {
      loadingShared = false;
    }
  }

  window.usoShared = {
    requestImport: () => document.querySelector("#import-file")?.click(),
    saveWorkbook,
    refreshData: () => loadSharedData({ silent: false })
  };

  window.setTimeout(() => loadSharedData({ silent: true }), 0);

  // Open dashboards follow the newest shared workbook without requiring login.
  window.setInterval(() => loadSharedData({ silent: true, onlyIfChanged: true }), 60000);
  window.addEventListener("focus", () => loadSharedData({ silent: true, onlyIfChanged: true }));
})();