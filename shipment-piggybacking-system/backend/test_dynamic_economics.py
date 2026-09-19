from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("--- Testing Case 1: SH004 (Stranded at Nalgonda H07, Dest: Warangal H02) ---")
r1 = client.post('/api/shipments/disrupt', json={'shipment_id': 'SH004', 'anomaly_hub': 'H07'})
assert r1.status_code == 200

r_match = client.post('/api/recovery/match', json={'shipment_id': 'SH004'})
assert r_match.status_code == 200
truck = r_match.json()['data']['matched_truck']
print("Matched Truck:", truck["truck_id"], "Driver:", truck["driver_name"], "Detour KM:", truck.get("detour_km"))

r_opt = client.post('/api/recovery/optimize', json={'shipment_id': 'SH004', 'truck_id': truck['truck_id']})
assert r_opt.status_code == 200
opt_data = r_opt.json()['data']
print("Optimized Metrics Preview:", opt_data['metrics_preview'])
print("Message:", opt_data['message'].encode('ascii', 'ignore').decode())

print("\n--- Testing Case 2: SH085 (Stranded at Karimnagar H04, Dest: Adilabad H08) ---")
r2 = client.post('/api/shipments/disrupt', json={'shipment_id': 'SH085', 'anomaly_hub': 'H04'})
assert r2.status_code == 200

r2_match = client.post('/api/recovery/match', json={'shipment_id': 'SH085'})
assert r2_match.status_code == 200
truck2 = r2_match.json()['data']['matched_truck']
print("Matched Truck:", truck2["truck_id"], "Driver:", truck2["driver_name"], "Detour KM:", truck2.get("detour_km"))

r2_opt = client.post('/api/recovery/optimize', json={'shipment_id': 'SH085', 'truck_id': truck2['truck_id']})
assert r2_opt.status_code == 200
opt2_data = r2_opt.json()['data']
print("Optimized Metrics Preview:", opt2_data['metrics_preview'])
print("Message:", opt2_data['message'].encode('ascii', 'ignore').decode())

# Verify that savings are dynamic and distinct
assert opt_data['metrics_preview']['cost_saved_inr'] != 6500.0, "SH004 should not be 6500"
assert opt2_data['metrics_preview']['cost_saved_inr'] != 6500.0, "SH085 should not be 6500"
assert opt_data['metrics_preview']['cost_saved_inr'] != opt2_data['metrics_preview']['cost_saved_inr'], "Different shipments must have different savings"
print("\n>>> ALL DYNAMIC GEOSPATIAL LOGISTICS VERIFICATIONS PASSED! <<<")
