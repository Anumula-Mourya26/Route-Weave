import csv
import json
import os
import requests

SUPABASE_URL = "https://fqriuhhjoqfximtqssrw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcml1aGhqb3FmeGltdHFzc3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTYwNzIsImV4cCI6MjEwNDI3MjA3Mn0.3HXDzMJ7dWx8Eo3zICcK0yHGokYJbk3dHr_5_xAtaaY"

csv_path = os.path.join(os.path.dirname(__file__), "..", "backend", "data", "dataset_soft_hack.txt")
with open(csv_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Read {len(rows)} records from {csv_path}")

records = []
for r in rows:
    actual_delivery = r.get("Actual_Delivery")
    if not actual_delivery or actual_delivery.strip() == "":
        actual_delivery = None

    truck_id = r.get("Truck_ID")
    if not truck_id or truck_id.strip() == "":
        truck_id = None

    rec = {
        "shipment_id": r["Shipment_ID"].strip(),
        "shipper": r["Shipper"].strip(),
        "origin_hub": r["Origin_Hub"].strip(),
        "destination_hub": r["Destination_Hub"].strip(),
        "dispatch_date": r["Dispatch_Date"].strip(),
        "expected_delivery": r["Expected_Delivery"].strip(),
        "actual_delivery": actual_delivery,
        "cargo_category": r["Cargo_Category"].strip(),
        "shipment_status": r["Shipment_Status"].strip(),
        "weight_tons": float(r["Weight_Tons"]) if r.get("Weight_Tons") else 1.0,
        "truck_id": truck_id,
        "truck_capacity_tons": float(r["Truck_Capacity_Tons"]) if r.get("Truck_Capacity_Tons") else 0.0,
        "spare_capacity_tons": float(r["Spare_Capacity_Tons"]) if r.get("Spare_Capacity_Tons") else 0.0,
        "current_hub": r["Current_Hub"].strip(),
        "priority": r["Priority"].strip(),
        "recovery_mode": r["Recovery_Mode"].strip() if r.get("Recovery_Mode") else "N/A",
        "detour_km": float(r["Detour_KM"]) if r.get("Detour_KM") else 0.0,
        "cost_saved_usd": float(r["Cost_Saved_USD"]) if r.get("Cost_Saved_USD") else 0.0,
        "carbon_saved_kg": float(r["Carbon_Saved_kg"]) if r.get("Carbon_Saved_kg") else 0.0,
        "compliance": r.get("Compliance", "Yes").strip()
    }
    records.append(rec)

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

url = f"{SUPABASE_URL}/rest/v1/shipments"

chunk_size = 50
for i in range(0, len(records), chunk_size):
    chunk = records[i:i + chunk_size]
    res = requests.post(url, headers=headers, json=chunk)
    if res.status_code not in (200, 201):
        print(f"Error inserting chunk {i}-{i+chunk_size}: {res.status_code} - {res.text}")
    else:
        print(f"Successfully inserted shipments {i+1} to {min(i+chunk_size, len(records))}")

print("Seeding finished successfully!")
