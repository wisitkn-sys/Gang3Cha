// Extracted from: รายงานประจำวันชุมสาย v2.2.xlsx
// Sheets: รายงานสรุป, Overview, Event Log
window.dashboardData = {
  version: "1.4.1",
  systemStatusSchema: 2,
  source: "รายงานประจำวันชุมสาย v2.2.xlsx",
  systems: [
    { id: "BSSC", name: "BSSC", scope: "ระบบศูนย์ควบคุมสถานีแม่ข่าย", status: "online" },
    { id: "SD-WAN", name: "SD-WAN", scope: "ระบบบริหารจัดการ iMaster NCE Campus", status: "online" },
    { id: "Microwave", name: "Microwave", scope: "ระบบบริหารจัดการอุปกรณ์ทวนสัญญาณ iMaster NCE-T", status: "online" },
    { id: "Dispatcher", name: "Dispatcher", scope: "ชุดสั่งการ", status: "online" }
  ],
  stations: [
    ["BS-261", "BS หนองนกแก้ว"], ["BS-262", "BS ศรีสุขสำราญ"], ["BS-263", "BS คลองป่าหมู"],
    ["BS-264", "BS วัดบางอุดม"], ["BS-265", "BS วังงิ้ว"], ["BS-266", "BS บ้านปางใหม่พัฒนา"],
    ["BS-267", "BS ช่อง"], ["BS-268", "BS คลองพลู"]
  ].map(([code, name]) => ({ type: "base", code, name, device: "Base Station", checked: "08:30", status: "online" })).concat(
    ["ห้วยกระเจา", "คลองลาน", "เขาสวนกวาง", "เขาคิชฌกูฎ", "ย่านตาขาว", "วังน้ำเขียว", "หัวไทร", "ดงเจริญ"].map((name, index) => ({
      type: "gateway", code: "AGW-" + String(index + 1).padStart(2, "0"), name,
      device: "Analog Gateway", checked: "08:30", status: "online"
    }))
  ),
  summary: { reportDate: "5 กันยายน 2569", averageAvailability: 99.832549, totalDowntime: 299, online100Days: 18, stationsToFollow: 0 },
  events: {
    period: "2026-08-01/2026-08-31",
    systems: ["BSSC", "SD-WAN", "Microwave", "Dispatcher"],
    fields: ["system", "date", "availability", "downtime"],
    rows: [
      {
        "system": "BSSC",
        "date": "2026-08-01",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "BSSC",
        "date": "2026-08-02",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "BSSC",
        "date": "2026-08-03",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "BSSC",
        "date": "2026-08-04",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "BSSC",
        "date": "2026-08-05",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "BSSC",
        "date": "2026-08-06",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "BSSC",
        "date": "2026-08-07",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "BSSC",
        "date": "2026-08-08",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "BSSC",
        "date": "2026-08-09",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "BSSC",
        "date": "2026-08-10",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "BSSC",
        "date": "2026-08-11",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "BSSC",
        "date": "2026-08-12",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "BSSC",
        "date": "2026-08-13",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "BSSC",
        "date": "2026-08-14",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "BSSC",
        "date": "2026-08-15",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "BSSC",
        "date": "2026-08-16",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "BSSC",
        "date": "2026-08-17",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "BSSC",
        "date": "2026-08-18",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "BSSC",
        "date": "2026-08-19",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "BSSC",
        "date": "2026-08-20",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "BSSC",
        "date": "2026-08-21",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "BSSC",
        "date": "2026-08-22",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "BSSC",
        "date": "2026-08-23",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "BSSC",
        "date": "2026-08-24",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "BSSC",
        "date": "2026-08-25",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "BSSC",
        "date": "2026-08-26",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "BSSC",
        "date": "2026-08-27",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "BSSC",
        "date": "2026-08-28",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "BSSC",
        "date": "2026-08-29",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "BSSC",
        "date": "2026-08-30",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "BSSC",
        "date": "2026-08-31",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-01",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-02",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-03",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-04",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-05",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-06",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-07",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-08",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-09",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-10",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-11",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-12",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-13",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-14",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-15",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-16",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-17",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-18",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-19",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-20",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-21",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-22",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-23",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-24",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-25",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-26",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-27",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-28",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-29",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-30",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "SD-WAN",
        "date": "2026-08-31",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Microwave",
        "date": "2026-08-01",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "Microwave",
        "date": "2026-08-02",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "Microwave",
        "date": "2026-08-03",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "Microwave",
        "date": "2026-08-04",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Microwave",
        "date": "2026-08-05",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Microwave",
        "date": "2026-08-06",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Microwave",
        "date": "2026-08-07",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "Microwave",
        "date": "2026-08-08",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Microwave",
        "date": "2026-08-09",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Microwave",
        "date": "2026-08-10",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Microwave",
        "date": "2026-08-11",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Microwave",
        "date": "2026-08-12",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Microwave",
        "date": "2026-08-13",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "Microwave",
        "date": "2026-08-14",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Microwave",
        "date": "2026-08-15",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Microwave",
        "date": "2026-08-16",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "Microwave",
        "date": "2026-08-17",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Microwave",
        "date": "2026-08-18",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Microwave",
        "date": "2026-08-19",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Microwave",
        "date": "2026-08-20",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Microwave",
        "date": "2026-08-21",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "Microwave",
        "date": "2026-08-22",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "Microwave",
        "date": "2026-08-23",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Microwave",
        "date": "2026-08-24",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Microwave",
        "date": "2026-08-25",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "Microwave",
        "date": "2026-08-26",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "Microwave",
        "date": "2026-08-27",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Microwave",
        "date": "2026-08-28",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "Microwave",
        "date": "2026-08-29",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "Microwave",
        "date": "2026-08-30",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Microwave",
        "date": "2026-08-31",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-01",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-02",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-03",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-04",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-05",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-06",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-07",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-08",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-09",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-10",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-11",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-12",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-13",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-14",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-15",
        "availability": 99.861111,
        "downtime": 2
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-16",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-17",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-18",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-19",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-20",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-21",
        "availability": 99.930556,
        "downtime": 1
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-22",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-23",
        "availability": 99.652778,
        "downtime": 5
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-24",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-25",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-26",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-27",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-28",
        "availability": 100,
        "downtime": 0
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-29",
        "availability": 99.722222,
        "downtime": 4
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-30",
        "availability": 99.791667,
        "downtime": 3
      },
      {
        "system": "Dispatcher",
        "date": "2026-08-31",
        "availability": 99.930556,
        "downtime": 1
      }
    ],
    note: "Extracted from Event Log in รายงานประจำวันชุมสาย v2.2.xlsx"
  }
};
