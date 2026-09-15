const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const systemStatusSchema = 2;
const bundledSystems = window.dashboardData.systems;
try {
  const storedData = JSON.parse(localStorage.getItem("dtrs-dashboard-data"));
  if (storedData) {
    Object.assign(window.dashboardData, storedData);
    if (storedData.systemStatusSchema !== systemStatusSchema) window.dashboardData.systems = bundledSystems;
  }
} catch { /* Keep bundled data. */ }

const systems = window.dashboardData.systems;
const stations = window.dashboardData.stations;
const periodNames = { daily: "รายวัน", weekly: "รายสัปดาห์", monthly: "รายเดือน", range: "ช่วงวันที่เลือก" };
const statusLabel = (status) => ({ online: "Online", warning: "Warning", down: "Down" }[status] || status);
const isChecked = (value) => value === true || value === 1 || /^(true|yes|y|1|checked|x|✓)$/i.test(String(value).trim());
const downColumns = [6, 9, 11, 13, 15];
const warningColumns = [2, 3, 4, 5, 7, 8, 10, 12, 14];
const alarmColumns = [...downColumns, ...warningColumns];
const stationStatusFromOverviewRow = (row) => {
  // Any explicit Down checkbox takes priority.
  if (downColumns.some((index) => isChecked(row[index]))) return "down";

  // Other equipment faults, including every "Not stable" checkbox, are Warning.
  if (warningColumns.some((index) => isChecked(row[index]))) return "warning";

  return "online";
};
const stationAlarmCountFromOverviewRow = (row) => alarmColumns.filter((index) => isChecked(row[index])).length;
const stationMetrics = () => {
  const online = stations.filter((station) => station.status === "online").length;
  const down = stations.filter((station) => station.status === "down").length;
  const warning = stations.filter((station) => station.status === "warning").length;
  const activeAlarms = stations.reduce((sum, station) => sum + Math.max(0, Number(station.alarmCount) || 0), 0);
  return { online, down, warning, pending: down + warning, activeAlarms, total: stations.length };
};
const systemLinks = {
  BSSC: {
    url: "https://forthcorporation-my.sharepoint.com/:f:/g/personal/anurak_k_forth_co_th/IgBAPpDdpFDkQJ7hxSTMhMOcASkMaitr9bRvnEdmsTon2RU?e=Lo9tma",
    label: "เปิดระบบ BSSC →"
  },
  "SD-WAN": {
    url: "https://1.1.178.146:18008/public/dist/iam/platform-web/index.html#/home",
    label: "เปิดระบบ SD-WAN →"
  },
  Microwave: {
    url: "https://1.1.178.146:31943/nmsnetworkmgrwebsite/v1/webswing/indexforwebswing.html#page=QWN0aW9uJTNEY29tLmh1YXdlaS51MjAwMC51bml0ZWRtZ3IudG9wby5hY3Rpb24uRG9XZWJUb3BvQWN0aW9u",
    label: "เปิดระบบ Microwave →"
  }
};
let currentPeriod = "daily";
let selectedDate = null;
let rangeStart = null;
let rangeEnd = null;
let calendarMonth = null;
let printImageSources = [];
try {
  const storedImages = JSON.parse(localStorage.getItem("dtrs-dashboard-print-images"));
  if (Array.isArray(storedImages)) printImageSources = storedImages;
} catch { /* Keep empty image slots. */ }
const thaiDate = (date, options) => new Intl.DateTimeFormat("th-TH-u-ca-buddhist", options).format(new Date(date));
function reportDateLabel() {
  const dates = periodData(currentPeriod).dates;
  if (currentPeriod === "range" && rangeStart && rangeEnd) return periodLabel("range", dates);
  const date = selectedDate || dates.at(-1);
  return date ? thaiDate(date, { day: "numeric", month: "short", year: "numeric" }) : "ไม่มีข้อมูลวันที่";
}
function dateFilterLabel() {
  if (rangeStart && !rangeEnd) return "เริ่ม " + thaiDate(rangeStart, { day: "numeric", month: "short" });
  if (rangeStart && rangeEnd) return periodLabel("range", periodData("range").dates);
  const dates = periodData(currentPeriod).dates;
  if (!dates.length) return "เลือกวันที่";
  return currentPeriod === "daily" ? thaiDate(dates[0], { day: "numeric", month: "long", year: "numeric" }) : periodLabel(currentPeriod, dates);
}
function renderDateContext() {
  const lastUpdated = $("#last-updated");
  if (lastUpdated) lastUpdated.textContent = "อัปเดต " + reportDateLabel();
}
function renderDataSourceName() {
  const source = $("#data-source-name");
  if (source) source.textContent = window.dashboardData.source || "รายงานประจำวันชุมสาย v2.1.xlsx";
}
function stationCheckedLabel(station) {
  return reportDateLabel();
}

