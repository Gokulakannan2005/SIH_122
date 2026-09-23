# Demo Sample Files (Updated: September 22, 2026)

These three clean benchmark files are specifically structured for live demonstration and evaluator verification.

### 1. `01_Master_Schedule_P6_Baseline.csv`
- **File Type:** Master Schedule (Primavera P6 Level-5/Level-6 Export)
- **Planned Execution Window:** September 2026 (Active Data Date: September 22, 2026)
- **Disciplines Covered:** Civil, Piping, Electrical, Instrumentation, Equipment, HSE
- **Usage:** Ingest as Step 1 Master Baseline in the Data Ingestion Hub.

### 2. `02_Daily_Site_Report_Field_Log.txt`
- **File Type:** Daily Site Execution Text Report
- **Report Date:** 2026-09-22
- **Key Verification Scenarios:**
  - **Auto Match (High Confidence >= 85%):** E.g. Line 24-CW-017 cooling water spool erection, Pump foundation concrete pour (CIV-L6-002), Cable tray Tier-1.
  - **Uncertain Match (Needs Planner Review):** E.g. Pipe spool erection without isometric spool tag; Feeder cable pulling without feeder tag.
  - **Unplanned Activity (Out of Baseline Scope < 40%):** E.g. Small-bore utility drain piping [Not in baseline]; Emergency temporary rainwater bypass trench.
- **Usage:** Ingest as Step 2 Daily Field Report in Data Ingestion Hub.

### 3. `03_Contractor_Daily_Progress_Sheet.csv`
- **File Type:** Contractor Daily Progress Log (CSV / Excel format)
- **Report Date:** 2026-09-22
- **Structure:** Covers contractor workfront progress quantities, units, and supervisor signatures matching the 3 scenarios.
