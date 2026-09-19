import os
import sys
import csv
import json
import random
from typing import List, Dict, Set, Tuple

# Add backend directory to sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from config import DATA_DIR, HUB_MAP, TELANGANA_HUBS, SUPABASE_URL, SUPABASE_KEY
from routing_engine import get_distance

HUBS_CSV = os.path.join(DATA_DIR, "hubs.csv")
VEHICLES_CSV = os.path.join(DATA_DIR, "vehicles.csv")
ROUTES_CSV = os.path.join(DATA_DIR, "routes.csv")
TRUCK_ROUTES_JSON = os.path.join(DATA_DIR, "truck_routes.json")

# Extensive pool of authentic fleet driver names
FLEET_DRIVERS = [
    "Prabhakar Rao", "Satyanarayana Murthy", "Gopala Krishna", "Sudhakar Reddy",
    "Bhanu Prasad", "Koteswara Rao", "Raghunath Varma", "Shyam Sundar",
    "Praveen Chand", "Madhav Rao", "Narayana Swamy", "Anjaneyulu Naidu",
    "Srinivasa Chary", "Mallikarjun Goud", "Jagannath Sharma", "Thirupathi Rao",
    "Surender Reddy", "Ramachandra Murthy", "Samba Siva Rao", "Venkata Raman",
    "Hanumantha Rao", "Brahmaiah Naidu", "Rajendra Prasad", "Narasimha Rao",
    "Govind Raj", "Chaitanya Varma", "Bhupathi Raju", "Sreekanth Naik",
    "Laxmi Narayana", "Sesha Sai", "Panduranga Rao", "Krishna Murthy",
    "Damodar Naidu", "Venkateswara Rao", "Subba Reddy", "Mohan Krishna",
    "Siva Prasad", "Kalyana Chakravarthy", "Balarama Murthy", "Ranga Rao",
    "Chidambaram Pillai", "Ravi Shankar Goud", "Babu Rao", "Nagendra Kumar",
    "Keshava Rao", "Vidyadhar Reddy", "Girish Kumar", "Dharma Rao",
    "Vasant Kumar", "Upendra Varma", "Radha Krishna", "Satish Varma",
    "Hariprasad Rao", "Devaiah Goud", "Manohar Reddy", "Seshagiri Rao"
]

# Vehicle profile templates for realistic fleet diversity
VEHICLE_PROFILES = [
    {"type": "Truck", "max_wt": 12000, "vol": 40, "avail_cap": 5000, "cost_km": 42},
    {"type": "Truck", "max_wt": 14000, "vol": 45, "avail_cap": 6500, "cost_km": 44},
    {"type": "Heavy Truck", "max_wt": 16000, "vol": 55, "avail_cap": 8000, "cost_km": 45},
    {"type": "Heavy Truck", "max_wt": 16000, "vol": 55, "avail_cap": 9500, "cost_km": 46},
    {"type": "Multi-Axle Truck", "max_wt": 18000, "vol": 60, "avail_cap": 11000, "cost_km": 47},
    {"type": "Multi-Axle Truck", "max_wt": 20000, "vol": 70, "avail_cap": 13000, "cost_km": 48},
    {"type": "Container Truck", "max_wt": 22000, "vol": 75, "avail_cap": 15000, "cost_km": 50},
]

