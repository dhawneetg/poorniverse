# 🎓 Poornima Companion — College Suite & Hostel Quota OS

<div align="center">

![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?style=for-the-badge&logo=astro&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

**An all-in-one student operating system engineered specifically for students at Poornima College of Engineering (PCE Jaipur / RTU).**

*Automate attendance compliance, forecast safe bunks, optimize limited hostel utility quotas, manage academic routines, calculate SGPA, and auto-sync live mess menus.*

[Features](#-key-features) • [Quick Start](#-quick-start) • [Chrome Extension](#-tcs-ion-chrome-extension) • [Database Setup](#-supabase-database-setup) • [Architecture](#-project-architecture)

</div>

---

## 🌟 Overview

Poornima College students face specific operational friction every semester:
1. **The 75% Attendance Rule**: Strict RTU criteria monitored through the TCS iON portal without proactive alerts or safe bunk forecasting.
2. **Constrained Hostel Quotas**: Strict allocation of 60 laundry wash tokens and 1,000 AC electricity units per season with penalties for overconsumption.
3. **Fragmented Workflows**: Mess schedules distributed via disparate portals, complex RTU SGPA credit calculations, and missing daily habit trackers.

**Poornima Companion** bridges these gaps into a single, cohesive, offline-first dashboard designed with a modern **Mobbin-inspired minimalist aesthetic** (monochrome gallery canvas, 24px corner geometry, stadium-pill controls, and dark/light mode parity).

---

## 🚀 Key Features

### 1. 📊 TCS iON Attendance & Bunk Forecaster
- **Live 75% Criteria Tracking**: Visual progress bars, color-coded health indicators (safe, caution, critical), and semester aggregate stats.
- **Safe Bunk & Recovery Calculator**:
  - *Safe Bunks*: Instantly calculates how many consecutive lectures you can safely skip while remaining above 75%.
  - *Recovery Required*: Calculates exactly how many classes you must attend consecutively to bounce back if attendance falls below the threshold.
- **3 Flexible Ingestion Methods**:
  - **1-Click Chrome Extension**: Pulls attendance data automatically from the TCS iON portal.
  - **Raw HTML / Table Paste**: Built-in parser (`tcs-parser.ts`) extracts course codes, attended hours, and total counts from copied tables.
  - **Manual Entry**: Quick creation, editing, and deletion with Lecture, Lab, and Tutorial filters.

### 2. 🧺 Hostel Quotas & Resource Management
- **Laundry Token Burn-Down Optimizer**:
  - Tracks 60-token semester quota with burn-rate analytics (target vs. actual usage).
  - Recommended wash batch thresholds (e.g. 8–10 clothes per cycle) to prevent token waste.
  - Historical wash logging with timestamp and cloth count.
- **Smart Wardrobe Tracker**:
  - Categorizes attire into Uniform, Casual, Lab Coat, Bedding, and Innerwear.
  - Real-time pipeline tracking: **Clean** ➔ **Dirty** ➔ **In Laundry**.
  - One-click "Log Wash" action that automatically transfers dirty clothes to laundry and deducts a laundry token.
- **AC Electricity Meter Logger**:
  - Sub-meter reading logger with date-stamped logs and consumed unit tracking.
  - Monitors the standard 1,000 kWh seasonal quota against daily budget targets.
  - Predicts end-of-season consumption and warns before expensive surcharge slabs trigger.

### 3. 📝 Academic Deadlines & Project Task Hub
- **Academic To-Dos**: Tag tasks by category (Assignments, Lab Records, Exams, Chores) with priority levels and deadlines.
- **Daily Recurring Habits**: Routine items that track completion streaks and automatically reset each day at midnight.
- **Folder-Based Project Workspace**: Create dedicated project spaces (e.g., Hackathons, Game Dev, Open Source) with custom folder icons and colors.

### 4. 🧮 Campus Tools & Live Mess Schedule
- **RTU SGPA / CGPA Calculator**:
  - Pre-configured for RTU/Poornima grading scheme (O, A+, A, B+, B, C) with credit weighting.
  - Incorporates Midterm Exams (MT1, MT2) and Continuous Internal Assessment (CA).
- **Auto-Synced Hostel Mess Menu**:
  - Direct real-time auto-sync with Poornima's official Firestore database (`poornima-5c202`).
  - Daily meal breakdown: Breakfast, Lunch, High Tea / Snacks, and Dinner.
  - Multi-tier fallback: Official Live Firestore ➔ Supabase Cloud ➔ LocalStorage Cache.

### 5. 🤖 Google Gemini AI Campus Advisor
- Integrated with `gemini-1.5-flash` for tailored campus guidance.
- Suggests daily wardrobe choices based on schedule/weather, offers exam preparation pacing, and syllabus strategies.

### 6. 🌐 Dual Storage: Cloud Sync + 100% Offline Capability
- **Supabase Cloud Sync**: PostgreSQL backend with secure Row-Level Security (RLS) policies and Magic Link / Password authentication.
- **Zero-Login Local Mode**: Operates fully client-side via LocalStorage if no Supabase credentials are provided.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Astro 5](https://astro.build/) (`astro@^7.2.10`) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`) |
| **Language** | TypeScript (Strict mode) |
| **Icons** | [Lucide Astro](https://lucide.dev/) |
| **Database & Auth**| [Supabase](https://supabase.com/) (`@supabase/supabase-js`) |
| **AI Integration** | [Google Gemini API](https://aistudio.google.com/) (`gemini-1.5-flash`) |
| **Browser Extension**| Chrome Extensions API (Manifest V3) |
| **Micro-Interactions**| Canvas Confetti |

---

## 📁 Repository Structure

```text
├── cosmic-chasm/                      # Main application codebase (Astro project)
│   ├── public/
│   │   ├── favicon.svg
│   │   └── tcs-extension/             # 🧩 Unpacked Chrome Extension (Manifest V3)
│   │       ├── manifest.json
│   │       ├── popup.html
│   │       ├── popup.js
│   │       └── content.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── AttendanceModule.astro    # TCS iON & Bunk calculator
│   │   │   ├── HostelQuotasModule.astro  # Laundry, Wardrobe & AC Meter
│   │   │   ├── TodoModule.astro          # Academic & Folder-wise tasks
│   │   │   ├── CampusToolsModule.astro   # SGPA calculator & Mess menu
│   │   │   ├── Header.astro              # Navigation, theme toggle & auth
│   │   │   ├── AuthModal.astro           # Supabase sign-in / register modal
│   │   │   ├── SettingsModal.astro       # API keys, backup, export/import
│   │   │   └── ExtensionModal.astro      # Instructions for Chrome extension
│   │   ├── layouts/
│   │   │   └── Layout.astro              # Base HTML wrapper with theme script
│   │   ├── lib/
│   │   │   ├── gemini.ts                 # Google Gemini API connector
│   │   │   ├── mess-sync.ts              # Live Poornima Firestore mess fetcher
│   │   │   ├── storage.ts                # LocalStorage management & defaults
│   │   │   ├── supabase.ts               # Supabase client initializer
│   │   │   ├── supabase-sync.ts          # Two-way sync engine
│   │   │   ├── tcs-parser.ts             # TCS iON raw HTML parser
│   │   │   └── types.ts                  # TypeScript interfaces
│   │   ├── pages/
│   │   │   └── index.astro               # Single-page dynamic tab view
│   │   ├── scripts/
│   │   │   └── app.ts                    # Core client-side reactive state engine
│   │   └── styles/
│   │       └── global.css                # Tailwind v4 theme & Mobbin tokens
│   ├── supabase/
│   │   └── schema.sql                    # PostgreSQL schema + RLS policies
│   ├── .env.example
│   ├── astro.config.mjs
│   └── package.json
├── package.json                          # Workspace root runner
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: `>= 22.12.0`
- **npm**: `>= 10.x`

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/college-related-tools.git
cd college-related-tools/cosmic-chasm

# Install packages
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

Populate the keys in `.env` (or configure them later via the in-app **Settings Modal**):
```env
# Supabase Configuration (Optional - falls back to LocalStorage)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API (Optional - for AI Campus Advisor)
GEMINI_API_KEY=AIzaSy...

# Deployed Application URL
PUBLIC_APP_URL=http://localhost:4321
```

### 3. Start the Development Server
From either the workspace root or inside `cosmic-chasm/`:
```bash
# From workspace root:
npm run dev

# Or directly in cosmic-chasm:
cd cosmic-chasm
npm run dev
```

Open your browser at **`http://localhost:4321`**.

---

## 🧩 TCS iON Chrome Extension

The project includes an unpacked **Manifest V3 Chrome Extension** located in `cosmic-chasm/public/tcs-extension`.

### Installation Steps:
1. Open Google Chrome (or any Chromium browser like Brave/Edge).
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **"Load unpacked"**.
5. Select the `cosmic-chasm/public/tcs-extension` folder.
6. Log in to your Poornima TCS iON attendance portal.
7. Open the extension popup and click **"Sync to Companion"** to import all subjects instantly.

---

## 🗄️ Supabase Database Setup

To enable cloud synchronization across mobile and desktop devices:

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** in your Supabase Dashboard.
3. Open [`cosmic-chasm/supabase/schema.sql`](cosmic-chasm/supabase/schema.sql) and paste its contents into the SQL Editor.
4. Run the script to provision:
   - `profiles`
   - `attendance_courses`
   - `laundry_state`
   - `wardrobe_items`
   - `ac_meter_logs`
   - `academic_todos`
   - `hostel_mess_menu`
   - `task_folders` & `folder_tasks`
   - Complete Row-Level Security (RLS) policies scoped to authenticated users.
5. Add your `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to your `.env` or in the in-app Settings modal.

---

## 🎨 Design System

This application implements the design principles documented in `DESIGN.md`:
- **Canvas**: Clean monochrome contrast (`#f8f9fa` canvas in light mode, `#09090b` deep dark mode).
- **Geometry**: 24px smooth rounded corners on cards and panels.
- **Controls**: Stadium-pill action buttons with micro-elevation transitions.
- **Typography**: Neo-grotesque font stack (`Plus Jakarta Sans` for titles/UI, `JetBrains Mono` for attendance numbers and code).
- **Feedback**: Dynamic confetti bursts upon achieving 100% daily routines or attendance milestones.

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts local development server on `http://localhost:4321` |
| `npm run build` | Builds optimized static assets to `./dist/` |
| `npm run preview` | Previews production build locally |
| `npm run astro ...` | Runs Astro CLI commands (`astro check`, etc.) |

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!
1. Fork the project.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. Feel free to adapt and customize for your own university or campus needs!
