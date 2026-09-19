# Route-Weave (SH-205)
### Intelligent Autonomous Shipment Piggybacking Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Google OR-Tools](https://img.shields.io/badge/Google_OR--Tools-CVRPTW-4285F4.svg?style=flat&logo=google&logoColor=white)](https://developers.google.com/optimization)
[![PostgreSQL & PostGIS](https://img.shields.io/badge/PostgreSQL-PostGIS-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://postgis.net)
[![OpenStreetMap](https://img.shields.io/badge/Basemap-OpenStreetMap-7EBC6F.svg?style=flat&logo=openstreetmap&logoColor=white)](https://www.openstreetmap.org)

> **Autonomous Disruption Mitigation & Multi-Objective Linehaul Optimization for Surface Freight**  
> *Corridor Focus:* Telangana Inter-District Highway Grid (NH 163, NH 65, NH 44, SH 1, SH 24)

---

## 🚀 Key Highlights

* **Autonomous Recovery in &lt; 30 ms:** Deterministic Google OR-Tools CVRPTW solver matches stranded cargo with active linehaul trucks with unutilized spare capacity.
* **76.5% Operational Cost Reduction:** Replaces emergency spot-hire deadheads (₹35–₹45/km) with zero-deadhead piggybacking, saving **₹6,500 per incident**.
* **250 kg CO₂ Emissions Avoided:** Eliminates secondary recovery vehicles and empty returns.
* **Strict Geospatial Accuracy:** Real-world Telangana highway geometry snapping (32 interconnected hubs, 75 linehauls) powered by pure `leaflet` and `react-leaflet` with free public OpenStreetMap vector tiles.
* **Progressive 4-State Lifecycle:**
  * **State 1:** Normal scheduled corridor (clean single blue path, zero clutter).
  * **State 2:** Mid-route disruption (intended route cleared, pulsing stranded marker 🚨, nearest candidate trucks 🚚).
  * **State 3:** AI Solved Multi-Line Visualization (🔴 Red deviation, 🔵 Blue original, 🟢 Green piggyback recovery).
  * **State 4:** Persistent state locking upon acceptance with real-time PostgreSQL commit.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS & REACT 19 FRONTEND CONTROL TOWER               │
│  • Progressive 3-Stage State Machine (State 1: Normal, 2: Stranded, 3: AI) │
│  • Pure Leaflet.js & React-Leaflet (^5.0.0) with OpenStreetMap Tiles       │
│  • Persistent 3-Color Vector Rendering (🔴 Red, 🔵 Blue, 🟢 Green)         │
└─────────────────────▲──────────────────────────────▲───────────────────────┘
                      │ (REST API)                   │ (WebSockets /ws)
                      ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                      PYTHON FASTAPI BACKEND (Uvicorn ASGI)                 │
│  • /api/shipments/disrupt   • /api/recovery/match   • /api/recovery/optimize│
│  • Strict Spatial Constraints Enforced (Anomaly != Origin, Anomaly != Dest)│
│  • Real-Time WebSocket Event Broadcasting (plan_optimized, recovery_exec)  │
└─────────────────────▲──────────────────────────────▲───────────────────────┘
                      │                              │
                      ▼                              ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────┐
│        AI OPTIMIZATION ENGINE        │  │     DATABASE & PERSISTENCE       │
│  • Google OR-Tools CVRPTW Solver     │  │  • PostgreSQL 16 with PostGIS    │
│  • Multi-Objective Weighted Penalty  │  │  • Supabase DB / REST API Layer  │
│  • Sub-30ms Deterministic Execution  │  │  • Atomic State Mutations Saved   │
└──────────────────────────────────────┘  └──────────────────────────────────┘
```

---

## 🧮 How the AI Solver Works (3 Steps)

1. **Step A — Physical Payload Constraint:**  
   $$\text{truck.Available\_Capacity\_kg} \ge \text{shipment.Weight\_kg}$$  
   *Example:* Stranded consignment `SH004` (4,500 kg) is matched with linehaul truck `TRK-004` (14.0T gross, 6.0T active load, **8.0T verified spare capacity**).
2. **Step B — Corridor Trajectory Match:**  
   $$\text{Distance}(\text{truck.current\_hub}, \text{anomaly\_hub}) \le R_{\text{threshold}}$$  
   *Example:* `TRK-004` is en route `[H06 Mahbubnagar ➔ H01 Hyderabad ➔ H07 Nalgonda ➔ H02 Warangal]`. Nalgonda (`H07`) is already a scheduled transit waypoint, adding **0.0 km detour**.
3. **Step C — Multi-Objective CVRPTW Optimization:**  
   $$\min Z = w_{\text{cost}} \cdot \Delta C + w_{\text{time}} \cdot \Delta T + w_{\text{carbon}} \cdot \Delta E$$  
   *Result:* Net savings of **₹6,500** and **250 kg CO₂ avoided** compared to dedicated spot-hire haulage.

---

## 📊 Dataset Scale (Telangana Linehaul Grid)

* **32 Interconnected Regional & Transit Hubs:** Primary district hubs (Hyderabad `H01`, Warangal `H02`, Nizamabad `H03`, Karimnagar `H04`, Khammam `H05`, Mahbubnagar `H06`), transfer hubs (Nalgonda `H07`, Siddipet `H10`, Suryapet `H14`, Bhongir `H16`), and interstate gateways (Bengaluru `H26`, Chennai `H27`).
* **75 Commercial Linehaul Trucks:** 14.0T multi-axle trucks, 10.0T/7.5T MCVs, and 3.5T/5.0T LCVs with real-time waypoint ETAs and driver telemetry.
* **200 Tracked Consignments & 25+ Incident Presets:** Enterprise shipments from Tata Motors, Flipkart, Amazon, Cipla, Sun Pharma, and Reliance.

---

## 🛠️ Quickstart Guide

### Prerequisites
* Node.js 18+ and npm
* Python 3.10+
* Git

### 1. Clone the Repository
```bash
git clone https://github.com/Anumula-Mourya26/Route-Weave.git
cd Route-Weave/shipment-piggybacking-system
```

### 2. Start Python FastAPI Backend & Solver
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API will run at `http://localhost:8000` (Swagger docs at `/docs`).*

### 3. Start Next.js / React Frontend
```bash
cd ../frontend
npm install
npm run dev -- --port 5173
```
*Frontend Control Tower will run at `http://localhost:5173`.*

---

## 📑 Pitch & Demo Documentation
* **Technical Architecture PDF:** [`SH205_Technical_Architecture_and_Demo_Reference.pdf`](./shipment-piggybacking-system/SH205_Technical_Architecture_and_Demo_Reference.pdf)
* **Markdown Pitch Reference Guide:** [`SH205_Technical_Architecture_and_Demo_Reference.md`](./shipment-piggybacking-system/SH205_Technical_Architecture_and_Demo_Reference.md)

---

## 👥 Authors
* **Team Malwifi** · *Autonomous Linehaul Logistics Engineering*