# Recommended diverse corridor targets for each hub
# Specifically designed so that H07 does NOT target H02 (preserving TRK-004 optimal baseline for SHP-1004)
# and H04 does NOT target H08 (preserving V013 optimal baseline for SH085)
HUB_TARGET_CORRIDORS: Dict[str, List[str]] = {
    "H01": ["H02", "H03", "H04", "H05", "H06", "H07", "H26", "H27", "H30"],
    "H02": ["H01", "H04", "H05", "H09", "H13", "H28"],
    "H03": ["H01", "H04", "H08", "H11", "H18"],
    "H04": ["H01", "H02", "H03", "H09", "H10", "H12"],      # Not H08
    "H05": ["H01", "H02", "H07", "H13", "H14", "H28"],
    "H06": ["H01", "H07", "H20", "H21", "H22"],
    "H07": ["H01", "H05", "H06", "H14", "H15", "H28"],      # Not H02
    "H08": ["H01", "H03", "H04", "H09", "H32"],
    "H09": ["H02", "H04", "H08", "H12", "H32"],
    "H10": ["H01", "H02", "H03", "H04", "H16", "H17"],
    "H11": ["H03", "H04", "H08", "H10", "H12"],
    "H12": ["H04", "H08", "H09", "H11", "H32"],
    "H13": ["H02", "H05", "H14", "H24", "H29"],
    "H14": ["H01", "H02", "H05", "H07", "H15"],
    "H15": ["H01", "H07", "H14", "H20", "H28"],
    "H16": ["H01", "H02", "H07", "H10", "H18"],
    "H17": ["H01", "H03", "H10", "H18", "H19"],
    "H18": ["H01", "H03", "H16", "H17", "H19"],
    "H19": ["H01", "H03", "H18", "H30", "H31"],
    "H20": ["H01", "H06", "H21", "H23", "H26"],
    "H21": ["H01", "H06", "H20", "H22", "H23"],
    "H22": ["H01", "H06", "H20", "H21", "H31"],
    "H23": ["H06", "H20", "H21", "H26", "H28"],
    "H24": ["H05", "H13", "H25", "H28", "H29"],
    "H25": ["H02", "H04", "H13", "H24", "H32"],
    "H26": ["H01", "H06", "H20", "H27", "H28"],
    "H27": ["H01", "H05", "H07", "H26", "H28"],
    "H28": ["H01", "H02", "H05", "H07", "H27", "H29"],
    "H29": ["H02", "H05", "H13", "H24", "H28"],
    "H30": ["H01", "H03", "H18", "H19", "H31"],
    "H31": ["H01", "H19", "H22", "H30", "H32"],
    "H32": ["H01", "H04", "H08", "H09", "H12"]
}