function stationRowMarkup(station) {
  const checked = stationCheckedLabel(station);
  const statusBadge = '<span class="status-' + station.status + '">' + statusLabel(station.status) + '</span>';
  const stack = (items) => '<div class="station-cell-stack">' + items.map((item) => '<div>' + item + '</div>').join("") + '</div>';
  return '<tr>' +
    '<td>' + station.code + '</td>' +
    '<td>' + station.name + '</td>' +
    '<td>' + stack(["Microwave", station.device]) + '</td>' +
    '<td>' + stack([checked, checked]) + '</td>' +
    '<td>' + stack([statusBadge, statusBadge]) + '</td>' +
    '</tr>';
}

function stationTableMarkup(type) {
  const rows = stations.filter((station) => station.type === type);
  return '<div class="preview-station-table-wrap"><table class="preview-station-table">' +
    '<thead><tr><th>รหัส</th><th>ชื่อสถานี</th><th>อุปกรณ์</th><th>ตรวจล่าสุด</th><th>สถานะ</th></tr></thead>' +
    '<tbody>' + rows.map(stationRowMarkup).join("") + '</tbody></table></div>';
}
function validPrintImageSource(source) {
  return typeof source === "string" && source.startsWith("data:image/");
}
function savePrintImages() {
  try { localStorage.setItem("dtrs-dashboard-print-images", JSON.stringify(printImageSources)); } catch { /* Keep images for this session if storage is full. */ }
}
function ensurePrintImageSlots() {
  const imageGrid = $("#print-image-grid");
  if (!imageGrid || imageGrid.children.length === 4) return;
  const labels = ["BSSC", "SD-WAN", "Microwave", "Dispatcher"];
  imageGrid.innerHTML = labels.map((label, index) => {
    const hasImage = validPrintImageSource(printImageSources[index]);
    return '<button class="print-image-block" type="button" data-slot="' + index + '" title="คลิกเพื่อเลือกรูปภาพ ' + label + '"><span id="print-image-placeholder-' + index + '"' + (hasImage ? ' hidden' : '') + '>รูปภาพ ' + label + ' (คลิกเพื่อเลือกรูป)</span><img id="print-report-image-' + index + '" alt="รูปภาพประกอบระบบ ' + label + '"' + (hasImage ? '' : ' hidden') + ' /></button>';
  }).join("");
  labels.forEach((label, index) => {
    if (validPrintImageSource(printImageSources[index])) $("#print-report-image-" + index).src = printImageSources[index];
  });
  imageGrid.querySelectorAll(".print-image-block").forEach((block) => {
    block.addEventListener("click", () => {
      currentSlotForUpload = parseInt(block.dataset.slot, 10);
      $("#print-image-file")?.click();
    });
  });
}

let currentSlotForUpload = null;
let currentActiveLightboxSlot = null;

function renderPreviewImageGrid() {
  const previewGrid = $("#preview-image-grid");
  if (!previewGrid) return;
  ensurePrintImageSlots();
  const labels = ["BSSC", "SD-WAN", "Microwave", "Dispatcher"];
  
  previewGrid.innerHTML = labels.map((label, index) => {
    const imgEl = $("#print-report-image-" + index);
    const hasImage = Boolean(imgEl && imgEl.src && !imgEl.hidden);
    
    return '<div class="preview-image-card" data-slot="' + index + '">' +
      '<button class="preview-card-img-wrap" type="button" data-action="' + (hasImage ? 'view' : 'upload') + '" data-slot="' + index + '">' +
        (hasImage ?
          '<img alt="รูปภาพประกอบระบบ ' + label + '" />' +
          '<div class="preview-card-overlay">' +
            '<span class="preview-card-zoom-badge">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">' +
                '<circle cx="11" cy="11" r="8"></circle>' +
                '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
                '<line x1="11" y1="8" x2="11" y2="14"></line>' +
                '<line x1="8" y1="11" x2="14" y2="11"></line>' +
              '</svg> คลิกเพื่อขยาย</span>' +
          '</div>' :
          '<div class="preview-card-placeholder">' +
            '<svg viewBox="0 0 24 24">' +
              '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2"></rect>' +
              '<circle cx="8.5" cy="8.5" r="1.5"></circle>' +
              '<polyline points="21 15 16 10 5 21"></polyline>' +
            '</svg>' +
            '<span>แนบรูปภาพ ' + label + '</span>' +
          '</div>'
        ) +
      '</button>' +
      '<div class="preview-card-footer">' +
        '<span class="preview-card-title">รูปภาพ ' + label + '</span>' +
        '<span class="preview-card-status ' + (hasImage ? 'has-image' : 'no-image') + '">' +
          (hasImage ? 'แนบรูปแล้ว' : 'ยังไม่ได้แนบ') +
        '</span>' +
      '</div>' +
    '</div>';
  }).join("");
  labels.forEach((label, index) => {
    const imgEl = $("#print-report-image-" + index);
    const previewImg = previewGrid.querySelector('[data-slot="' + index + '"] img');
    if (imgEl && previewImg) previewImg.src = imgEl.src;
  });

  previewGrid.querySelectorAll(".preview-card-img-wrap").forEach((wrap) => {
    wrap.addEventListener("click", () => {
      const slot = parseInt(wrap.dataset.slot, 10);
      const action = wrap.dataset.action;
      if (action === "view") {
        openLightbox(slot);
      } else {
        currentSlotForUpload = slot;
        $("#print-image-file")?.click();
      }
    });
  });
}

