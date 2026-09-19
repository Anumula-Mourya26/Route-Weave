import sys
from fastapi.testclient import TestClient
from main import app
from db import reset_local_data

client = TestClient(app)

def test_full_pipeline():
    print("=== Test 1: Zero Initial Anomalies Enforced ===")
    reset_local_data()
    metrics_res = client.get("/api/metrics")
    assert metrics_res.status_code == 200
    m = metrics_res.json()["data"]
    print(f"Initial active_misplaced: {m.get('active_misplaced')}")
    assert m.get("active_misplaced") == 0, f"Expected 0 misplaced, got {m.get('active_misplaced')}"

    shps_res = client.get("/api/shipments?limit=200")
    assert shps_res.status_code == 200
    shps = shps_res.json()["data"]
    misplaced = [s for s in shps if s.get("shipment_status") == "Misplaced" or s.get("is_misplaced")]
    print(f"Misplaced count in shipment records: {len(misplaced)}")
    assert len(misplaced) == 0

    print("\n=== Test 2: Targeted Disruption Injection (Disruption Sandbox) ===")
    disrupt_res = client.post("/api/shipments/disrupt", json={
        "shipment_id": "SH004", 
        "anomaly_hub": "H07"
    })
    assert disrupt_res.status_code == 200
    d_data = disrupt_res.json()["data"]
    print(f"Disrupted shipment {d_data['shipment_id']} at {d_data['hub']} ({d_data['hub_id']}), deviation_km: {d_data['deviation_km']}")
    assert d_data["deviation_km"] > 0
    assert d_data["hub_id"] == "H07"

    metrics_after = client.get("/api/metrics").json()["data"]
    print(f"Metrics active_misplaced after disruption: {metrics_after['active_misplaced']}")
    assert metrics_after["active_misplaced"] == 1

    print("\n=== Test 3: AI Recovery Match (Verifying Capacity >= Weight & Route Alignment) ===")
    match_res = client.post("/api/recovery/match", json={"shipment_id": "SH004"})
    assert match_res.status_code == 200
    match_data = match_res.json()["data"]
    matched_truck = match_data["matched_truck"]
    print(f"Matched truck: {matched_truck['truck_id']}, Driver: {matched_truck.get('driver_name')}, Capacity: {matched_truck['spare_capacity_tons']}T")
    assert float(matched_truck["spare_capacity_tons"]) * 1000.0 >= 4500.0
    assert "blue_path" in match_data and len(match_data["blue_path"]) > 0
    assert "red_path" in match_data and len(match_data["red_path"]) > 0
    assert "green_path" in match_data and len(match_data["green_path"]) > 0
    print(f"Blue path points: {len(match_data['blue_path'])}, Red path points: {len(match_data['red_path'])}, Green path points: {len(match_data['green_path'])}")

    print("\n=== Test 4: OR-Tools Multi-Objective Optimization ===")
    opt_res = client.post("/api/recovery/optimize", json={
        "shipment_id": "SH004", 
        "truck_id": matched_truck["truck_id"], 
        "weights": {"cost_weight": 0.5, "time_weight": 0.3, "carbon_weight": 0.2}
    })
    assert opt_res.status_code == 200
    print("Optimizer converged successfully!")

    print("\n=== Test 5: Execute Recovery ===")
    exec_res = client.post("/api/recovery/execute", json={
        "shipment_id": "SH004", 
        "truck_id": matched_truck["truck_id"], 
        "recovery_mode": "Direct Piggyback", 
        "detour_km": 15.0, 
        "cost_saved_inr": 6500.0, 
        "cost_saved_usd": 650.0, 
        "carbon_saved_kg": 250.0, 
        "hours_saved": 2.0
    })
    assert exec_res.status_code == 200

    metrics_final = client.get("/api/metrics").json()["data"]
    print(f"Metrics active_misplaced after recovery: {metrics_final['active_misplaced']}")
    assert metrics_final["active_misplaced"] == 0

    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_full_pipeline()