def seed_universal_hub_fleet():
    print("=================================================================")
    print(" UNIVERSAL HUB-LEVEL FLEET SEEDING & NETWORK-WIDE COVERAGE")
    print("=================================================================\n")

    # 1. Load All Hubs from hubs.csv
    hubs = []
    if not os.path.exists(HUBS_CSV):
        print(f"[!] Error: {HUBS_CSV} not found!")
        return
    
    with open(HUBS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            hubs.append(r)

    print(f"[*] Total network hubs loaded: {len(hubs)}")

    # 2. Load Existing Vehicles (Preserve V001 to V114)
    preserved_vehicles = []
    fieldnames_veh = []
    max_veh_num = 114
    if os.path.exists(VEHICLES_CSV):
        with open(VEHICLES_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fieldnames_veh = list(reader.fieldnames) if reader.fieldnames else []
            for r in reader:
                v_id = r.get("Vehicle_ID", "").strip()
                v_num_str = v_id.replace("V", "")
                # Strictly preserve base linehaul fleet (V001-V075) AND mid-route anomaly trucks (V076-V114)
                if v_num_str.isdigit() and int(v_num_str) <= 114:
                    preserved_vehicles.append(r)
                    max_veh_num = max(max_veh_num, int(v_num_str))

    print(f"[*] Preserved existing vehicles (base + mid-route anomaly trucks): {len(preserved_vehicles)}")
    print(f"    (Highest preserved ID: V{max_veh_num:03d})")

    # 3. Load Existing Routes
    existing_routes = []
    route_pair_map = {}
    max_route_num = 0
    if os.path.exists(ROUTES_CSV):
        with open(ROUTES_CSV, "r", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                existing_routes.append(r)
                pair = (r["From_Hub"].strip(), r["To_Hub"].strip())
                route_pair_map[pair] = r["Route_ID"].strip()
                r_num_str = r["Route_ID"].strip().replace("R", "")
                if r_num_str.isdigit():
                    max_route_num = max(max_route_num, int(r_num_str))

    print(f"[*] Existing routes in routes.csv: {len(existing_routes)} (Highest Route ID: R{max_route_num:03d})")

    # 4. Generate 1 to 2 New Hub-Stationed Trucks for EVERY Single Hub
    new_vehicles: List[Dict[str, str]] = []
    new_routes: List[Dict[str, str]] = []
    new_truck_routes: List[Dict[str, any]] = []

    curr_veh_num = max_veh_num
    curr_route_num = max_route_num
    driver_idx = 0

    # Count allocation:
    # Major hubs (storage >= 15000 or strategic destinations): 2 trucks
    # Regional hubs: alternating 1 or 2 trucks
    hub_truck_counts = {}

    for hub in hubs:
        h_id = hub["Hub_ID"].strip()
        h_name = hub["Hub_Name"].strip()
        h_lat = float(hub["Latitude"])
        h_lng = float(hub["Longitude"])
        h_type = hub.get("Hub_Type", "").strip().lower()
        storage = float(hub.get("Storage_Capacity_Tons", 10000))

        # Assign 2 trucks to high-capacity or strategic hubs, 1 to 2 for others
        if storage >= 15000 or h_type in ("origin", "destination", "transfer_hub") or h_id in ("H01", "H02", "H07", "H26", "H28", "H30"):
            num_trucks = 2
        else:
            # Alternating 1 or 2
            num_trucks = 2 if (int(h_id.replace("H", "")) % 2 == 0) else 1

        hub_truck_counts[h_id] = num_trucks
        targets = HUB_TARGET_CORRIDORS.get(h_id, [h["Hub_ID"].strip() for h in hubs if h["Hub_ID"].strip() != h_id])

        for t_idx in range(num_trucks):
            curr_veh_num += 1
            v_id = f"V{curr_veh_num:03d}"
            trk_id = f"TRK-{curr_veh_num:03d}"

            # Pick distinct destination hub
            dest_id = targets[t_idx % len(targets)]
            if dest_id == h_id:
                dest_id = [h["Hub_ID"].strip() for h in hubs if h["Hub_ID"].strip() != h_id][0]

            # Route resolution or registration
            pair = (h_id, dest_id)
            if pair in route_pair_map:
                route_id = route_pair_map[pair]
            else:
                curr_route_num += 1
                route_id = f"R{curr_route_num:03d}"
                dist_km = int(get_distance(h_id, dest_id))
                dur_hr = round(max(1.5, dist_km / 50.0), 1)
                toll = int(dist_km * 2.5)
                fuel = int(dist_km * 18.0)
                new_route_entry = {
                    "Route_ID": route_id,
                    "From_Hub": h_id,
                    "To_Hub": dest_id,
                    "Distance_km": str(dist_km),
                    "Duration_hr": str(dur_hr),
                    "Toll_Cost_INR": str(toll),
                    "Fuel_Cost_INR": str(fuel),
                    "Cost_per_km_INR": "25",
                    "Route_Status": "Active"
                }
                new_routes.append(new_route_entry)
                route_pair_map[pair] = route_id

            # Select realistic varied vehicle profile
            profile = VEHICLE_PROFILES[(curr_veh_num + t_idx) % len(VEHICLE_PROFILES)]
            max_wt = profile["max_wt"]
            vol = profile["vol"]
            avail_cap = profile["avail_cap"]
            cur_load = max_wt - avail_cap
            cost_km = profile["cost_km"]
            v_type = profile["type"]

            driver_name = FLEET_DRIVERS[driver_idx % len(FLEET_DRIVERS)]
            driver_idx += 1

            # Active status alternating between In_Transit and Awaiting_Dispatch
            status = "In_Transit" if (curr_veh_num % 3 != 0) else "Awaiting_Dispatch"
            status_json = "in_transit" if status == "In_Transit" else "awaiting_dispatch"

            departure = f"2026-09-19T{8 + (curr_veh_num % 10):02d}:00"
            arrival = f"2026-09-19T{16 + (curr_veh_num % 7):02d}:30"

            # Create Vehicle Record
            new_veh_record = {
                "Vehicle_ID": v_id,
                "Vehicle_Type": v_type,
                "Driver_Name": driver_name,
                "Max_Weight_kg": str(int(max_wt)),
                "Max_Volume_m3": str(vol),
                "Current_Load_kg": str(int(cur_load)),
                "Available_Capacity_kg": str(int(avail_cap)),
                "Current_Location": h_id,
                "Current_Lat": str(h_lat),
                "Current_Lng": str(h_lng),
                "Current_Route_ID": route_id,
                "Destination": dest_id,
                "Departure_Time": departure,
                "Expected_Arrival": arrival,
                "Operating_Cost_per_km_INR": str(cost_km),
                "Status": status
            }
            new_vehicles.append(new_veh_record)

            # Create truck_routes.json entry
            new_truck_routes.append({
                "truck_id": trk_id,
                "vehicle_id": v_id,
                "driver_name": driver_name,
                "capacity_tons": round(max_wt / 1000.0, 1),
                "current_load_tons": round(cur_load / 1000.0, 1),
                "spare_capacity_tons": round(avail_cap / 1000.0, 1),
                "available_capacity_kg": avail_cap,
                "max_weight_kg": max_wt,
                "current_load_kg": cur_load,
                "route": [h_id, dest_id],
                "current_location": h_id,
                "current_hub": h_id,
                "current_lat": h_lat,
                "current_lng": h_lng,
                "distance_to_stranded_km": 0.0,
                "next_hub": dest_id,
                "destination": dest_id,
                "eta_next_hub": arrival,
                "final_eta": arrival,
                "cost_per_km": cost_km,
                "cost_per_km_inr": cost_km,
                "status": status_json
            })

            print(f"  [+] {v_id} ({trk_id}) @ {h_id} ({h_name:<20}) | Dest: {dest_id} | Driver: {driver_name:<22} | Avail: {int(avail_cap):>5}kg | Status: {status}")

    print(f"\n[*] Generated {len(new_vehicles)} new hub-stationed trucks across all {len(hubs)} hubs.")
    print(f"[*] Generated {len(new_routes)} new connecting routes.")

    # -------------------------------------------------------------------------
    # PERSISTENCE 1: vehicles.csv (Safe Appending)
    # -------------------------------------------------------------------------
    all_vehicles = preserved_vehicles + new_vehicles
    with open(VEHICLES_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames_veh)
        writer.writeheader()
        writer.writerows(all_vehicles)
    print(f"[OK] Successfully persisted {len(all_vehicles)} vehicles to {VEHICLES_CSV}")

    # -------------------------------------------------------------------------
    # PERSISTENCE 2: routes.csv
    # -------------------------------------------------------------------------
    all_routes = existing_routes + new_routes
    if all_routes:
        route_fields = list(existing_routes[0].keys()) if existing_routes else [
            "Route_ID", "From_Hub", "To_Hub", "Distance_km", "Duration_hr", 
            "Toll_Cost_INR", "Fuel_Cost_INR", "Cost_per_km_INR", "Route_Status"
        ]
        with open(ROUTES_CSV, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=route_fields)
            writer.writeheader()
            writer.writerows(all_routes)
    print(f"[OK] Successfully persisted {len(all_routes)} routes to {ROUTES_CSV}")

    # -------------------------------------------------------------------------
    # PERSISTENCE 3: truck_routes.json
    # -------------------------------------------------------------------------
    existing_truck_json = []
    if os.path.exists(TRUCK_ROUTES_JSON):
        try:
            with open(TRUCK_ROUTES_JSON, "r", encoding="utf-8") as f:
                raw_json = json.load(f)
                # Keep core base trucks and mid-route anomaly trucks (V001 to V114)
                for t in raw_json:
                    tid = t.get("truck_id", "")
                    num = tid.replace("TRK-", "").replace("V", "")
                    if num.isdigit() and int(num) <= 114:
                        existing_truck_json.append(t)
                    elif tid in ("TRK-001", "TRK-002", "TRK-003", "TRK-004", "TRK-005"):
                        existing_truck_json.append(t)
        except Exception:
            existing_truck_json = []

    combined_json = existing_truck_json + new_truck_routes
    with open(TRUCK_ROUTES_JSON, "w", encoding="utf-8") as f:
        json.dump(combined_json, f, indent=2)
    print(f"[OK] Successfully persisted {len(combined_json)} trucks to {TRUCK_ROUTES_JSON}")

    # -------------------------------------------------------------------------
    # PERSISTENCE 4: Supabase sync (upsert)
    # -------------------------------------------------------------------------
    try:
        import requests
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        # Foreign key mapping for Supabase hubs table which uses H1..H8
        core_fk_map = {
            "H01": "H1", "H1": "H1",
            "H02": "H2", "H2": "H2",
            "H03": "H3", "H3": "H3",
            "H04": "H4", "H4": "H4",
            "H05": "H5", "H5": "H5",
            "H06": "H6", "H6": "H6",
            "H07": "H7", "H7": "H7",
            "H08": "H8", "H8": "H8",
            "H10": "H4", "H11": "H4", "H14": "H7", "H16": "H1", "H17": "H3", "H18": "H1", "H21": "H6"
        }
        supa_trucks_payload = []
        for t in new_truck_routes:
            cur_fk = core_fk_map.get(t["current_hub"], "H1")
            next_fk = core_fk_map.get(t["next_hub"], "H2")
            supa_trucks_payload.append({
                "truck_id": t["truck_id"],
                "driver_name": t["driver_name"],
                "capacity_tons": t["capacity_tons"],
                "current_load_tons": t["current_load_tons"],
                "spare_capacity_tons": t["spare_capacity_tons"],
                "route": [cur_fk, next_fk],
                "current_hub": cur_fk,
                "current_lat": t["current_lat"],
                "current_lng": t["current_lng"],
                "next_hub": next_fk,
                "eta_next_hub": "2026-09-19T14:30:00+00:00",
                "final_eta": "2026-09-19T18:00:00+00:00",
                "cost_per_km": t["cost_per_km"],
                "status": "in_transit"
            })
        url = f"{SUPABASE_URL}/rest/v1/trucks"
        res = requests.post(url, headers=headers, json=supa_trucks_payload, timeout=5)
        if res.status_code in (200, 201):
            print(f"[OK] Successfully synced {len(supa_trucks_payload)} hub-level trucks to Supabase")
        else:
            print(f"[!] Supabase sync status {res.status_code}: {res.text[:100]}")
    except Exception as e:
        print(f"[!] Supabase sync skipped or failed (local CSVs primary): {e}")

    # 5. Verification of Complete Hub Coverage
    print("\n--- COVERAGE AUDIT ---")
    hub_coverage = {h["Hub_ID"].strip(): 0 for h in hubs}
    for v in all_vehicles:
        loc = v.get("Current_Location", "").strip()
        if loc in hub_coverage:
            hub_coverage[loc] += 1

    zero_truck_hubs = [h for h, c in hub_coverage.items() if c == 0]
    print(f"[*] Hubs in network: {len(hub_coverage)}")
    print(f"[*] Hubs with at least 1 truck stationed: {len(hub_coverage) - len(zero_truck_hubs)} / {len(hub_coverage)}")
    assert len(zero_truck_hubs) == 0, f"Critical: Hubs without trucks: {zero_truck_hubs}"
    print(f"[OK] COMPLETE 100% COVERAGE GUARANTEED: Every single hub has active trucks stationed at it!")

    print("\n=================================================================")
    print(" UNIVERSAL HUB-LEVEL FLEET SEEDING COMPLETED SUCCESSFULLY")
    print("=================================================================")

if __name__ == "__main__":
    seed_universal_hub_fleet()
