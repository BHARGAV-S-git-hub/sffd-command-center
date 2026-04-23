## ⚠️ The Problem & Project Objective
Most fire dispatch centers rely on reactive dashboards. Dispatchers wait for an incident to occur, look at a map, and deploy engines. By the time they react to high-volume events, the fleet is already exhausted.

## 💡 The Solution
We built a predictive tactical dispatch engine backed by a **live Databricks Machine Learning pipeline**. It doesn't just show where fires are right now; it forecasts fleet exhaustion hours into the future, stress-tests capacity against environmental hazards, and allows dispatchers to simulate deployments in real-time before issuing actual commands.

---

## ✨ Core Features

### 1. 🌪️ Environmental Stress-Testing
A simulation engine that allows dispatchers to inject dynamic real-world variables (e.g., High Winds, Earthquakes). The frontend immediately applies risk multipliers, recalculating the safety metrics of the entire city and visually flagging newly vulnerable zones.

### 2. ⏳ Temporal Forecasting Engine ("Time Travel")
A predictive time slider (+0 to +12 hours) that runs a mathematical decay algorithm based on current incident loads. It shows exactly when and where fleet exhaustion will occur if no action is taken.

### 3. 🧠 ML Optimization Directives (AI Override)
An intelligent system that constantly scans Databricks data to find the district in the worst `DEFICIT` and the safest `SURPLUS`. It generates natural language directives, prompting the dispatcher to execute an optimized engine transfer.

### 4. 🎛️ Interactive Deployment Simulation
Client-side "What-If" scenario modeling. Dispatchers can click **"Add Engine"** on any active battalion to intercept the ML data, simulate a drop in risk probability, and synchronously update the Leaflet map and Recharts graphs without a page reload.

---

## 🛠️ Technical Architecture & Stack

### Frontend (User Interface)
* **Framework:** Next.js (App Router) & React
* **Styling:** Tailwind CSS combined with a custom "Obsidian & Titanium" defense-contractor aesthetic (Glassmorphism, restricted functional colors, `JetBrains Mono` typography).
* **Geospatial Mapping:** `react-leaflet` (CARTO Dark Matter basemaps) rendered dynamically to avoid SSR hydration mismatches.
* **Data Visualization:** `recharts` for dynamic, data-bound probability matrices.

### Backend & Data Pipeline
* **Backend API:** Next.js API Routes utilizing pure `fetch()` REST API calls for serverless-friendly deployment.
* **Machine Learning & Data Warehouse:** Databricks SQL Warehouse (Medallion Architecture pulling from the `gold_web_live_engine` table).
* **Hosting / CI-CD:** AWS Amplify with automated GitHub webhook deployments.

---

## 🚀 Running the Project Locally

### Prerequisites
* Node.js 18+
* A Databricks Workspace with an active SQL Warehouse.
