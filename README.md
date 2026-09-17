# DTRS Operations Dashboard (NjRepo)

ระบบแดชบอร์ดศูนย์ควบคุมและติดตามสถานะโครงข่ายวิทยุสื่อสารระบบดิจิทัล (Digital Trunked Radio System - DTRS) สำหรับโครงการ USO ออกแบบเพื่อรองรับการตรวจเช็กและสรุปรายงานสถานะการปฏิบัติงานประจำวัน รายสัปดาห์ และรายเดือน

---

## 📌 ภาพรวมโครงการ (Overview)

เว็บแดชบอร์ดแบบ Standalone สำหรับฝ่ายปฏิบัติการ (Operations Center) แสดงผลข้อมูลสถานะการทำงาน ความพร้อมใช้งาน (Availability) และระยะเวลาขัดข้อง (Downtime) เทียบกับเกณฑ์มาตรฐาน SLA รวมถึงระบบตรวจเช็กสถานีฐานและอุปกรณ์ชุมสาย

### ฟีเจอร์หลัก (Key Features)

- **ระบบติดตามภาพรวม (System Overview & KPIs)**:
  - ตัวชี้วัดสำคัญ: Availability เฉลี่ย (%), Downtime รวม/สูงสุด (นาที), สถานะการออนไลน์ของสถานี
  - กราฟเส้นแนวโน้มความพร้อมใช้งาน (Availability Trend) พร้อมเส้นกำกับ SLA 95% (วาดด้วย HTML5 Canvas)
  - โมดอลแสดงรายละเอียดและ Event Log รายระบบเมื่อคลิกการ์ดระบบ
- **ระบบสถานีและอุปกรณ์ (Stations & Gateways)**:
  - แยกแท็บประเภทสถานี: สถานีฐาน (Base Stations: BS-261 ถึง BS-268) และชุดเชื่อมต่อ (Analog Gateways: AGW-01 ถึง AGW-08)
  - ระบบค้นหาชื่อหรือหมายเลขสถานีแบบเรียลไทม์ พร้อมตัวกรองตามสถานะ (Online / Warning / Down)
- **การเลือกช่วงเวลารายงาน (Reporting Periods)**:
  - สลับดูข้อมูลได้ 3 รูปแบบ: **รายวัน (Daily)**, **รายสัปดาห์ (Weekly)** และ **รายเดือน (Monthly)**
- **การนำเข้าข้อมูล (Data Import & Storage)**:
  - นำเข้าไฟล์สรุปรายงานประจำวันชุมสายจาก Excel (`.xlsx`, `.xls`) ผ่านเบราว์เซอร์โดยตรง (ใช้ SheetJS)
  - บันทึกสถานะและข้อมูลลงใน `localStorage` อัตโนมัติ ทำให้ข้อมูลไม่สูญหายเมื่อรีเฟรชหน้าจอ
- **รองรับการพิมพ์และการเข้าถึง (Print & Accessibility)**:
  - ปุ่มพิมพ์รายงานสำหรับสั่งพิมพ์เอกสารสรุป หรือบันทึกเป็น PDF ทันที
  - ออกแบบตามมาตรฐาน **WCAG 2.2 AA** (Semantic HTML, Focus Rings, ARIA Landmarks, Keyboard Navigation)

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── index.html           # โครงสร้างหน้าเว็บแดชบอร์ด (HTML5 Semantic)
├── styles.css           # สไตล์ชีท ดีไซน์โทเคน เลย์เอาต์ และการแสดงผลพิมพ์
├── app.js               # ตรรกะการทำงาน กรองข้อมูล วาดกราฟ และจัดการ Excel import
├── data.js              # ชุดข้อมูลตั้งต้นและ Event Log อ้างอิงจากรายงานประจำวัน
├── AGENTS.md            # แนวทางการพัฒนาและข้อกำหนดของ Repository
├── UI_GUIDELINES.md     # คู่มือมาตรฐานการออกแบบ UI/UX และ Accessibility Checklist
├── .gitignore           # คัดกรองไฟล์ชั่วคราว (เช่น ~$*.xlsx, IDE files)
└── รายงานประจำวันชุมสาย...xlsx  # ไฟล์รายงานตัวอย่าง (Source Data)
```

---

## 🚀 การเริ่มต้นใช้งานในเครื่อง (Local Setup)

โปรเจกต์นี้เป็น Vanilla Web Application (HTML / CSS / JavaScript) ไม่จำเป็นต้องติดตั้ง Node.js หรือ build process สามารถรันผ่าน Local HTTP Server ได้ทันที:

### รันผ่าน Python
```powershell
py -m http.server 8000
```
หรือ
```bash
python -m http.server 8000
```

เปิดเว็บเบราว์เซอร์ไปที่: [http://localhost:8000](http://localhost:8000)

> **คำแนะนำ**: ควรเปิดผ่าน Local HTTP Server แทนการเปิดไฟล์ตรง (`file:///`) เพื่อให้เบราว์เซอร์สามารถโหลดไฟล์ภายนอกและ Web Workers ได้อย่างสมบูรณ์

---

## 🧭 มาตรฐานและแนวทางการเขียนโค้ด (Guidelines)

- **การจัดรูปแบบ**: Indentation 2 ช่องว่าง (2 spaces) สำหรับ HTML, CSS, และ JavaScript
- **ภาษาที่ใช้แสดงผล**: ภาษาไทยเป็นหลัก ยกเว้นชื่อเฉพาะทางเทคนิคหรือสถานะระบบ (เช่น `BSSC`, `SD-WAN`, `Online`, `Down`)
- **การตั้งชื่อ**: Kebab-case สำหรับ Class name และ DOM ID (เช่น `#system-grid`, `.station-type`)
- **Accessibility**: ทุกปุ่มควบคุมต้องมี `aria-label` หรือชื่อกำกับที่ชัดเจน และรองรับการสั่งงานด้วย Keyboard (`Tab`, `Enter`, `Space`, `Esc`)
- อ่านรายละเอียดเพิ่มเติมได้ที่ [AGENTS.md](file:///d:/Forth/0.USO/Codex/AGENTS.md) และ [UI_GUIDELINES.md](file:///d:/Forth/0.USO/Codex/UI_GUIDELINES.md)
