# DATUM 🏗️
### AI-Driven Linking of Daily Site Progress Updates to Project Schedule Activities

An enterprise project controls intelligence platform that bridges unstructured field updates directly to Oracle Primavera P6 and Microsoft Project schedule baselines.

---

## 📌 Executive Summary

**DATUM** is an industrial-grade project progress intelligence platform engineered for mega-infrastructure, EPC (Engineering, Procurement & Construction), oil & gas, and heavy manufacturing capital projects.

In large-scale construction, master schedules authored in **Oracle Primavera P6** or **Microsoft Project** track thousands of discrete Work Breakdown Structure (WBS) deliverables down to Level 5 and Level 6. However, daily site progress arrives in fragmented, unstructured formats: free-text Daily Progress Reports, contractor Excel logs, and shift handover notes.

DATUM ingests heterogeneous site updates, applies an explainable multi-factor matching engine against L5/L6 Primavera P6 schedule baselines, flags schedule variances and out-of-baseline scope creep, and provides a dual-pane human-in-the-loop Planner Workbench backed by an immutable audit ledger.

---

## 🌟 Key Features & Capabilities

- **12-Stage End-to-End Execution Pipeline**: Built-in deterministic walkthrough for stakeholder demonstrations with zero reliance on external network calls.
- **Enterprise Operations Architecture**:
  1. **Dashboard**: Executive progress metrics, delay variance alerts, S-Curve trends, and quick field ingestion.
  2. **Site Updates & Feed**: Ingested field reports hub with status filters (`All`, `Needs Review`, `Auto-Matched`, `Approved & Linked`, `Unplanned Work`) and 4-tab Report Inspector with OCR tag extraction.
  3. **Planner Review Queue**: Dual-pane Human-in-the-Loop Planner Workbench for reviewing low-confidence or ambiguous updates.
  4. **Master Schedule**: Primavera P6 baseline viewer with 4D Gantt, S-Curve analysis, card grid, and tabular modes.
  5. **Audit Trail**: Dedicated compliance ledger capturing all auto-links, overrides, SHA-256 fingerprints, and notes.
  6. **Field Supervisor Entry**: Mobile-friendly log interface with photo evidence attachments and OCR validation.
- **Explainable 4-Factor Matching Engine**:
  - 🏷️ **System Tag & Equipment Keywords (50%)**: Tag aliases (e.g., `24-CW-017`, `Cooling Water Spool`).
  - 🏗️ **Discipline Consistency (20%)**: Piping, Civil, Electrical, Instrumentation, HSE validation.
  - 📍 **Area / Unit Location Proximity (15%)**: Unit 100, Pump Bay, Substation matching.
  - 🔤 **Fuzzy Token Similarity (15%)**: Typo tolerance and colloquial phrasing.
- **Schedule Delay & Variance Detection**: Computes planned progress vs. actual progress and calculates variance in days (+2 days, etc.).
- **Unplanned Work / Ghost Scope Isolation**: Flags out-of-scope work (`[Not in baseline]`) to protect project margins and prevent contractor claims.
- **Export & Interoperability**: One-click export to CSV, Excel, and Microsoft Project XML (`.xml`).
- **Enterprise Dark & Light Themes**: High-contrast, slate & cobalt aesthetic inspired by Linear and Stripe.

---

## 👥 User Personas & Accounts

DATUM includes built-in role switching for realistic organizational workflows:

| Role | Username | Permissions | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Lead Project Planner** | `planner` | Full Access | Review AI matches, resolve ambiguous candidates, approve schedule linkages, export audit reports |
| **Site Field Supervisor** | `rajesh` | Field Reports & Ingestion | Submit raw DPR text, log daily installed quantities, upload field photos |

*(All accounts use password: `password123`. 1-click role presets are also provided on the sign-in screen.)*

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, Fuse.js, PapaParse, XLSX, Tesseract.js, Vanilla CSS Design System.
- **Backend API**: Node.js, Express 4, embedded SQLite (`node:sqlite` DatabaseSync), PapaParse, XLSX, Multer.
- **Deployment**: Configured for instant deployment on **Vercel** as a high-performance SPA with client-side demo dataset simulation.

---

## 🚀 Getting Started & Local Setup

### 1. Install Dependencies

```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Running Locally

#### Windows Quick Launch:
From the root directory:
- **Run Everything (Backend + Frontend)**: Double-click `run_all.bat`
- **Run Backend Only**: `run_backend.bat`
- **Run Frontend Only**: `run_frontend.bat`

#### Manual Terminal:
**Terminal 1 — Backend API**:
```bash
cd backend
npm run dev
```
*Backend server runs at: `http://localhost:5000`*

**Terminal 2 — Frontend App**:
```bash
cd frontend
npm run dev
```
*Frontend application runs at: `http://localhost:5173`*

---

## ☁️ Deployment on Vercel

DATUM is pre-configured with `vercel.json` for zero-configuration Vercel deployment.

### Option A: Deploy via Vercel Dashboard (Git Integration)
1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Keep default settings (Vercel automatically detects the root `vercel.json` configuration).
4. Click **Deploy**.

### Option B: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 🔒 Security & Data Governance

- **Deterministic Client-Side Fallback**: Fully operational even in air-gapped or offline industrial environments.
- **Immutable Provenance**: Every link decision stores author, original text, confidence score, and timestamp.
- **Contractor Segregation**: Role-based access prevents unauthorized schedule baseline modifications.

---

## 📄 License & Attribution

Copyright © 2026 DATUM Platform. All rights reserved.
