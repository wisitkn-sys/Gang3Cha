(() => {
  const RAW_BASE = "https://raw.githubusercontent.com/wisitkn-sys/Gang3Cha/main/";
  const LATEST_META = RAW_BASE + "Data/live/latest.json";
  const LEGACY_WORKBOOK = "https://raw.githubusercontent.com/wisitkn-sys/Gang3Cha/main/Data/%23U0e23%23U0e32%23U0e22%23U0e07%23U0e32%23U0e19%23U0e1b%23U0e23%23U0e30%23U0e08%23U0e33%23U0e27%23U0e31%23U0e19%23U0e0a%23U0e38%23U0e21%23U0e2a%23U0e32%23U0e22%20v2.5.xlsx";

  const q = (selector) => document.querySelector(selector);
  let session = { authenticated: false, configured: false, registrationConfigured: false, username: null };
  let pendingImport = false;
  let loadingShared = false;

  async function api(path, options = {}) {
    const response = await fetch(path, {
      cache: "no-store",
      credentials: "same-origin",
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

  async function refreshSession() {
    try {
      session = await api("/api/auth/session");
    } catch {
      session = { authenticated: false, configured: false, registrationConfigured: false, username: null };
    }
    renderAuthState();
    return session;
  }

  function setAuthMessage(message, isError = false) {
    const el = q("#uploader-auth-message");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("error", Boolean(isError));
  }

  function renderAuthState() {
    const status = q("#uploader-auth-status");
    const logout = q("#uploader-logout");
    if (status) {
      status.textContent = session.authenticated
        ? "เข้าสู่ระบบแล้ว: " + session.username
        : session.configured
          ? "ผู้ดูสถานะไม่จำเป็นต้องเข้าสู่ระบบ"
          : "ระบบบันทึกส่วนกลางยังตั้งค่าไม่ครบ";
    }
    if (logout) logout.hidden = !session.authenticated;
    const registerTab = q('[data-auth-tab="register"]');
    if (registerTab) registerTab.disabled = !session.registrationConfigured;
  }

  function showTab(name) {
    document.querySelectorAll("[data-auth-tab]").forEach((button) => {
      button.classList.toggle("active", button.dataset.authTab === name);
    });
    q("#uploader-login-form")?.toggleAttribute("hidden", name !== "login");
    q("#uploader-register-form")?.toggleAttribute("hidden", name !== "register");
    setAuthMessage("");
  }

  function openAuth(tab = "login") {
    showTab(tab);
    renderAuthState();
    const dialog = q("#uploader-auth-dialog");
    if (dialog && !dialog.open) dialog.showModal();
  }

  async function requestImport() {
    await refreshSession();
    if (session.authenticated) {
      q("#import-file")?.click();
      return;
    }
    pendingImport = true;
    openAuth("login");
    if (!session.configured) {
      setAuthMessage("ยังไม่ได้ตั้งค่า Secret ฝั่ง Vercel สำหรับระบบผู้บันทึก", true);
    }
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
    await refreshSession();
    if (!session.authenticated) {
      pendingImport = true;
      openAuth("login");
      const error = new Error("กรุณาเข้าสู่ระบบผู้บันทึกก่อนนำเข้าไฟล์");
      error.status = 401;
      throw error;
    }
    if (file.size > 3 * 1024 * 1024) throw new Error("ไฟล์มีขนาดเกิน 3 MB");

    const contentBase64 = await fileToBase64(file);
    const result = await api("/api/upload", {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, contentBase64 })
    });
    return result;
  }

  function rawUrl(path, version) {
    return RAW_BASE + String(path).split("/").map(encodeURIComponent).join("/") + "?v=" + encodeURIComponent(version || Date.now());
  }

  async function loadWorkbookFromUrl(url, fileName) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("ไม่สามารถโหลดไฟล์ข้อมูลล่าสุดได้");
    const buffer = await response.arrayBuffer();
    const file = new File([buffer], fileName || "latest.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    if (typeof window.importWorkbook !== "function") throw new Error("ตัวอ่าน Excel ยังไม่พร้อม");
    await window.importWorkbook(file, { upload: false, shared: true });
    window.dispatchEvent(new CustomEvent("uso-shared-workbook", { detail: { file } }));
    return file;
  }

  async function loadSharedData({ silent = false } = {}) {
    if (loadingShared) return;
    loadingShared = true;
    try {
      const metaResponse = await fetch(LATEST_META + "?cb=" + Date.now(), { cache: "no-store" });
      if (metaResponse.ok) {
        const meta = await metaResponse.json();
        await loadWorkbookFromUrl(rawUrl(meta.archivePath, meta.version), meta.originalFileName);
        if (!silent) {
          const toast = q("#toast");
          if (toast) {
            toast.textContent = "อัปเดตข้อมูลกลางล่าสุดแล้ว";
            toast.classList.add("show");
            window.setTimeout(() => toast.classList.remove("show"), 2200);
          }
        }
        return;
      }
      if (metaResponse.status !== 404) throw new Error("โหลด metadata ล่าสุดไม่สำเร็จ");
      await loadWorkbookFromUrl(LEGACY_WORKBOOK + "?cb=" + Date.now(), "รายงานประจำวันชุมสาย v2.5.xlsx");
    } catch (error) {
      console.warn("Shared data:", error);
      if (!silent) window.alert(error.message || "ไม่สามารถโหลดข้อมูลกลางล่าสุดได้");
    } finally {
      loadingShared = false;
    }
  }

  async function onLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
      session = { ...session, authenticated: true, username: result.username };
      renderAuthState();
      setAuthMessage("เข้าสู่ระบบสำเร็จ");
      q("#uploader-auth-dialog")?.close();
      if (pendingImport) {
        pendingImport = false;
        window.setTimeout(() => q("#import-file")?.click(), 50);
      }
    } catch (error) {
      setAuthMessage(error.message, true);
    }
  }

  async function onRegister(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (data.password !== data.confirmPassword) {
      setAuthMessage("Password และยืนยัน Password ไม่ตรงกัน", true);
      return;
    }
    try {
      const result = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          registrationCode: data.registrationCode
        })
      });
      session = { ...session, authenticated: true, username: result.username };
      renderAuthState();
      setAuthMessage("ลงทะเบียนสำเร็จ");
      q("#uploader-auth-dialog")?.close();
      if (pendingImport) {
        pendingImport = false;
        window.setTimeout(() => q("#import-file")?.click(), 50);
      }
    } catch (error) {
      setAuthMessage(error.message, true);
    }
  }

  function bindAuthUI() {
    document.querySelectorAll("[data-auth-tab]").forEach((button) => {
      button.addEventListener("click", () => showTab(button.dataset.authTab));
    });
    q("#uploader-auth-close")?.addEventListener("click", () => q("#uploader-auth-dialog")?.close());
    q("#uploader-login-form")?.addEventListener("submit", onLogin);
    q("#uploader-register-form")?.addEventListener("submit", onRegister);
    q("#uploader-logout")?.addEventListener("click", async () => {
      try { await api("/api/auth/logout", { method: "POST", body: "{}" }); } catch {}
      session = { ...session, authenticated: false, username: null };
      renderAuthState();
      setAuthMessage("ออกจากระบบแล้ว");
    });
  }

  window.usoShared = {
    requestImport,
    saveWorkbook,
    refreshData: () => loadSharedData({ silent: false }),
    openAuth,
    refreshSession
  };

  bindAuthUI();
  refreshSession();
  window.setTimeout(() => loadSharedData({ silent: true }), 0);
})();
