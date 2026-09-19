import os
from typing import Dict

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fqriuhhjoqfximtqssrw.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcml1aGhqb3FmeGltdHFzc3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTYwNzIsImV4cCI6MjEwNDI3MjA3Mn0.3HXDzMJ7dWx8Eo3zICcK0yHGokYJbk3dHr_5_xAtaaY")

# Load hubs dynamically from hubs.csv
import csv
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
HUBS_CSV = os.path.join(DATA_DIR, "hubs.csv")

TELANGANA_HUBS = []
HUB_MAP: Dict[str, dict] = {}
HUB_BY_NAME: Dict[str, dict] = {}

if os.path.exists(HUBS_CSV):
    with open(HUBS_CSV, "r", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            h_id = r["Hub_ID"].strip()
            hub_obj = {
                "hub_id": h_id,
                "name": r["Hub_Name"].strip(),
                "city": r["City"].strip(),
                "state": r["State"].strip(),
                "lat": float(r["Latitude"]),
                "lng": float(r["Longitude"]),
                "type": r["Hub_Type"].lower().strip(),
                "storage_capacity_tons": float(r.get("Storage_Capacity_Tons", 10000)),
                "handling_cost_inr": float(r.get("Handling_Cost_INR", 400))
            }
            TELANGANA_HUBS.append(hub_obj)
            HUB_MAP[h_id] = hub_obj
            # Support H1 for H01, H2 for H02, etc.
            if h_id.startswith("H0") and len(h_id) == 3:
                short_id = "H" + h_id[2]
                HUB_MAP[short_id] = hub_obj
            HUB_BY_NAME[r["Hub_Name"].lower().strip()] = hub_obj
            HUB_BY_NAME[r["City"].lower().strip()] = hub_obj
else:
    # Static fallback for core 8 hubs
    TELANGANA_HUBS = [
        {"hub_id": "H01", "name": "Hyderabad Central", "lat": 17.3850, "lng": 78.4867, "type": "origin"},
        {"hub_id": "H02", "name": "Warangal Hub", "lat": 17.9689, "lng": 79.5941, "type": "destination"},
        {"hub_id": "H03", "name": "Nizamabad Hub", "lat": 18.6725, "lng": 78.0941, "type": "transit"},
        {"hub_id": "H04", "name": "Karimnagar Hub", "lat": 18.4386, "lng": 79.1288, "type": "transit"},
        {"hub_id": "H05", "name": "Khammam Hub", "lat": 17.2473, "lng": 80.1514, "type": "transit"},
        {"hub_id": "H06", "name": "Mahbubnagar Hub", "lat": 16.7488, "lng": 77.9850, "type": "origin"},
        {"hub_id": "H07", "name": "Nalgonda Transfer", "lat": 17.0575, "lng": 79.2684, "type": "transfer_hub"},
        {"hub_id": "H08", "name": "Adilabad Hub", "lat": 19.6640, "lng": 78.5320, "type": "destination"}
    ]
    for h in TELANGANA_HUBS:
        HUB_MAP[h["hub_id"]] = h
        if h["hub_id"].startswith("H0"):
            HUB_MAP["H" + h["hub_id"][2]] = h
        HUB_BY_NAME[h["name"].lower()] = h

# Benchmark emissions (kg CO2 per ton-km)
CO2_KG_PER_TON_KM = 0.08

# Cost Configuration (INR ₹) derived from Cost_Configuration.csv
COST_CONFIG_INR = {
    "fuel_per_km": 18.0,            # C001 Diesel cost per km
    "driver_per_km": 5.0,           # C002 Driver wages per km
    "toll_per_km": 0.8,             # C003 Average toll per km
    "maintenance_per_km": 3.0,      # C004 Vehicle maintenance per km
    "handling_per_kg": 2.0,         # C005 Loading/unloading per kg
    "hub_transfer": 500.0,          # C006 Cost of moving shipment between trucks at hub
    "detour_cost_per_km": 25.0,     # C007 Extra cost for detour
    "emergency_vehicle_per_km": 35.0,# C008 Dedicated emergency vehicle cost per km
    "dedicated_premium": 1.5,       # C009 Dedicated recovery trip premium multiplier
    "driver_incentive": 80.0,       # C021 Driver incentive for accepting piggyback
    "dispatcher_fee": 50.0,         # C022 Cost per recovery plan generated
    "carbon_credit_per_kg": 2.0     # C014 Carbon credit value
}

# Dedicated recovery baseline in INR (₹)
DEDICATED_VEHICLE_BASE_COST_INR = 8500.0  # ₹ INR
DEDICATED_VEHICLE_BASE_COST = 850.0       # USD compatibility
DEDICATED_VEHICLE_SPEED_KMH = 65.0        # km/h
BENCHMARK_COST_SAVED_INR = 6500.0         # ₹ INR saved for SHP-1004 benchmark

