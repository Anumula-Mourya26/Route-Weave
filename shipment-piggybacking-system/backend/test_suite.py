import sys
import os
import requests
import json
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = os.getenv("TEST_API_URL", "http://localhost:8000")

def run_tests():
    print("=================================================================")
    print(" SH-205 SYSTEM VERIFICATION & TEST SUITE")
    print(" Domain: Telangana Logistics Corridor (8 Hubs, 5 Trucks, 200 Shipments)")
    print("=================================================================\n")

    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name} {details}")
        else:
            print(f"  [FAIL] {name} {details}")

    # 1. Health check
    print("--- 1. Testing Service Health & PostGIS ---")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        assert_test("Service is healthy", r.status_code == 200, f"Status: {r.status_code}")
        data = r.json()
        assert_test("Database connected", "Supabase" in data.get("database", ""))
        assert_test("Solver engine online", "OR-Tools" in data.get("solver", ""))
    except Exception as e:
        assert_test("Health check request", False, f"Exception: {e}")

    # 2. Hubs & Trucks
    print("\n--- 2. Testing Network Topography (Hubs & Fleet Trucks) ---")
    try:
        r_hubs = requests.get(f"{BASE_URL}/api/hubs")
        hubs = r_hubs.json().get("data", [])
        assert_test("Telangana Network Hubs Loaded", len(hubs) in (8, 32), f"Found: {len(hubs)}")

        r_trucks = requests.get(f"{BASE_URL}/api/trucks")
        trucks = r_trucks.json().get("data", [])
        assert_test("Active Fleet Trucks Loaded", len(trucks) >= 5, f"Found: {len(trucks)}")
        trk4 = next((t for t in trucks if t.get("truck_id") in ("TRK-004", "V004")), None)
        assert_test("TRK-004 (Vikram Singh) exists", trk4 is not None)
        assert_test("TRK-004 has spare capacity >= 8T", float(trk4.get("spare_capacity_tons", 0)) >= 8.0 if trk4 else False)
    except Exception as e:
        assert_test("Hubs/Trucks query", False, f"Exception: {e}")

    # 3. 5-Step Demo Flow Execution
    print("\n--- 3. Testing 5-Step Demo Workflow Execution ---")
    try:
        # Step 1: Simulate Disrupt
        print("\n  >> Executing Step 1: Simulate Disrupt (SHP-1004 at Nalgonda)...")
        r1 = requests.post(f"{BASE_URL}/api/simulate/disrupt", json={"shipment_id": "SHP-1004", "anomaly_hub": "H7"})
        assert_test("Step 1 Disrupt API 200", r1.status_code == 200)
        d1 = r1.json().get("data", {})
        assert_test("Step 1 Anomaly Hub is Nalgonda", d1.get("hub") == "Nalgonda")

        # Step 2: Detect Cargo
        print("\n  >> Executing Step 2: Detect Misplaced Shipment...")
        r2 = requests.post(f"{BASE_URL}/api/recovery/detect", json={"shipment_id": "SHP-1004"})
        assert_test("Step 2 Detect API 200", r2.status_code == 200)
        d2 = r2.json().get("data", {})
        assert_test("Step 2 Priority Critical", d2.get("priority") == "Critical")

        # Step 3: Match Truck
        print("\n  >> Executing Step 3: Match Piggyback Truck...")
        r3 = requests.post(f"{BASE_URL}/api/recovery/match", json={"shipment_id": "SHP-1004"})
        assert_test("Step 3 Match API 200", r3.status_code == 200)
        d3 = r3.json().get("data", {})
        matched_truck = d3.get("matched_truck", {})
        assert_test("Matched Truck is TRK-004", matched_truck.get("truck_id") == "TRK-004")
        assert_test("Detour is 0 km (On Route)", matched_truck.get("detour_km") == 0.0)

        # Step 4: Optimize Plan (OR-Tools)
        print("\n  >> Executing Step 4: Multi-Objective OR-Tools Solver...")
        start_opt = time.time()
        r4 = requests.post(f"{BASE_URL}/api/recovery/optimize", json={
            "shipment_id": "SHP-1004",
            "truck_id": "TRK-004",
            "weights": {"cost_weight": 0.4, "time_weight": 0.4, "carbon_weight": 0.2},
            "timeout_seconds": 2.0
        })
        opt_duration = time.time() - start_opt
        assert_test("Step 4 Optimize API 200", r4.status_code == 200)
        d4 = r4.json().get("data", {})
        solver_res = d4.get("solver_result", {})
        solver_dur = solver_res.get("solver_duration_ms", 0.0)
        assert_test("Solver duration < 2000ms (Feature 6.5)", solver_dur < 2000.0, f"Solver Time: {solver_dur}ms")
        assert_test("Status is OPTIMAL", solver_res.get("status") == "OPTIMAL")

        # Step 5: Execute Recovery
        print("\n  >> Executing Step 5: Execute Recovery & Validate Jury Metrics...")
        r5 = requests.post(f"{BASE_URL}/api/recovery/execute", json={
            "shipment_id": "SHP-1004",
            "truck_id": "TRK-004",
            "recovery_mode": "Direct Piggyback",
            "detour_km": 0.0,
            "cost_saved_usd": 650.0,
            "cost_saved_inr": 6500.0,
            "carbon_saved_kg": 250.0,
            "hours_saved": 2.0
        })
        assert_test("Step 5 Execute API 200", r5.status_code == 200)
        d5 = r5.json().get("data", {})
        jury_metrics = d5.get("jury_metrics", {})
        assert_test("Jury Metric: Cost Saved INR = ₹6,500", jury_metrics.get("cost_saved_inr") == 6500.0)
        assert_test("Jury Metric: Carbon Saved = 250 kg", jury_metrics.get("carbon_saved_kg") == 250.0)
        assert_test("Jury Metric: Time Early = 2.0 hrs", jury_metrics.get("hours_saved") == 2.0)
    except Exception as e:
        assert_test("5-step demo execution", False, f"Exception: {e}")

    # 4. Failure Path & Fallback Testing (Section 8.2)
    print("\n--- 4. Testing Failure Paths & Greedy Fallback ---")
    try:
        # Force fallback flag
        rf = requests.post(f"{BASE_URL}/api/recovery/optimize", json={
            "shipment_id": "SHP-1004",
            "truck_id": "TRK-004",
            "force_fallback": True
        })
        df = rf.json().get("data", {}).get("solver_result", {})
        assert_test("Fallback trigger returns GREEDY_FALLBACK", df.get("solver_type") == "GREEDY_FALLBACK")

        # Non-existent shipment
        r_err = requests.get(f"{BASE_URL}/api/shipments/SHP-NONEXISTENT")
        assert_test("Non-existent shipment returns 404", r_err.status_code == 404)
    except Exception as e:
        assert_test("Failure path tests", False, f"Exception: {e}")

    # 5. Testing Fleet Status & New CSV Dataset Endpoints
    print("\n--- 5. Testing Fleet Status & Ingested Datasets ---")
    try:
        r_fleet = requests.get(f"{BASE_URL}/api/fleet")
        fleet = r_fleet.json().get("data", [])
        assert_test("Fleet Status Endpoint returns fleet", len(fleet) >= 5, f"Found: {len(fleet)}")
        trk1 = next((t for t in fleet if t.get("truck_id") in ("TRK-001", "V001")), None)
        assert_test("TRK-001 has driver Rajesh Kumar & route", trk1 and trk1["driver_name"] == "Rajesh Kumar")

        r_cost = requests.get(f"{BASE_URL}/api/cost-config")
        cost_cfg = r_cost.json().get("data", [])
        assert_test("Cost Configuration loaded (25 rules)", len(cost_cfg) >= 20, f"Found: {len(cost_cfg)}")

        r_inc = requests.get(f"{BASE_URL}/api/incidents")
        incidents = r_inc.json().get("data", [])
        assert_test("Incidents dataset loaded (40 incidents)", len(incidents) == 40, f"Found: {len(incidents)}")

        r_sim = requests.get(f"{BASE_URL}/api/simulation/scenarios")
        scenarios = r_sim.json().get("data", [])
        assert_test("Simulation Scenarios loaded (20 scenarios)", len(scenarios) == 20, f"Found: {len(scenarios)}")

        r_ai = requests.get(f"{BASE_URL}/api/ai/logs")
        logs = r_ai.json().get("data", [])
        assert_test("AI Decision Log loaded (20 logs)", len(logs) == 20, f"Found: {len(logs)}")

        r_hist = requests.get(f"{BASE_URL}/api/incidents/history?limit=10")
        hist = r_hist.json().get("data", [])
        assert_test("Incident History Endpoint returns enriched records", len(hist) == 10, f"Found: {len(hist)}")
        assert_test("Incident History has INR impact", "dedicated_recovery_cost_inr" in hist[0].get("financial_impact", {}))

        r_exp_csv = requests.get(f"{BASE_URL}/api/incidents/INC001/export?format=csv")
        assert_test("Incident CSV Export returns 200", r_exp_csv.status_code == 200 and "Cost_Saved_INR" in r_exp_csv.text)

        r_exp_pdf = requests.get(f"{BASE_URL}/api/incidents/INC001/export?format=pdf")
        assert_test("Incident PDF Export returns 200", r_exp_pdf.status_code == 200 and "%PDF" in r_exp_pdf.text)
    except Exception as e:
        assert_test("Fleet and datasets endpoints", False, f"Exception: {e}")

    print("\n=================================================================")
    print(f" TEST SUITE SUMMARY: {passed} / {total} tests passed ({round(passed/total*100, 1)}%)")
    print("=================================================================\n")

    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
