# ProjectPulse (SIH-122) 🏗️
### AI-Driven Linking of Daily Site Progress Updates to Project Schedule Activities

**Smart India Hackathon (SIH) 2026 — Problem Statement 122**

---

## 📌 Overview

**ProjectPulse** is an industrial-grade schedule intelligence platform designed for mega infrastructure, EPC (Engineering, Procurement & Construction), oil & gas, and heavy manufacturing projects.

In large-scale construction, master schedules (Oracle Primavera P6 / MS Project) track thousands of discrete WBS deliverables (Level 5 / Level 6). However, daily site progress arrives in fragmented, unstructured formats (free-text Daily Progress Reports, contractor Excel logs, and site shift notes). 

ProjectPulse automatically ingests unstructured site updates, applies fuzzy tag/NLP matching against L5/L6 Primavera P6 schedule baselines, flags schedule variances & ghost/unplanned work, and provides an ergonomic human-in-the-loop Planner Workbench with an audit trail.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, Fuse.js, PapaParse, XLSX, Vanilla CSS design system.
- **Backend API**: Node.js (with native TypeScript type stripping), Express 4, embedded SQLite (`node:sqlite` DatabaseSync), PapaParse, XLSX, Multer.
- **Demo Data**: Sample Primavera P6 CSV schedule baselines, piping contractor progress spreadsheets, and raw DPR text logs.

---

## 📋 Prerequisites

Before running the project locally, ensure you have:
- **Node.js** (v18.x or higher, v20+ recommended)
- **npm** (comes with Node.js) or **pnpm** / **yarn**

---

## 🚀 Getting Started & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Gokulakannan2005/SIH_122.git
cd SIH_122
```

---

### 2. Install Dependencies

You need to install dependencies for both the **backend** and the **frontend**.

#### Using `npm`:
```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Install Frontend Dependencies
cd ../frontend
npm install
```

#### Using `pnpm` (Optional):
```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

---

### 3. Running Locally

You can launch the backend and frontend either using the provided automation scripts or via standard terminal commands.

#### Method A: Quick Launch Scripts (Windows)
From the root directory:
- **Run Everything (Backend + Frontend)**: Double-click `run_all.bat` or run:
  ```cmd
  run_all.bat
  ```
- **Run Backend Only**: `run_backend.bat`
- **Run Frontend Only**: `run_frontend.bat`

---

#### Method B: Manual Terminal Execution

Open **two separate terminal windows**:

##### Terminal 1 — Backend REST API
```bash
cd backend
npm run dev
# Or: npm start
```
*Backend server will start at: [http://localhost:5000](http://localhost:5000)*  
*Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)*

##### Terminal 2 — Frontend Dev Server
```bash
cd frontend
npm run dev
```
*Frontend application will start at: [http://localhost:5173](http://localhost:5173)*

---

## 📁 Project Structure

```
SIH_122/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── server.ts         # Express server & API endpoints
│   │   ├── db.ts             # SQLite schema, queries, & seeding
│   │   ├── matchingEngine.ts # Fuzzy tag & NLP matching algorithms
│   │   └── parsers.ts        # Parsers for CSV, XLSX, and TXT DPRs
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Vite + React + TypeScript App
│   ├── src/
│   │   ├── components/       # UI Components (Dashboard, Workbench, Variance, etc.)
│   │   ├── context/          # State management
│   │   ├── services/         # API integration layer
│   │   ├── types/            # TypeScript data definitions
│   │   ├── utils/            # Data formatting & helper utilities
│   │   ├── App.tsx           # Main application shell
│   │   └── index.css         # Styling system & design tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── demo-data/                # Industrial sample data files
│   ├── schedule.csv          # Master Primavera P6 schedule baseline
│   ├── piping_progress.xlsx  # Contractor piping erection log
│   └── daily_report.txt      # Free-text site supervisor daily log
├── run_all.bat               # One-click launcher for Windows
├── run_backend.bat           # Backend launcher
├── run_frontend.bat          # Frontend launcher
├── .gitignore                # Git ignore configuration
└── README.md                 # Project documentation
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & system status |
| `GET` | `/api/schedule` | Retrieve all master schedule activities |
| `GET` | `/api/site-updates`| Retrieve parsed daily site updates |
| `GET` | `/api/matches` | Retrieve AI matching results & confidence scores |
| `POST`| `/api/decisions` | Submit human planner review decision (Approve/Relink/Reject) |
| `GET` | `/api/audit-trail` | Retrieve full immutable planner audit log |
| `POST`| `/api/upload` | Upload & ingest new `.csv`, `.xlsx`, or `.txt` site reports |

---

## 📄 License & Attribution

Developed for **Smart India Hackathon 2026** (Problem Statement 122).
All rights reserved.