function openLightbox(slotIndex) {
  const labels = ["BSSC", "SD-WAN", "Microwave", "Dispatcher"];
  const imgEl = $("#print-report-image-" + slotIndex);
  const dialog = $("#lightbox-dialog");
  const lightboxImg = $("#lightbox-img");
  const lightboxTitle = $("#lightbox-title");
  
  if (!imgEl || !imgEl.src || !dialog || !lightboxImg || !lightboxTitle) return;
  
  currentActiveLightboxSlot = slotIndex;
  lightboxTitle.textContent = "รูปภาพประกอบระบบ " + labels[slotIndex];
  lightboxImg.src = imgEl.src;
  dialog.showModal();
}

function openPrintPreviewModal() {
  ensurePrintImageSlots();
  renderPrintPages();
  renderPreviewImageGrid();
  $("#print-preview-modal")?.showModal();
}

function renderPrintPreviewPageOne() {
  const content = $("#preview-page1-content");
  const gatewayContent = $("#preview-gateway-content");
  if (content) {
    content.innerHTML =
      '<div class="preview-system-grid">' +
      systems.map((system) => '<div><strong>' + system.name + '</strong><span class="status-' + system.status + '">' + statusLabel(system.status) + '</span></div>').join("") +
      '</div>' +
      '<div class="preview-station-section"><p class="panel-kicker">STATION MONITORING</p><h3>Base Station</h3>' +
      stationTableMarkup("base") + '</div>';
  }
  if (gatewayContent) {
    gatewayContent.innerHTML =
      '<div class="preview-station-section"><p class="panel-kicker">STATION MONITORING</p><h3>Analog Gateway</h3>' +
      stationTableMarkup("gateway") + '</div>';
  }
}

function closePrintPreviewModal() {
  $("#print-preview-modal")?.close();
}

function closeLightbox() {
  $("#lightbox-dialog")?.close();
  currentActiveLightboxSlot = null;
}

function renderPrintPages() {
  const baseRows = stations.filter((station) => station.type === "base");
  const gatewayRows = stations.filter((station) => station.type === "gateway");
  const baseBody = $("#print-base-rows");
  const gatewayBody = $("#print-gateway-rows");
  if (baseBody) baseBody.innerHTML = baseRows.map(stationRowMarkup).join("");
  if (gatewayBody) gatewayBody.innerHTML = gatewayRows.map(stationRowMarkup).join("");
  if ($("#print-base-count")) $("#print-base-count").textContent = baseRows.length + " สถานี";
  if ($("#print-gateway-count")) $("#print-gateway-count").textContent = gatewayRows.length + " สถานี";
  if ($("#print-period-label")) $("#print-period-label").textContent = reportDateLabel();
  ensurePrintImageSlots();
  renderPrintPreviewPageOne();
  renderPreviewImageGrid();
}

function periodData(period, system = "all") {
  const allRows = (window.dashboardData.events?.rows || []).filter((row) => system === "all" || row.system === system);
  const allDates = [...new Set(allRows.map((row) => row.date))].sort();
  const latest = selectedDate && allDates.includes(selectedDate) ? selectedDate : allDates.at(-1);
  const dates = period === "range" && rangeStart && rangeEnd ? allDates.filter((date) => date >= rangeStart && date <= rangeEnd) : period === "daily" ? [latest] : period === "weekly" ? allDates.filter((date) => date <= latest).slice(-7) : allDates.filter((date) => date.slice(0, 7) === latest?.slice(0, 7));
  return { dates, rows: allRows.filter((row) => dates.includes(row.date)) };
}

