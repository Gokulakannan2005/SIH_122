# DATUM Demo Import Files — User Guide

This folder contains a fresh, clearly labelled set of 3 sample demo files specifically formatted for importing into the **DATUM Project Controls Platform** during live presentations and demonstrations.

---

## The 3 Demo Files

### 📁 File 1: Master Baseline Schedule
- **Filename**: `01_Master_Schedule_P6_Baseline.csv`
- **Format**: Primavera P6 / MS Project compatible CSV
- **Purpose**: Creates the official project execution baseline with 20 Level-6 activities across Civil, Piping, Electrical, Instrumentation, and Equipment.
- **Where to Upload**: 
  - In **DATUM Data Ingestion Suite** (`Upload Data` tab):
  - Under **"1. Master Baseline Schedule (Primavera P6 / MS Project)"**, click **"Browse Files"** and select `01_Master_Schedule_P6_Baseline.csv`.
- **What to Observe**:
  - The Project Calendar immediately populates with planned activities.
  - The live digital clock (HH:MM:SS) and day counter banner ("Day 22 of 90 • 24.4% Time Elapsed") activate.

---

### 📁 File 2: Daily Site Report (Field Notes)
- **Filename**: `02_Daily_Site_Report_Field_Log.txt`
- **Format**: Text file (.txt) with structured supervisor field log
- **Purpose**: Simulates raw daily progress entries submitted from the job site, covering **all 3 core demonstration scenarios**:
  1. **Confident Match (>85%)**: Pump foundation excavation, CW 24-inch spool erection, Cable tray work.
  2. **Ambiguous / Uncertain Match (50-70%)**: *"Crew reported cable pulling, but feeder number was not mentioned."* (Forces review between Feed-01 and Feed-02).
  3. **Out-of-Baseline / Unplanned**: *"A small-bore drain line was installed near the pump. [Not in baseline]"* (Flags commercial variation).
- **Where to Upload**:
  - In **DATUM Data Ingestion Suite**, under **"2. Daily Progress Logs (Free Text or Excel)"**, select the **"TXT Daily Report"** tab, click **"Browse TXT File"**, and select `02_Daily_Site_Report_Field_Log.txt`.
- **What to Observe**:
  - The mini animated parsing progress bar appears (**Tokenization → Entity Extraction → Semantic Matching → Complete**).
  - Two dedicated tabs appear:
    - **Tab 1: Auto Matched Reports** (confident green badges).
    - **Tab 2: Human Verification Queue** (ambiguous cable pulling & unplanned drain line ready for 1-click Approve, Relink, or Mark Unplanned).

---

### 📁 File 3: Contractor Daily Progress Sheet
- **Filename**: `03_Contractor_Daily_Progress_Sheet.xlsx` (also provided as `03_Contractor_Daily_Progress_Sheet.csv`)
- **Format**: Structured Excel Spreadsheet (.xlsx)
- **Purpose**: Simulates contractor daily tabular quantity progress with Entry IDs, quantities, units, and supervisor signatures.
- **Where to Upload**:
  - In **DATUM Data Ingestion Suite**, under **"2. Daily Progress Logs (Free Text or Excel)"**, select the **"Excel Progress Sheet"** tab, click **"Browse XLSX File"**, and select `03_Contractor_Daily_Progress_Sheet.xlsx`.
- **What to Observe**:
  - Direct tabular ingestion, auto-extraction of workfront areas, quantities, and supervisor attribution.

---

## Quick Demo Walkthrough Script

1. **Log in as Lead Planner** (`planner` / `password123`).
2. On the **Project Workspace Context** modal, select **"Create New Project"** (Clean Baseline).
3. Notice that DATUM starts clean with 0 phantom graphs.
4. In **Step 1**, upload `01_Master_Schedule_P6_Baseline.csv`.
5. In **Step 2**, upload `02_Daily_Site_Report_Field_Log.txt` or `03_Contractor_Daily_Progress_Sheet.xlsx`.
6. Review the **Auto Matched Reports** tab, then click the **Human Verification Queue** tab.
7. Click on the ambiguous cable pulling row to open the **Evidence Inspector Drawer** on the right.
8. Click **"Re-verify Match with AI"** to showcase real-time confidence re-scoring.
9. Click **"Analytics & CSV"** in the top navigation to view workfront bottlenecks and download the **Standardized Problem Statement CSV**.
