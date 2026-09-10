# ProjectPulse (SIH-122) 🏗️
### AI-Driven Linking of Daily Site Progress Updates to Project Schedule Activities

**Smart India Hackathon (SIH) 2026 — Problem Statement 122**

---

## 📌 Executive Summary

**ProjectPulse** is an industrial-grade project progress intelligence platform designed for mega infrastructure, EPC (Engineering, Procurement & Construction), oil & gas, and heavy manufacturing projects.

In large-scale construction, master schedules (authored in **Oracle Primavera P6** or **Microsoft Project**) track thousands of discrete Work Breakdown Structure (WBS) deliverables down to Level 5 and Level 6. However, daily site progress arrives in fragmented, unstructured formats (free-text Daily Progress Reports, contractor Excel logs, and shift handover notes). 

ProjectPulse automatically ingests unstructured site updates, applies explainable multi-factor matching against L5/L6 Primavera P6 schedule baselines, flags schedule variances & unplanned scope creep, and provides an ergonomic human-in-the-loop Planner Workbench with an immutable audit ledger.

---

## 🌟 Key Features & Capabilities

- **11-Step Deterministic Guided Demo**: Built-in interactive presentation walkthrough for hackathons and client demonstrations with presenter cheatsheets and zero reliance on external network calls.
- **6-Pillar Clean Architecture**:
  1. **Dashboard**: Executive progress metrics, delay variance alerts, S-Curve trends, and quick field ingestion.
  2. **Updates / Analyze**: Ingested field reports hub with status filters (`All`, `Needs Review`, `Auto-Matched`, `Approved & Linked`, `Unplanned Work`) and 4-tab Report Inspector.
  3. **Review Queue**: Dual-pane Human-in-the-Loop Planner Workbench for reviewing low-confidence or ambiguous updates.
  4. **Schedule**: Master Primavera P6 baseline viewer with 4D Gantt, S-Curve analysis, card grid, and tabular modes.
  5. **Audit Trail**: Dedicated full-page compliance ledger capturing all auto-links, overrides, timestamps, and notes.
  6. **Guided Demo Mode**: Self-paced interactive tour highlighting all core capabilities.
- **Explainable 4-Factor Matching Engine**:
  - 🏷️ **System Tag & Equipment Keywords (50%)**: Tag aliases (e.g., `24-CW-017`, `Cooling Water Spool`).
  - 🏗️ **Discipline Consistency (20%)**: Piping, Civil, Electrical, Instrumentation, HSE validation.
  - 📍 **Area / Unit Location Proximity (15%)**: Unit 100, Pump Bay, Substation matching.
  - 🔤 **Fuzzy Token Similarity (15%)**: Resolves typo tolerance and colloquial phrasing.
- **Schedule Delay & Variance Detection**: Computes planned progress vs. actual progress and calculates variance in days.
- **Unplanned Work / Ghost Scope Isolation**: Flags out-of-scope work (`[Not in baseline]`) to protect project margins and prevent contractor claims.
- **Export & Interoperability**: One-click export to CSV, Excel, and Microsoft Project XML (`.xml`).
- **Enterprise Dark & Light Themes**: High-contrast, slate & cobalt aesthetic inspired by Linear and Stripe, free of gaudy neon effects.

---

## 👥 User Personas & Accounts

ProjectPulse includes built-in role switching for realistic organizational workflows:

| Role | Username | Permissions | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Lead Project Planner** | `planner@projectpulse.ai` | Full Access | Review AI matches, resolve ambiguous candidates, approve schedule linkages, export audit reports |
| **Site Field Supervisor** | `supervisor@projectpulse.ai` | Field Reports & Ingestion | Submit raw DPR text, log daily installed quantities, upload field photos |

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, Fuse.js, PapaParse, XLSX, Pure Vanilla CSS Design System.
- **Backend API**: Node.js, Express 4, embedded SQLite (`node:sqlite` DatabaseSync), PapaParse, XLSX, Multer.
- **Demo Data**: Embedded industrial Primavera P6 schedule baselines, contractor piping logs, and multi-discipline DPR updates.

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

```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Install Frontend Dependencies
cd ../frontend
npm install
```

---

### 3. Running Locally

You can launch the backend and frontend using either the automated scripts or standard terminal commands.

#### Quick Launch Scripts (Windows):
From the root directory:
- **Run Everything (Backend + Frontend)**: Double-click `run_all.bat` or run:
  ```cmd
  run_all.bat
  ```
- **Run Backend Only**: `run_backend.bat`
- **Run Frontend Only**: `run_frontend.bat`

#### Manual Terminal Execution:

**Terminal 1 — Backend API**:
```bash
cd backend
npm run dev
```
*Backend server runs at: `http://localhost:5000`*  
*Health Check: `http://localhost:5000/api/health`*

**Terminal 2 — Frontend App**:
```bash
cd frontend
npm run dev
```
*Frontend application runs at: `http://localhost:5000` or `http://localhost:5173`*

---

## 🎯 Guided Demo Walkthrough (For SIH Presentations)

To run the interactive presentation:
1. Open the application in your browser (`http://localhost:5173`).
2. Click **"Start Guided Demo"** from the sidebar or the banner on the Dashboard.
3. Use the top progress bar or navigation buttons to step through the 11-step presentation:
   - **Step 1**: The Baseline Schedule (The Source of Truth)
   - **Step 2**: Unstructured Site Progress Arrives (The Problem)
   - **Step 3**: AI Activity Matching & Confidence Scoring (The Solution)
   - **Step 4**: Explainable Matching Criteria (Explainability)
   - **Step 5**: High-Confidence Auto-Linking (Automation)
   - **Step 6**: Visualizing the Connected Bridge (The Connection)
   - **Step 7**: Schedule Intelligence & Delay Tracking (Impact)
   - **Step 8**: Handling Uncertainty & Ambiguity (The Edge Case)
   - **Step 9**: Human-in-the-Loop Planner Review Workbench (Human Control)
   - **Step 10**: Handling Unplanned Work (Scope Creep Detection)
   - **Step 11**: Audit Trail & Project Governance (Accountability)
   - **Summary**: Key Takeaways & Enterprise ROI

---

## 🔒 Security & Data Governance

- **Deterministic Fallbacks**: Fully operational even in air-gapped or offline industrial environments.
- **Immutable Provenance**: Every link decision stores author, original text, confidence score, and timestamp.
- **Contractor Segregation**: Role-based views prevent unauthorized schedule baseline modifications.

---

## 📄 License & Attribution

Developed for **Smart India Hackathon (SIH) 2026** under Problem Statement **SIH-122**.  
All rights reserved © 2026 Team ProjectPulse.
