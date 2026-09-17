(() => {
  const LATEST_WORKBOOK = {
    name: "รายงานประจำวันชุมสาย v2.5.xlsx",
    url: "https://raw.githubusercontent.com/wisitkn-sys/Gang3Cha/main/Data/%23U0e23%23U0e32%23U0e22%23U0e07%23U0e32%23U0e19%23U0e1b%23U0e23%23U0e30%23U0e08%23U0e33%23U0e27%23U0e31%23U0e19%23U0e0a%23U0e38%23U0e21%23U0e2a%23U0e32%23U0e22%20v2.5.xlsx"
  };
  const BSSC_LINK = "https://ifm.dopa-ifm.com:8443/zabbix.php?action=map.view&sysmapid=412";

  let fixedStations = [];
  const selectedProvinces = new Set();
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
      const offline = checkedValue(row[col.offline]);
      return {
        tor: String(row[col.tor] ?? "").trim(),
        village: String(row[col.village] ?? "").trim(),
        subdistrict: String(row[col.subdistrict] ?? "").trim(),
        district: String(row[col.district] ?? "").trim(),
        province: String(row[col.province] ?? "").trim(),
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
    return '<tr><th>หมายเลขสถานี</th><th>ชื่อสถานี</th><th>อุปกรณ์</th><th>ตรวจล่าสุด</th><th>สถานะ</th></tr>';
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

  function provinceFilteredStations() {
    if (!selectedProvinces.size) return fixedStations;
    return fixedStations.filter((station) => selectedProvinces.has(station.province));
  }

  function renderFixedStationTable() {
    const search = (q("#station-search")?.value || "").trim().toLowerCase();
    const status = q("#station-status")?.value || "all";
    const rows = provinceFilteredStations().filter((station) => {
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

  function provinceStats(province) {
    const rows = fixedStations.filter((station) => station.province === province);
    const online = rows.filter((station) => station.status === "online").length;
    const offlineRows = rows.filter((station) => station.status === "down");
    return { rows, total: rows.length, online, offline: offlineRows.length, offlineRows };
  }

  function renderProvincePanel() {
    const tabs = q("#fixed-province-tabs");
    if (!tabs) return;
    const provinces = [...new Set(fixedStations.map((station) => station.province).filter(Boolean))].slice(0, 10);

    for (const province of [...selectedProvinces]) {
      if (!provinces.includes(province)) selectedProvinces.delete(province);
    }

    tabs.innerHTML = provinces.length
      ? provinces.map((province) => {
          const stats = provinceStats(province);
          const active = selectedProvinces.has(province);
          return '<button type="button" class="fixed-province-tab' + (active ? ' active' : '') + '" data-province="' + esc(province) + '" aria-pressed="' + active + '">' +
            '<span>' + esc(province) + '</span>' +
            '<small>จำนวนลูกข่ายทั้งหมด ' + stats.total + ' จุด</small>' +
            '<small class="fixed-province-online">Online ' + stats.online + '/' + stats.total + ' จุด</small>' +
            '</button>';
        }).join("")
      : '<span class="fixed-empty">กำลังโหลดข้อมูล Fixed Station…</span>';

    tabs.querySelectorAll(".fixed-province-tab").forEach((button) => {
      button.addEventListener("click", () => {
        const province = button.dataset.province || "";
        if (!province) return;
        if (selectedProvinces.has(province)) selectedProvinces.delete(province);
        else selectedProvinces.add(province);
        renderProvincePanel();
        if (q('.station-type.active[data-type="fixed"]')) renderFixedStationTable();
      });
    });
    renderPrintFixedPage();
  }

  function printHeaderMarkup() {
    return '<div class="print-header">' +
      '<div class="print-logo-box"><img src="./logo/Nbtc.png" alt="สำนักงาน กสทช." class="print-logo-nbtc" /></div>' +
      '<div class="print-header-center"><div class="print-project-title">' +
        'การจัดซื้ออุปกรณ์พร้อมดำเนินการติดตั้ง<br>' +
        '<span class="print-project-name">โครงการเพิ่มประสิทธิภาพระบบโครงข่ายสื่อสารด้วยอุปกรณ์ทวนสัญญาณผ่านคลื่นความถี่สูง (SHF)</span><br>' +
        'เพื่อสนับสนุนการปฏิบัติราชการและแก้ไขปัญหาให้กับประชาชนในพื้นที่ห่างไกล<br>' +
        'สัญญาเลขที่ ๘๖๘๐๒๒๘ ลงวันที่ ๒๓ กรกฎาคม ๒๕๖๘' +
      '</div></div>' +
      '<div class="print-logo-box"><img src="./logo/EX Forth.png" alt="Forth Corporation" class="print-logo-forth" /></div>' +
      '</div>';
  }

  function createPrintPageFour() {
    if (q("#print-fixed-page")) return;
    const main = q(".main-content");
    if (!main) return;
    const section = document.createElement("section");
    section.className = "print-page-four";
    section.id = "print-fixed-page";
    section.setAttribute("aria-label", "รายงานหน้าที่ 4 สถานีลูกข่ายชนิดประจำที่");
    section.innerHTML = '<div class="print-page-frame print-fixed-page-frame">' +
      printHeaderMarkup() +
      '<div class="print-fixed-title-row">' +
        '<div><p class="panel-kicker">REPORT PAGE 4</p><h2>สถานีลูกข่ายชนิดประจำที่</h2><p class="print-fixed-subtitle">/ FIXED STATION SUMMARY</p></div>' +
        '<span class="subtle print-fixed-report-date" id="print-fixed-province-count"></span>' +
      '</div>' +
      '<div class="print-fixed-summary" id="print-fixed-summary"></div>' +
      '<div class="print-fixed-province-grid" id="print-fixed-province-grid"></div>' +
      '</div>';
    const footer = q("footer");
    if (footer) main.insertBefore(section, footer);
    else main.appendChild(section);
  }

  function createPreviewPageFour() {
    if (q("#preview-page4-sheet")) return;
    const container = q(".paper-preview-container");
    if (!container) return;

    const page3 = q("#preview-page3-sheet");
    if (page3?.previousElementSibling?.classList.contains("paper-sheet-header")) {
      const label = page3.previousElementSibling.querySelector("span");
      if (label) label.textContent = "หน้า 3 / Page 3";
    }

    const header = document.createElement("div");
    header.className = "paper-sheet-header";
    header.id = "preview-page4-header";
    header.innerHTML = '<span>หน้า 4 / Page 4</span><small>สถานีลูกข่ายชนิดประจำที่</small>';

    const sheet = document.createElement("div");
    sheet.className = "paper-sheet preview-print-frame preview-fixed-page";
    sheet.id = "preview-page4-sheet";
    sheet.innerHTML =
      printHeaderMarkup() +
      '<div class="print-fixed-title-row">' +
        '<div><p class="panel-kicker">REPORT PAGE 4</p><h2>สถานีลูกข่ายชนิดประจำที่</h2><p class="print-fixed-subtitle">/ FIXED STATION SUMMARY</p></div>' +
        '<span class="subtle print-fixed-report-date" id="preview-fixed-province-count"></span>' +
      '</div>' +
      '<div class="print-fixed-summary" id="preview-fixed-summary"></div>' +
      '<div class="print-fixed-province-grid" id="preview-fixed-province-grid"></div>';

    container.appendChild(header);
    container.appendChild(sheet);
  }

  function fixedSummaryMarkup(provinces, total, online, offline) {
    return '<div><span>จังหวัดทั้งหมด</span><strong>' + provinces.length + ' จังหวัด</strong></div>' +
      '<div><span>จำนวนลูกข่ายทั้งหมด</span><strong>' + total + ' จุด</strong></div>' +
      '<div><span>Online</span><strong>' + online + '/' + total + ' จุด</strong></div>' +
      '<div><span>Offline</span><strong>' + offline + ' จุด</strong></div>';
  }

  function fixedProvinceCardsMarkup(provinces) {
    return provinces.map((province) => {
      const stats = provinceStats(province);
      const pct = stats.total ? (stats.online / stats.total) * 100 : 0;
      const offlineVillages = stats.offlineRows
        .map((station) => station.village || (station.tor ? "TOR " + station.tor : ""))
        .filter(Boolean);
      const offlineDetail = offlineVillages.length
        ? '<div class="print-fixed-offline-list"><strong>Offline:</strong><span>' + offlineVillages.map(esc).join(' · ') + '</span></div>'
        : '';

      return '<article class="print-fixed-province-card">' +
        '<div class="print-fixed-province-head"><strong>' + esc(province) + '</strong><span>' + stats.online + '/' + stats.total + '</span></div>' +
        '<p>จำนวนลูกข่ายทั้งหมด <strong>' + stats.total + ' จุด</strong></p>' +
        '<div class="print-fixed-progress"><i style="width:' + pct.toFixed(2) + '%"></i></div>' +
        '<div class="print-fixed-province-foot"><span>Online ' + stats.online + '/' + stats.total + ' จุด</span><span' + (stats.offline ? ' class="has-offline"' : '') + '>Offline ' + stats.offline + ' จุด</span></div>' +
        offlineDetail +
        '</article>';
    }).join("");
  }

  function renderPrintFixedPage() {
    createPrintPageFour();
    createPreviewPageFour();

    const provinces = [...new Set(fixedStations.map((station) => station.province).filter(Boolean))].slice(0, 10);
    const total = fixedStations.length;
    const online = fixedStations.filter((station) => station.status === "online").length;
    const offline = total - online;
    const dateLabel = q("#print-period-label")?.textContent || "";
    const reportDateMarkup = 'วันที่รายงาน: <strong>' + esc(dateLabel) + '</strong>';

    const printReportDate = q("#print-fixed-province-count");
    if (printReportDate) printReportDate.innerHTML = reportDateMarkup;
    const previewReportDate = q("#preview-fixed-province-count");
    if (previewReportDate) previewReportDate.innerHTML = reportDateMarkup;

    const summaryMarkup = fixedSummaryMarkup(provinces, total, online, offline);
    const cardMarkup = fixedProvinceCardsMarkup(provinces);

    const printSummary = q("#print-fixed-summary");
    if (printSummary) printSummary.innerHTML = summaryMarkup;
    const previewSummary = q("#preview-fixed-summary");
    if (previewSummary) previewSummary.innerHTML = summaryMarkup;

    const printGrid = q("#print-fixed-province-grid");
    if (printGrid) printGrid.innerHTML = cardMarkup;
    const previewGrid = q("#preview-fixed-province-grid");
    if (previewGrid) previewGrid.innerHTML = cardMarkup;
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
      fixedPanel.innerHTML = '<div class="panel-header"><div><p class="panel-kicker">FIXED STATION</p><h3>สถานีลูกข่ายชนิดประจำที่</h3></div><span class="subtle" id="fixed-province-count">10 จังหวัด</span></div><div class="fixed-province-tabs" id="fixed-province-tabs"><span class="fixed-empty">กำลังโหลดข้อมูล Fixed Station…</span></div>';
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

    q("#system-grid")?.addEventListener("click", (event) => {
      const card = event.target.closest(".system-card");
      if (card?.dataset.system !== "BSSC") return;
      window.setTimeout(() => {
        const link = q("#dialog-system-link");
        if (!link) return;
        link.href = BSSC_LINK;
        link.textContent = "เปิดระบบ BSSC →";
        link.hidden = false;
      }, 0);
    });

    q("#print-report-nav")?.addEventListener("click", () => window.setTimeout(renderPrintFixedPage, 0));
  }

  async function parseFixedFromFile(file) {
    if (!file || !window.XLSX) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const parsed = parseFixedStationSheet(workbook);
    if (!parsed.length) return;
    fixedStations = parsed;
    selectedProvinces.clear();
    renderProvincePanel();
    renderPrintFixedPage();
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
      selectedProvinces.clear();
      renderProvincePanel();
      renderEnhancedStations();
      renderPrintFixedPage();

      const count = q("#fixed-province-count");
      const provinces = [...new Set(fixedStations.map((station) => station.province).filter(Boolean))].slice(0, 10);
      if (count) count.textContent = provinces.length + " จังหวัด";
    } catch (error) {
      console.warn("Fixed Station data:", error);
      const tabs = q("#fixed-province-tabs");
      if (tabs) tabs.innerHTML = '<span class="fixed-empty">ไม่สามารถโหลดข้อมูล Fixed Station ล่าสุดได้</span>';
    }
  }

  createFixedStationUI();
  createPrintPageFour();
  createPreviewPageFour();
  renderProvincePanel();

  const importInput = q("#import-file");
  importInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) parseFixedFromFile(file).catch((error) => console.warn("Fixed Station import:", error));
  });

  window.addEventListener("beforeprint", renderPrintFixedPage);
  loadLatestWorkbook();
})();