function periodLabel(period, dates) {
  if (!dates.length) return window.dashboardData.summary?.reportDate || "ไม่มีข้อมูลวันที่";
  if (period === "daily") return thaiDate(dates[0], { day: "numeric", month: "long", year: "numeric" });
  if (period === "weekly") return thaiDate(dates[0], { day: "numeric", month: "short" }) + " - " + thaiDate(dates.at(-1), { day: "numeric", month: "short", year: "numeric" });
  if (period === "range") return thaiDate(dates[0], { day: "numeric", month: "short" }) + " - " + thaiDate(dates.at(-1), { day: "numeric", month: "short", year: "numeric" });
  return thaiDate(dates.at(-1), { month: "long", year: "numeric" });
}

function renderSystems() {
  const filter = $("#system-filter")?.value || "all";
  const visible = filter === "all" ? systems : systems.filter((system) => system.id === filter);
  $("#system-grid").innerHTML = visible.map((system) => '<button class="system-card" type="button" data-system="' + system.id + '"><h4>' + system.name + '</h4><p>' + system.scope + '</p><span class="status-' + system.status + '">' + (system.status === "online" ? "ปกติ" : "ขัดข้อง") + '</span></button>').join("");
  if ($("#system-count")) $("#system-count").textContent = "";
  $$("#system-grid .system-card").forEach((card) => card.addEventListener("click", () => openSystem(card.dataset.system)));
}

function renderStations() {
  const type = $(".station-type.active")?.dataset.type || "base";
  const search = ($("#station-search")?.value || "").trim().toLowerCase();
  const status = $("#station-status")?.value || "all";
  const rows = stations.filter((station) => station.type === type && (status === "all" || station.status === status) && (station.code + " " + station.name).toLowerCase().includes(search));
  $("#station-rows").innerHTML = rows.length ? rows.map(stationRowMarkup).join("") : '<tr><td colspan="5">ไม่พบสถานีตามเงื่อนไข</td></tr>';
  $("#station-result-count").textContent = rows.length + " สถานี";

  const metrics = stationMetrics();
  const downCount = metrics.down;
  const warningCount = metrics.warning;
  if ($("#overall-title") && $("#overall-detail")) {
    if (downCount > 0) {
      $("#overall-title").textContent = "พบสถานีหรืออุปกรณ์ขัดข้อง";
      $("#overall-detail").textContent = "Down " + downCount + " จุด" + (warningCount ? " · Warning " + warningCount + " จุด" : "") + " จากทั้งหมด " + stations.length + " จุด";
    } else if (warningCount > 0) {
      $("#overall-title").textContent = "สถานีออนไลน์ แต่มีรายการที่ควรตรวจสอบ";
      $("#overall-detail").textContent = "Online · Warning " + warningCount + " จุด จากทั้งหมด " + stations.length + " จุด";
    } else {
      $("#overall-title").textContent = "ไม่มีรายการที่ต้องดำเนินการ";
      $("#overall-detail").textContent = "ตรวจสอบสถานีและอุปกรณ์ครบ " + stations.length + " จุด ไม่พบเหตุขัดข้อง";
    }
  }
}

const parseDateValue = (value) => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); };
const dateValue = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");

function renderDateOptions() {
  const dateFilter = $("#date-filter");
  if (!dateFilter) return;
  const dates = [...new Set((window.dashboardData.events?.rows || []).map((row) => row.date))].sort();
  selectedDate = dates.includes(selectedDate) ? selectedDate : dates.at(-1);
  calendarMonth = selectedDate ? parseDateValue(selectedDate) : new Date();
  dateFilter.textContent = dateFilterLabel();
  renderDateContext();
  renderCalendar();
  renderStations();
  renderDataSourceRange();
  renderPrintPages();
}

function renderCalendar() {
  const monthLabel = $("#calendar-month-label");
  const calendarGrid = $("#calendar-grid");
  if (!monthLabel || !calendarGrid || !calendarMonth) return;
  monthLabel.textContent = thaiDate(calendarMonth, { month: "long", year: "numeric" });
  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  const availableDates = new Set((window.dashboardData.events?.rows || []).map((row) => row.date));
  const selectedDates = new Set(rangeStart && rangeEnd ? periodData("range").dates : rangeStart ? [rangeStart] : periodData(currentPeriod).dates);
  calendarGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = dateValue(date);
    const outside = date.getMonth() !== calendarMonth.getMonth();
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const classes = ["calendar-day", outside ? "outside-month" : "", weekend ? "weekend" : "", selectedDates.has(value) ? "selected" : ""].filter(Boolean).join(" ");
    return '<button class="' + classes + '" type="button" data-date="' + value + '"' + (availableDates.has(value) ? "" : " disabled") + ' aria-label="' + thaiDate(date, { dateStyle: "full" }) + '">' + date.getDate() + "</button>";
  }).join("");
}

