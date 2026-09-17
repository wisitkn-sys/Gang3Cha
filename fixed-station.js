(() => {
  const LATEST_WORKBOOK = {
    name: "รายงานประจำวันชุมสาย v2.5.xlsx",
    url: "https://raw.githubusercontent.com/wisitkn-sys/Gang3Cha/main/Data/%23U0e23%23U0e32%23U0e22%23U0e07%23U0e32%23U0e19%23U0e1b%23U0e23%23U0e30%23U0e08%23U0e33%23U0e27%23U0e31%23U0e19%23U0e0a%23U0e38%23U0e21%23U0e2a%23U0e32%23U0e22%20v2.5.xlsx"
  };

  let fixedStations = [];
  let activeProvince = "";
  const originalRenderStations = window.renderStations;

  const q = (selector) => document.querySelector(selector);
  const qa = (selector) => [...document.querySelectorAll(selector)];
  const checkedValue = (value) => value === true || value === 1 || /^(true|yes|y|1|checked|x|✓)$/i.test(String(value ?? "").trim());
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  function normalizeHeader(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findColumn(headers, patterns, fallback) {
    const index = headers.findIndex((header) => patterns.some((pattern) => pattern.test(normalizeHeader(header))));
    return index >= 0 ? index : fallback;
  }

  function parseFixedStationSheet(workbook) {
    const sheet = workbook.Sheets?.["Fixed Station"];
    if (!sheet || !window.XLSX) return [];

    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    const headerIndex = matrix.findIndex((row) => row.some((cell) => /ลำดับ.*tor/i.test(String(cell))) && row.some((cell) => /หมู่บ้าน/i.test(String(cell))));
    if (headerIndex < 0) return [];

    const headers = matrix[headerIndex];
    const col = {
      tor: findColumn(headers, [/ลำดับ.*tor/i, /^tor$/i], 0),
      village: findColumn(headers, [/หมู่บ้าน/i], 1),
      subdistrict: findColumn(headers, [/ตำบล/i], 2),
      district: findColumn(headers, [/อำเภอ/i], 3),
      province: findColumn(headers, [/จังหวัด/i], 4),
      offline: findColumn(headers, [/สถานะ/i, /offline/i, /ofline/i], 5)
    };

    return matrix.slice(headerIndex + 1).map((row) => {
      const tor = row[col.tor];
      const village = row[col.village];
      const subdistrict = row[col.subdistrict];
      const district = row[col.district];
      const province = row[col.province];
      const offline = checkedValue(row[col.offline]);
      return {
        tor: String(tor ?? "").trim(),
        village: String(village ?? "").trim(),
        subdistrict: String(subdistrict ?? "").trim(),
        district: String(district ?? "").trim(),
        province: String(province ?? "").trim(),
        status: offline ? "down" : "online",
        offline
      };
    }).filter((row) => row.tor || row.village || row.subdistrict || row.district || row.province);
  }

  function fixedStatusBadge(station) {
    const label = station.status === "down" ? "Offline" : "Online";
    return '<span class="status-' + station.status + '">' + label + '</span>';
  }

  function fixedRowMarkup(station) {
    return '<tr>' +
      '<td>' + esc(station.tor) + '</td>' +
      '<td>' + esc(station.village) + '</td>' +
      '<td>' + esc(station.subdistrict) + '</td>' +
      '<td>' + esc(station.district) + '</td>' +
      '<td>' + esc(station.province) + '</td>' +
      '<td>' + fixedStatusBadge(station) + '</td>' +
      '</tr>';
  }

  function standardTableHead() {
    return '<tr><th>รหัส</th><th>ชื่อสถานี</th><th>อุปกรณ์</th><th>ตรวจล่าสุด</th><th>สถานะ</th></tr>';
  }

  function fixedTableHead() {
    return '<tr><th>ลำดับ TOR</th><th>หมู่บ้าน</th><th>ตำบล</th><th>อำเภอ</th><th>จังหวัด</th><th>สถานะ</th></tr>';
  }

  function setStatusFilterForType(type) {
    const select = q("#station-status");
    if (!select) return;
    const current = select.value;
    if (type === "fixed") {
      select.innerHTML = '<option value="all">ทุกสถานะ</option><option value="online">Online</option><option value="down">Offline</option>';
    } else {
      select.innerHTML = '<option value="all">ทุกสถานะ</option><option value="online">Online</option><option value="warning">Warning</option><option value="down">Down</option>';
    }
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  }

  function renderFixedStationTable() {
    const search = (q("#station-search")?.value || "").trim().toLowerCase();
    const status = q("#station-status")?.value || "all";
    const rows = fixedStations.filter((station) => {
      const haystack = [station.tor, station.village, station.subdistrict, station.district, station.province].join(" ").toLowerCase();
      return (status === "all" || station.status === status) && haystack.includes(search);
    });

    const head = q("#station-table-head");
    const body = q("#station-rows");
    if (head) head.innerHTML = fixedTableHead();
    if (body) body.innerHTML = rows.length ? rows.map(fixedRowMarkup).join("") : '<tr><td colspan="6">ไม่พบ Fixed Station ตามเงื่อนไข</td></tr>';
    const count = q("#station-result-count");
    if (count) count.textContent = rows.length + " จุด";
    q("#stations")?.classList.add("fixed-mode");
  }

  function renderEnhancedStations() {
    const type = q(".station-type.active")?.dataset.type || "base";
    setStatusFilterForType(type);
    if (type === "fixed") {
      renderFixedStationTable();
      return;
    }

    q("#stations")?.classList.remove("fixed-mode");
    const head = q("#station-table-head");
    if (head) head.innerHTML = standardTableHead();
    if (typeof originalRenderStations === "function") originalRenderStations();
  }

  function selectedProvinceRows() {
    return fixedStations.filter((station) => station.province === activeProvince);
  }

  function renderProvinceContent() {
    const content = q("#fixed-province-content");
    if (!content) return;
    const rows = selectedProvinceRows();
    if (!activeProvince || !rows.length) {
      content.innerHTML = '<div class="fixed-empty">ยังไม่มีข้อมูล Fixed Station</div>';
      return;
    }

    const offlineCount = rows.filter((row) => row.status === "down").length;
    content.innerHTML =
      '<div class="fixed-province-summary"><strong>' + esc(activeProvince) + '</strong><span>' + rows.length + ' จุด · Offline ' + offlineCount + ' จุด</span></div>' +
      '<div class="fixed-province-table-wrap"><table class="fixed-province-table">' +
      '<thead><tr><th>TOR</th><th>หมู่บ้าน</th><th>ตำบล</th><th>อำเภอ</th><th>สถานะ</th></tr></thead>' +
      '<tbody>' + rows.map((station) => '<tr><td>' + esc(station.tor) + '</td><td>' + esc(station.village) + '</td><td>' + esc(station.subdistrict) + '</td><td>' + esc(station.district) + '</td><td>' + fixedStatusBadge(station) + '</td></tr>').join("") + '</tbody></table></div>';
  }

  function renderProvincePanel() {
    const tabs = q("#fixed-province-tabs");
    if (!tabs) return;
    const provinces = [...new Set(fixedStations.map((station) => station.province).filter(Boolean))].slice(0, 10);
    if (!provinces.includes(activeProvince)) activeProvince = provinces[0] || "";

    tabs.innerHTML = provinces.length
      ? provinces.map((province) => {
          const rows = fixedStations.filter((station) => station.province === province);
          const offline = rows.filter((station) => station.status === "down").length;
          return '<button type="button" class="fixed-province-tab' + (province === activeProvince ? ' active' : '') + '" data-province="' + esc(province) + '"><span>' + esc(province) + '</span><small>' + rows.length + ' จุด' + (offline ? ' · Offline ' + offline : '') + '</small></button>';
        }).join("")
      : '<span class="fixed-empty">กำลังโหลดข้อมูล Fixed Station…</span>';

    tabs.querySelectorAll(".fixed-province-tab").forEach((button) => {
      button.addEventListener("click", () => {
        activeProvince = button.dataset.province || "";
        renderProvincePanel();
      });
    });
    renderProvinceContent();
  }

  function createFixedStationUI() {
    const toggle = q(".station-toggle");
    if (toggle && !q('.station-type[data-type="fixed"]')) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "station-type";
      button.dataset.type = "fixed";
      button.textContent = "Fixed Station";
      toggle.appendChild(button);
    }

    const tableHead = q("#stations table thead");
    if (tableHead) tableHead.id = "station-table-head";

    const lowerGrid = q(".lower-grid");
    const reportPanel = q("#report-content");
    if (lowerGrid && reportPanel && !q(".report-column")) {
      const reportColumn = document.createElement("div");
      reportColumn.className = "report-column";
      lowerGrid.insertBefore(reportColumn, reportPanel);
      reportColumn.appendChild(reportPanel);

      const fixedPanel = document.createElement("article");
      fixedPanel.className = "panel fixed-province-panel";
      fixedPanel.id = "fixed-provinces";
      fixedPanel.innerHTML = '<div class="panel-header"><div><p class="panel-kicker">FIXED STATION</p><h3>สถานีรายจังหวัด</h3></div><span class="subtle" id="fixed-province-count">10 จังหวัด</span></div><div class="fixed-province-tabs" id="fixed-province-tabs"><span class="fixed-empty">กำลังโหลดข้อมูล Fixed Station…</span></div><div class="fixed-province-content" id="fixed-province-content"></div>';
      reportColumn.appendChild(fixedPanel);
    }

    qa(".station-type").forEach((button) => {
      button.addEventListener("click", () => {
        qa(".station-type").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        renderEnhancedStations();
      });
    });
    q("#station-search")?.addEventListener("input", renderEnhancedStations);
    q("#station-status")?.addEventListener("change", renderEnhancedStations);
  }

  async function parseFixedFromFile(file) {
    if (!file || !window.XLSX) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const parsed = parseFixedStationSheet(workbook);
    if (!parsed.length) return;
    fixedStations = parsed;
    renderProvincePanel();
    if (q('.station-type.active[data-type="fixed"]')) renderFixedStationTable();
  }

  async function loadLatestWorkbook() {
    if (!window.XLSX) return;
    try {
      const response = await fetch(LATEST_WORKBOOK.url, { cache: "no-store" });
      if (!response.ok) throw new Error("โหลดไฟล์ล่าสุดไม่สำเร็จ");
      const buffer = await response.arrayBuffer();
      const file = new File([buffer], LATEST_WORKBOOK.name, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      if (typeof window.importWorkbook === "function") {
        await window.importWorkbook(file);
      } else if (typeof importWorkbook === "function") {
        await importWorkbook(file);
      }

      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      fixedStations = parseFixedStationSheet(workbook);
      renderProvincePanel();
      renderEnhancedStations();

      const count = q("#fixed-province-count");
      const provinces = [...new Set(fixedStations.map((station) => station.province).filter(Boolean))];
      if (count) count.textContent = provinces.length + " จังหวัด";
    } catch (error) {
      console.warn("Fixed Station data:", error);
      const tabs = q("#fixed-province-tabs");
      if (tabs) tabs.innerHTML = '<span class="fixed-empty">ไม่สามารถโหลดข้อมูล Fixed Station ล่าสุดได้</span>';
    }
  }

  createFixedStationUI();
  renderProvincePanel();

  const importInput = q("#import-file");
  importInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) parseFixedFromFile(file).catch((error) => console.warn("Fixed Station import:", error));
  });

  loadLatestWorkbook();
})();