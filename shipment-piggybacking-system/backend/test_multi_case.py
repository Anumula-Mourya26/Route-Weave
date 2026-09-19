import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 60)
print("VERIFYING MULTI-CASE ANOMALY SIMULATION & TRUCK SELECTION")
print("=" * 60)

# 1. Test cycling simulation
print("\n1. Testing Disruption Cycling across authentic incidents:")
cycle_ids = []
for i in range(8):
    r = client.post("/api/simulate/disrupt", json={"shipment_id": "auto"})
    d = r.json().get("data", {})
    sid = d.get("shipment_id")
    cycle_ids.append(sid)
    print(f"  Cycle {i+1}: {sid} | Shipper: {d.get('shipper')} | Stranded: {d.get('hub')} ({d.get('hub_id')}) | Dest: {d.get('destination')} | Dev: {d.get('deviation_km')}km | Wt: {d.get('weight_kg')}kg")

print(f"  Distinct simulated IDs in 8 cycles: {len(set(cycle_ids))}")
assert len(set(cycle_ids)) == 8, "Expected 8 unique cases in cycle"

# 2. Test targeted simulation for key cases
print("\n2. Testing Targeted Simulation for Key Cases:")
cases = [
    ("SH085", "H04", "H08", 3500.0),
    ("SH004", "H05", "H02", 4500.0),
    ("SH115", "H11", "H08", 5500.0),
    ("SH023", "H16", "H01", 3500.0),
    ("SH065", "H10", "H04", 2500.0),
    ("SH132", "H04", "H02", 4500.0),
    ("SH009", "H18", "H01", 3000.0)
]

for sid, exp_stranded, exp_dest, exp_wt in cases:
    r_disrupt = client.post("/api/simulate/disrupt", json={"shipment_id": sid})
    d_disrupt = r_disrupt.json().get("data", {})
    
    r_match = client.post("/api/recovery/match", json={"shipment_id": sid})
    d_match = r_match.json().get("data", {})
    matched_t = d_match.get("matched_truck", {})
    
    actual_cap = matched_t.get("available_capacity_kg", 0)
    actual_truck = matched_t.get("truck_id") or matched_t.get("vehicle_id")
    
    cap_ok = actual_cap >= exp_wt
    print(f"  Case {sid}: Stranded={d_disrupt.get('hub_id')}, Dest={d_disrupt.get('destination')}, Cargo={exp_wt}kg -> Matched {actual_truck} ({matched_t.get('driver_name')}), Cap={actual_cap}kg [Cap OK: {cap_ok}], Detour={matched_t.get('detour_km')}km, Saved=Rs.{matched_t.get('cost_saved_inr')}")
    assert cap_ok, f"Truck capacity {actual_cap} must be >= shipment weight {exp_wt}"
    assert d_disrupt.get("hub_id") == exp_stranded, f"Expected {exp_stranded}, got {d_disrupt.get('hub_id')}"
    assert d_disrupt.get("hub_id") != d_disrupt.get("origin"), f"Violation: Stranded hub {d_disrupt.get('hub_id')} equals Origin {d_disrupt.get('origin')}"
    assert d_disrupt.get("hub_id") != d_disrupt.get("destination"), f"Violation: Stranded hub {d_disrupt.get('hub_id')} equals Destination {d_disrupt.get('destination')}"

print("\n" + "=" * 60)
print("ALL MULTI-CASE & ALGORITHMIC MATCHING TESTS PASSED!")
print("=" * 60)