function selectCalendarDate(value) {
  if (!rangeStart || rangeEnd) {
    rangeStart = value;
    rangeEnd = null;
    selectedDate = value;
    renderDateOptions();
    return;
  }
  rangeEnd = value;
  if (rangeEnd < rangeStart) [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
  selectedDate = rangeEnd;
  $$(".period-tab").forEach((tab) => { tab.classList.remove("active"); tab.setAttribute("aria-selected", "false"); });
  renderDateOptions();
  renderReport("range");
  $("#calendar-dialog")?.close();
}

function positionCalendar() {
  const dialog = $("#calendar-dialog");
  const anchor = $("#date-picker-button") || $("#date-filter");
  if (!dialog || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const width = dialog.offsetWidth;
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
  const below = rect.bottom + 8;
  const top = below + dialog.offsetHeight <= window.innerHeight - 12 ? below : Math.max(12, rect.top - dialog.offsetHeight - 8);
  dialog.style.left = left + "px";
  dialog.style.top = top + "px";
}

function openCalendar() {
  const dialog = $("#calendar-dialog");
  if (!dialog) return;
  renderCalendar();
  if (!dialog.open) dialog.show();
  positionCalendar();
  $("#date-filter")?.setAttribute("aria-expanded", "true");
}

function renderDataSourceRange() {
  const range = $("#data-source-range");
  if (!range) return;
  const dates = periodData(currentPeriod).dates;
  if (!dates.length) { range.textContent = "ไม่พบข้อมูล Event Log"; return; }
  const start = thaiDate(dates[0], { day: "numeric", month: "short", year: "numeric" });
  const end = thaiDate(dates.at(-1), { day: "numeric", month: "short", year: "numeric" });
  range.textContent = "ข้อมูล Event Log: " + (start === end ? start : start + " – " + end);
}

function renderReport(period) {
  currentPeriod = period;
  const data = periodData(period);
  const pLabel = periodLabel(period, data.dates);
  const reportPeriodName = periodNames[period];
  renderDateContext();
  if ($("#date-filter")) $("#date-filter").textContent = dateFilterLabel();
  renderCalendar();
  const printLabel = $("#print-period-label");
  if (printLabel) printLabel.textContent = "ช่วงรายงาน" + reportPeriodName + " (" + pLabel + ")";
  renderDataSourceRange();
  renderPrintPages();
  $("#summary-title").textContent = "สรุปรายงานประจำ" + reportPeriodName;
  $("#trend-title").textContent = "แนวโน้มความพร้อมใช้งาน " + (period === "daily" ? "รายวัน" : period === "weekly" ? "7 วันล่าสุด" : period === "range" ? "ช่วงวันที่เลือก" : "เดือนล่าสุด");
  $("#content-title").textContent = "หัวข้อรายงาน" + reportPeriodName;
  const summary = window.dashboardData?.summary || { averageAvailability: 100, totalDowntime: 0 };
  const reportRows = data.rows;
  const availability = reportRows.length ? reportRows.reduce((sum, row) => sum + row.availability, 0) / reportRows.length : summary.averageAvailability;
  const downtime = reportRows.length ? (period === "daily" ? Math.max(...reportRows.map((row) => row.downtime)) : reportRows.reduce((sum, row) => sum + row.downtime, 0)) : summary.totalDowntime;
  $("#availability-kpi").innerHTML = availability.toFixed(2) + "<small>%</small>";
  const metrics = stationMetrics();
  const onlineStations = metrics.online;
  const totalStations = metrics.total;
  if ($("#online-kpi")) {
    $("#online-kpi").textContent = onlineStations;
    const totalLabel = $("#online-kpi").nextElementSibling;
    if (totalLabel) totalLabel.textContent = "/ " + totalStations + " จุด";
  }
  $("#pending-kpi").textContent = metrics.pending;
  $("#pending-kpi-note").textContent = metrics.pending ? "Down + Warning ที่ต้องติดตาม" : "ไม่มีประเด็นคงค้าง";
  $("#active-alarm-kpi").textContent = metrics.activeAlarms;
  $("#active-alarm-note").textContent = metrics.activeAlarms ? "นับจากช่อง Alarm ที่ถูก Check" : "ไม่พบ Alarm ที่กำลังทำงาน";
  $("#summary-list").innerHTML = [["Availability", availability.toFixed(2) + "%"], ["ออนไลน์", onlineStations + " / " + totalStations + " จุด"], ["Downtime", downtime + " นาที"], ["Alarm", metrics.activeAlarms + " รายการ"]].map((item) => "<div><dt>" + item[0] + "</dt><dd>" + item[1] + "</dd></div>").join("");
  $("#chart-legend").textContent = "Availability · SLA 95%";
  $("#report-checklist").innerHTML = ["ตรวจสอบสถานะระบบหลัก", "ตรวจสอบสถานีและอุปกรณ์", "สรุปความพร้อมใช้งานของระบบ และ ข้อบกพร่องรอการแก้ไข", "ยืนยันสถานะแจ้งผู้ใช้งาน"].map((item) => "<li>" + item + "</li>").join("");
  drawChart();
  renderPrintPreviewPageOne();
}

function drawChart(forcedRatio) {
  const canvas = $("#availability-chart");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const width = canvas.clientWidth || 600, height = 230, ratio = forcedRatio || window.devicePixelRatio || 1;
  canvas.width = width * ratio; canvas.height = height * ratio; context.scale(ratio, ratio);
  const selected = $("#system-filter")?.value || "all";
  const grouped = periodData(currentPeriod, selected).rows.reduce((result, row) => {
    (result[row.date] ||= []).push(Number(row.availability)); return result;
  }, {});
  const values = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).slice(-31).map(([, items]) => items.reduce((sum, value) => sum + value, 0) / items.length);
  const points = values.length ? values : [Number(window.dashboardData.summary?.averageAvailability || 100)];
  const linePoints = points.length === 1 ? [points[0], points[0]] : points;
  const left = 38, right = 10, top = 16, bottom = 28, plotWidth = width - left - right, plotHeight = height - top - bottom;
  const y = (value) => top + (100 - value) / 5 * plotHeight;
  context.clearRect(0, 0, width, height); context.font = "11px Sarabun, sans-serif"; context.fillStyle = "#6c8193"; context.strokeStyle = "#dde5eb"; context.lineWidth = 1;
  [100, 97.5, 95].forEach((value) => { const lineY = y(value); context.beginPath(); context.moveTo(left, lineY); context.lineTo(width - right, lineY); context.stroke(); context.fillText(value + "%", 2, lineY + 4); });
  context.setLineDash([5, 4]); context.strokeStyle = "#a86d12"; context.beginPath(); context.moveTo(left, y(95)); context.lineTo(width - right, y(95)); context.stroke(); context.setLineDash([]); context.fillStyle = "#a86d12"; context.fillText("SLA", width - right - 22, y(95) - 5);
  context.strokeStyle = "#177b7b"; context.lineWidth = 2; context.beginPath();
  linePoints.forEach((value, index) => { const x = left + index * plotWidth / (linePoints.length - 1); index ? context.lineTo(x, y(value)) : context.moveTo(x, y(value)); });
  context.stroke();
  const dates = Object.keys(grouped).sort();
  const labels = [dates[0], dates[Math.floor(dates.length / 2)], dates.at(-1)].filter(Boolean).map((date) => thaiDate(date, { day: "numeric", month: "short" }));
  $(".chart-axis").innerHTML = labels.map((label) => "<span>" + label + "</span>").join("");
}

function openSystem(id) {
  const system = systems.find((item) => item.id === id);
  if (!system || !$("#system-dialog")) return;
  const events = (window.dashboardData.events?.rows || []).filter((row) => row.system === id);
  const availability = events.length ? (events.reduce((sum, row) => sum + row.availability, 0) / events.length).toFixed(2) + "%" : "—";
  const downtime = events.length ? events.reduce((sum, row) => sum + row.downtime, 0) + " นาที" : "—";
  const status = system.status === "online" ? "ปกติ" : "ขัดข้อง";
  $("#dialog-title").textContent = system.name; $("#dialog-scope").textContent = system.scope;
  $("#dialog-availability").textContent = availability; $("#dialog-downtime").textContent = downtime;
  const statusElement = $("#system-dialog .dialog-metrics div:first-child strong");
  statusElement.textContent = status; statusElement.className = "status-" + system.status;
  $("#system-dialog .dialog-message p").textContent = events.length ? "ข้อมูลจาก Event Log ของ " + system.name : "ยังไม่มี Event Log สำหรับระบบนี้";
  const dialogLink = $("#dialog-system-link");
  const linkConfig = systemLinks[id];
  if (dialogLink && linkConfig) {
    dialogLink.href = linkConfig.url;
    dialogLink.textContent = linkConfig.label;
    dialogLink.hidden = false;
  } else if (dialogLink) {
    dialogLink.hidden = true;
    dialogLink.removeAttribute("href");
  }
  $("#system-dialog").showModal();
}
function showToast() {
  const toast = $("#toast"); toast.classList.add("show"); window.setTimeout(() => toast.classList.remove("show"), 2200);
}

async function importWorkbook(file) {
  if (!window.XLSX) throw new Error("ตัวอ่านไฟล์ยังโหลดไม่เสร็จ");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const overview = XLSX.utils.sheet_to_json(workbook.Sheets.Overview, { header: 1, defval: "" });
  const eventRows = XLSX.utils.sheet_to_json(workbook.Sheets["Event Log"], { defval: "" });
  systems.forEach((system) => {
    const row = overview.find((cells) => String(cells[20]).trim() === system.id);
    const status = String(row?.[22] || "");
    if (/ปกติ|normal|online|operational|healthy|\bok\b/i.test(status)) system.status = "online";
    if (/ขัดข้อง|down|offline|failed|critical/i.test(status)) system.status = "down";
  });
  const gatewayIndex = { value: 0 };
  const importedStations = overview.slice(3).filter((row) => /^(BS-\d+|AGW)$/i.test(String(row[0]))).map((row) => {
    const code = String(row[0]);
    const gateway = /^AGW$/i.test(code);
    const displayCode = gateway ? "AGW-" + String(++gatewayIndex.value).padStart(2, "0") : code;
    return {
      type: gateway ? "gateway" : "base",
      code: displayCode, name: String(row[1]),
      device: gateway ? "Analog Gateway" : "Base Station",
      checked: "ล่าสุด", status: stationStatusFromOverviewRow(row), alarmCount: stationAlarmCountFromOverviewRow(row)
    };
  });
  if (!importedStations.length || !eventRows.length) throw new Error("ไม่พบข้อมูลสถานีหรือ Event Log ที่รองรับ");
  stations.splice(0, stations.length, ...importedStations);
  const availability = eventRows.map((row) => Number(row["Online (100%)"])).filter(Number.isFinite);
  const downtime = eventRows.reduce((sum, row) => sum + (Number(row["Down time(min)"]) || 0), 0);
  window.dashboardData.events.rows = eventRows.map((row) => ({ system: row.System, date: new Date(row.Date).toISOString().slice(0, 10), availability: Number(row["Online (100%)"]), downtime: Number(row["Down time(min)"]) || 0 }));
  window.dashboardData.summary = { reportDate: "ข้อมูลล่าสุดจากไฟล์", averageAvailability: availability.reduce((a, b) => a + b, 0) / availability.length, totalDowntime: downtime };
  window.dashboardData.source = file.name;
  window.dashboardData.systemStatusSchema = systemStatusSchema;
  localStorage.setItem("dtrs-dashboard-data", JSON.stringify(window.dashboardData));
  rangeStart = null; rangeEnd = null;
  renderSystems(); renderStations(); renderDateOptions(); renderDataSourceName(); renderDataSourceRange(); renderReport("daily"); showToast();
}

$("#system-filter")?.addEventListener("change", () => { renderSystems(); drawChart(); renderPrintPreviewPageOne(); });
$("#date-filter")?.addEventListener("click", openCalendar);
$("#date-picker-button")?.addEventListener("click", openCalendar);
$("#calendar-prev")?.addEventListener("click", () => { calendarMonth.setMonth(calendarMonth.getMonth() - 1); renderCalendar(); });
$("#calendar-next")?.addEventListener("click", () => { calendarMonth.setMonth(calendarMonth.getMonth() + 1); renderCalendar(); });
$("#calendar-grid")?.addEventListener("click", (event) => {
  const day = event.target.closest("[data-date]");
  if (!day || day.disabled) return;
  selectCalendarDate(day.dataset.date);
});
$("#calendar-dialog")?.addEventListener("close", () => $("#date-filter")?.setAttribute("aria-expanded", "false"));
document.addEventListener("pointerdown", (event) => {
  const dialog = $("#calendar-dialog");
  if (dialog?.open && !dialog.contains(event.target) && !event.target.closest("#date-filter, #date-picker-button")) dialog.close();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") $("#calendar-dialog")?.close(); });
$("#station-search")?.addEventListener("input", renderStations);
$("#station-status")?.addEventListener("change", renderStations);
$$(".station-type").forEach((button) => button.addEventListener("click", () => { $$(".station-type").forEach((item) => item.classList.remove("active")); button.classList.add("active"); renderStations(); }));
$$(".period-tab").forEach((button) => button.addEventListener("click", () => { rangeStart = null; rangeEnd = null; $$(".period-tab").forEach((item) => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); }); button.classList.add("active"); button.setAttribute("aria-selected", "true"); renderReport(button.dataset.period); }));
$$("[data-scroll]").forEach((button) => button.addEventListener("click", () => $("#" + button.dataset.scroll)?.scrollIntoView({ behavior: "smooth" })));
$("#refresh-button")?.addEventListener("click", showToast);
$("#print-report-nav")?.addEventListener("click", () => openPrintPreviewModal());
$("#preview-modal-close")?.addEventListener("click", closePrintPreviewModal);
$("#print-preview-modal")?.addEventListener("click", (event) => { if (event.target === event.currentTarget) closePrintPreviewModal(); });
$("#preview-print-btn")?.addEventListener("click", () => { closePrintPreviewModal(); window.setTimeout(() => window.print(), 150); });
$("#preview-attach-btn")?.addEventListener("click", () => { currentSlotForUpload = null; $("#print-image-file")?.click(); });
$("#print-image-file")?.addEventListener("change", (event) => {
  const files = [...(event.target.files || [])];
  if (!files.length) return;
  ensurePrintImageSlots();

  if (currentSlotForUpload !== null) {
      const slot = currentSlotForUpload;
      const file = files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        printImageSources[slot] = String(reader.result);
        savePrintImages();
        const image = $("#print-report-image-" + slot);
        const placeholder = $("#print-image-placeholder-" + slot);
        if (image) { image.src = String(reader.result); image.hidden = false; }
        if (placeholder) placeholder.hidden = true;
        renderPreviewImageGrid();
        if ($("#lightbox-dialog")?.open && currentActiveLightboxSlot === slot) {
          $("#lightbox-img").src = String(reader.result);
        }
      currentSlotForUpload = null;
    });
    reader.readAsDataURL(file);
  } else {
    files.slice(0, 4).forEach((file, index) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        printImageSources[index] = String(reader.result);
        savePrintImages();
        const image = $("#print-report-image-" + index);
        const placeholder = $("#print-image-placeholder-" + index);
        if (image) { image.src = String(reader.result); image.hidden = false; }
        if (placeholder) placeholder.hidden = true;
        renderPreviewImageGrid();
      });
      reader.readAsDataURL(file);
    });
  }
  event.target.value = "";
});
$("#import-button")?.addEventListener("click", () => $("#import-file")?.click());
$("#import-file")?.addEventListener("change", async (event) => {
  const button = $("#import-button");
  const file = event.target.files?.[0];
  if (!file) return;
  button.disabled = true;
  try { await importWorkbook(file); } catch (error) { window.alert(error.message || "นำเข้าไฟล์ไม่สำเร็จ"); } finally { button.disabled = false; event.target.value = ""; }
});
$("#dialog-close")?.addEventListener("click", () => $("#system-dialog")?.close());
$("#system-dialog")?.addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
$("#lightbox-close")?.addEventListener("click", closeLightbox);
$("#lightbox-dialog")?.addEventListener("click", (event) => { if (event.target === event.currentTarget) closeLightbox(); });
$("#lightbox-replace-btn")?.addEventListener("click", () => {
  if (currentActiveLightboxSlot !== null) {
    currentSlotForUpload = currentActiveLightboxSlot;
    $("#print-image-file")?.click();
  }
});
$("#lightbox-remove-btn")?.addEventListener("click", () => {
  if (currentActiveLightboxSlot !== null) {
    const image = $("#print-report-image-" + currentActiveLightboxSlot);
    const placeholder = $("#print-image-placeholder-" + currentActiveLightboxSlot);
    printImageSources[currentActiveLightboxSlot] = null;
    savePrintImages();
    if (image) { image.removeAttribute("src"); image.hidden = true; }
    if (placeholder) placeholder.hidden = false;
    renderPreviewImageGrid();
    closeLightbox();
  }
});
window.addEventListener("beforeprint", () => {
  renderPrintPages();
  drawChart(Math.max(3, window.devicePixelRatio || 1));
});
window.addEventListener("afterprint", () => drawChart());
window.addEventListener("resize", () => { drawChart(); if ($("#calendar-dialog")?.open) positionCalendar(); });
window.addEventListener("scroll", () => { if ($("#calendar-dialog")?.open) positionCalendar(); }, true);
renderSystems(); renderStations(); renderDateOptions(); renderDataSourceName(); renderDataSourceRange(); renderPrintPages(); renderPreviewImageGrid(); renderReport("daily");
const _ver = window.dashboardData?.version; if (_ver && $("#app-version")) $("#app-version").textContent = "v" + _ver;
