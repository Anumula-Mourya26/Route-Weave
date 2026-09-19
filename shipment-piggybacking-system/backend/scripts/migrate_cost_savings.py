import os
import sys
import csv
import json
import math

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from config import HUB_MAP, HUB_BY_NAME
from routing_engine import haversine_distance, get_hub_coords, compute_recovery_economics

DATA_DIR = os.path.join(BASE_DIR, "data")

def migrate_shipments_csv():
    file_path = os.path.join(DATA_DIR, "shipments.csv")
    if not os.path.exists(file_path):
        print("shipments.csv not found")
        return

    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        if "Cost_Saved_INR" not in fieldnames:
            fieldnames.append("Cost_Saved_INR")
        
        for r in reader:
            s_id = r["Shipment_ID"].strip()
            is_anomaly = r.get("Anomaly_Flag", "").strip().lower() == "yes" or r.get("Status", "").strip() == "Misplaced"
            cur_hub = r.get("Current_Hub", "").strip()
            dest_hub = r.get("Destination_Hub", "").strip()

            if is_anomaly and cur_hub and dest_hub and cur_hub != dest_hub:
                econ = compute_recovery_economics(cur_hub, dest_hub, detour_km=0.0)
                r["Cost_Saved_INR"] = str(econ["cost_saved_inr"])
            else:
                r["Cost_Saved_INR"] = "0.0"
            rows.append(r)

    with open(file_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"[OK] Migrated {len(rows)} rows in shipments.csv with dynamic Cost_Saved_INR")

def migrate_dataset_soft_hack():
    file_path = os.path.join(DATA_DIR, "dataset_soft_hack.txt")
    if not os.path.exists(file_path):
        print("dataset_soft_hack.txt not found")
        return

    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])

        for r in reader:
            status = r.get("Shipment_Status", "").strip()
            mode = r.get("Recovery_Mode", "").strip()
            cur_hub = r.get("Current_Hub", "").strip()
            dest_hub = r.get("Destination_Hub", "").strip()
            detour = float(r.get("Detour_KM", 0.0) or 0.0)

            if status == "Misplaced" or mode not in ("N/A", ""):
                econ = compute_recovery_economics(cur_hub, dest_hub, detour_km=detour)
                r["Cost_Saved_USD"] = str(round(econ["cost_saved_usd"], 1))
            rows.append(r)

    with open(file_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"[OK] Migrated {len(rows)} rows in dataset_soft_hack.txt with dynamic Haversine savings")

def migrate_simulation_events():
    file_path = os.path.join(DATA_DIR, "simulation_events.csv")
    if not os.path.exists(file_path):
        print("simulation_events.csv not found")
        return

    # Map shipment IDs from scenarios
    scenarios_file = os.path.join(DATA_DIR, "simulation_scenarios.csv")
    scenario_map = {}
    if os.path.exists(scenarios_file):
        with open(scenarios_file, "r", encoding="utf-8") as f:
            for sc in csv.DictReader(f):
                scenario_map[sc["Shipment_ID"].strip()] = sc

    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])

        for r in reader:
            if None in r:
                r.pop(None, None)
            meta_raw = r.get("Metadata_JSON", "").strip()
            if meta_raw and meta_raw.startswith("{"):
                try:
                    meta = json.loads(meta_raw)
                    if "cost_saved" in meta:
                        s_id = r.get("Shipment_ID", "").strip()
                        sc = scenario_map.get(s_id, {})
                        cur_hub = sc.get("Anomaly_Hub", "H07")
                        dest_hub = sc.get("Expected_Hub", "H02")
                        detour = float(meta.get("detour_km", 0.0))
                        econ = compute_recovery_economics(cur_hub, dest_hub, detour_km=detour)
                        meta["cost_saved"] = round(econ["cost_saved_usd"], 1)
                        meta["cost_saved_inr"] = round(econ["cost_saved_inr"], 2)
                        r["Metadata_JSON"] = json.dumps(meta)
                except Exception as e:
                    pass
            rows.append(r)

    with open(file_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"[OK] Migrated simulation_events.csv metadata with dynamic recovery economics")

def migrate_incidents():
    file_path = os.path.join(DATA_DIR, "incidents.csv")
    if not os.path.exists(file_path):
        print("incidents.csv not found")
        return

    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        if "Cost_Saved_INR" not in fieldnames:
            fieldnames.append("Cost_Saved_INR")

        for r in reader:
            act_hub = r.get("Actual_Hub", "H07")
            exp_hub = r.get("Expected_Hub", "H02")
            econ = compute_recovery_economics(act_hub, exp_hub, detour_km=0.0)
            r["Cost_Saved_INR"] = str(econ["cost_saved_inr"])
            rows.append(r)

    with open(file_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"[OK] Migrated {len(rows)} rows in incidents.csv with Cost_Saved_INR")

if __name__ == "__main__":
    print("Running dynamic recovery economics migration...")
    migrate_shipments_csv()
    migrate_dataset_soft_hack()
    migrate_simulation_events()
    migrate_incidents()
    print("Migration complete!")
