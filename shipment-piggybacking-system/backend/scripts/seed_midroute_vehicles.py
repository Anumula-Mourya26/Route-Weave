import os
import sys
import csv
import json
import math
from typing import List, Dict, Tuple, Set

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
from routing_engine import get_distance, haversine_distance, CANONICAL_INTERMEDIATE_HUBS

VEHICLES_CSV = os.path.join(DATA_DIR, "vehicles.csv")
ROUTES_CSV = os.path.join(DATA_DIR, "routes.csv")
TRUCK_ROUTES_JSON = os.path.join(DATA_DIR, "truck_routes.json")
INCIDENTS_CSV = os.path.join(DATA_DIR, "incidents.csv")
SHIPMENTS_CSV = os.path.join(DATA_DIR, "shipments.csv")

# Authentic Driver Names for generated fleet
FLEET_DRIVERS = [
    "Ramesh Goud", "Bikram Roy", "Naveen Yadav", "Sanjay Varma", "Deepak Rao",
    "Arun Reddy", "Kiran Verma", "Mahesh Babu", "Pooja Hegde Fleet", "Raghuveer Singh",
    "Ajay Dev", "Sunil Goud", "Venkatesh Murthy", "Pradeep Naik", "Girish Chander",
    "Ashok Kumar", "Vijay Kanth", "Mohan Rao", "Srikanth Reddy", "Manish Kumar",
    "Santosh Naik", "Harish Babu", "Bhaskar Rao", "Chandra Sekhar", "Anil Kumar",
    "Srinivas Goud", "Devender Sharma", "Kishore Reddy", "Balram Yadav", "Gopal Das",
    "Subba Rao", "Praveen Teja", "Laxman Rao", "Surya Prakash", "Damodar Reddy",
    "Kalyan Ram", "Tarun Kumar", "Shankar Rao", "Vidyasagar Rao", "Anand Vardhan"
]

def calculate_bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate forward azimuth bearing from (lat1, lng1) to (lat2, lng2) in radians."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_lam = math.radians(lng2 - lng1)
    y = math.sin(delta_lam) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lam)
    return math.atan2(y, x)

def project_radial_point(lat: float, lng: float, distance_km: float, bearing_rad: float) -> Tuple[float, float]:
    """Projects a point distance_km away at bearing_rad using spherical geodesy."""
    R = 6371.0
    delta = distance_km / R
    phi1 = math.radians(lat)
    lam1 = math.radians(lng)

    phi2 = math.asin(math.sin(phi1) * math.cos(delta) + math.cos(phi1) * math.sin(delta) * math.cos(bearing_rad))
    lam2 = lam1 + math.atan2(
        math.sin(bearing_rad) * math.sin(delta) * math.cos(phi1),
        math.cos(delta) - math.sin(phi1) * math.sin(phi2)
    )
    return round(math.degrees(phi2), 5), round(math.degrees(lam2), 5)

def get_unique_anomaly_corridors() -> Dict[str, Set[str]]:
    """
    Scans incidents.csv, shipments.csv, and canonical transfer topology
    to determine every unique stranded hub and its destination corridors.
    """
    corridors: Dict[str, Set[str]] = {}

    # 1. Scan incidents.csv
    if os.path.exists(INCIDENTS_CSV):
        with open(INCIDENTS_CSV, "r", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                actual = r.get("Actual_Hub", "").strip()
                expected = r.get("Expected_Hub", "").strip()
                if actual and expected and actual != expected:
                    corridors.setdefault(actual, set()).add(expected)

    # 2. Scan shipments.csv (for existing or potential anomalies)
    if os.path.exists(SHIPMENTS_CSV):
        with open(SHIPMENTS_CSV, "r", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                is_ano = r.get("Anomaly_Flag", "").strip().lower() == "yes" or r.get("Status", "").strip() == "Misplaced"
                if is_ano:
                    cur = r.get("Current_Hub", "").strip()
                    dest = r.get("Destination_Hub", "").strip()
                    if cur and dest and cur != dest:
                        corridors.setdefault(cur, set()).add(dest)

    # 3. Incorporate canonical intermediate hubs
    for (orig, dest), intermediate in CANONICAL_INTERMEDIATE_HUBS.items():
        if intermediate and dest and intermediate != dest:
            corridors.setdefault(intermediate, set()).add(dest)

    # Ensure core 8 hubs with potential disruption have coverage
    fallbacks = {
        "H02": {"H04", "H05"},
        "H03": {"H01", "H04"},
        "H04": {"H02", "H08"},
        "H05": {"H02", "H01"},
        "H07": {"H02", "H04"},
        "H08": {"H01", "H02"},
        "H10": {"H03", "H04"},
        "H11": {"H03", "H04", "H08"},
        "H14": {"H02", "H05", "H07"},
        "H16": {"H01"},
        "H17": {"H03"},
        "H18": {"H01"},
        "H21": {"H01"}
    }
    for k, v in fallbacks.items():
        corridors.setdefault(k, set()).update(v)

    return corridors

def seed_midroute_vehicles():
    print("=================================================================")
    print(" MID-ROUTE VEHICLES DATA ENRICHMENT & ANOMALY-TARGETED SEEDING")
    print("=================================================================\n")

    anomaly_corridors = get_unique_anomaly_corridors()
    print(f"[*] Found {len(anomaly_corridors)} unique stranded anomaly hubs:")
    for hub_id, dests in sorted(anomaly_corridors.items()):
        print(f"    - Hub {hub_id} ({HUB_MAP.get(hub_id, {}).get('name', 'Unknown')}) -> Dest Corridors: {sorted(list(dests))}")

    # Read existing routes (keep base <= R120 for idempotency)
    existing_routes = []
    route_pair_map = {}
    max_route_num = 0
    if os.path.exists(ROUTES_CSV):
        with open(ROUTES_CSV, "r", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                r_num_str = r["Route_ID"].strip().replace("R", "")
                if r_num_str.isdigit() and int(r_num_str) <= 120:
                    existing_routes.append(r)
                    pair = (r["From_Hub"].strip(), r["To_Hub"].strip())
                    route_pair_map[pair] = r["Route_ID"].strip()
                    max_route_num = max(max_route_num, int(r_num_str))

    print(f"\n[*] Base routes in routes.csv: {len(existing_routes)} (Highest Route ID: R{max_route_num:03d})")

    # Read existing vehicles (keep base <= V075 for idempotency)
    existing_vehicles = []
    fieldnames_veh = []
    max_veh_num = 0
    if os.path.exists(VEHICLES_CSV):
        with open(VEHICLES_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fieldnames_veh = list(reader.fieldnames) if reader.fieldnames else []
            for r in reader:
                v_num_str = r["Vehicle_ID"].strip().replace("V", "")
                if v_num_str.isdigit() and int(v_num_str) <= 75:
                    existing_vehicles.append(r)
                    max_veh_num = max(max_veh_num, int(v_num_str))

    print(f"[*] Base vehicles in vehicles.csv: {len(existing_vehicles)} (Highest ID: V{max_veh_num:03d})")

    # Ensure Current_Lat and Current_Lng in vehicles schema
    if "Current_Lat" not in fieldnames_veh:
        loc_idx = fieldnames_veh.index("Current_Location") if "Current_Location" in fieldnames_veh else 7
        fieldnames_veh.insert(loc_idx + 1, "Current_Lat")
        fieldnames_veh.insert(loc_idx + 2, "Current_Lng")

    # Backfill lat/lng for existing vehicles if missing
    for v in existing_vehicles:
        if not v.get("Current_Lat") or not v.get("Current_Lng"):
            loc = v["Current_Location"].strip()
            hub = HUB_MAP.get(loc, {})
            v["Current_Lat"] = str(round(hub.get("lat", 17.3850), 5))
            v["Current_Lng"] = str(round(hub.get("lng", 78.4867), 5))

    # Prepare structures for newly generated vehicles and routes
    new_vehicles: List[Dict[str, str]] = []
    new_routes: List[Dict[str, str]] = []
    new_truck_routes: List[Dict[str, any]] = []

    driver_idx = 0
    curr_veh_num = max_veh_num
    curr_route_num = max_route_num

    # Configuration for generating 3 trucks per anomaly hub
    # Strictly between 10.0km and 30.0km distance
    DIST_PROFILE = [12.5, 18.0, 24.5]  # km from stranded hub
    CAPACITY_PROFILE = [10000.0, 12000.0, 14000.0]  # Available_Capacity_kg (guaranteed >= 8000kg)
    MAX_WEIGHT_PROFILE = [16000.0, 18000.0, 20000.0]
    VOLUME_PROFILE = [55, 60, 70]
    ANGLE_OFFSETS = [-0.25, 0.05, 0.35]  # Radians offset from direct corridor bearing

    print("\n[*] Synthesizing dynamic mid-route vehicles...")
    for stranded_hub_id in sorted(anomaly_corridors.keys()):
        stranded_hub = HUB_MAP.get(stranded_hub_id)
        if not stranded_hub:
            continue

        s_lat = float(stranded_hub["lat"])
        s_lng = float(stranded_hub["lng"])
        dest_list = sorted(list(anomaly_corridors[stranded_hub_id]))

        # Generate 3 dynamic trucks per unique stranded hub
        for i in range(3):
            curr_veh_num += 1
            v_id = f"V{curr_veh_num:03d}"
            trk_id = f"TRK-{curr_veh_num:03d}"

            dest_hub_id = dest_list[i % len(dest_list)]
            dest_hub = HUB_MAP.get(dest_hub_id, {})
            d_lat = float(dest_hub.get("lat", 17.9689))
            d_lng = float(dest_hub.get("lng", 79.5941))

            # 1. Bearing & Radial Coordinate calculation
            base_bearing = calculate_bearing(s_lat, s_lng, d_lat, d_lng)
            bearing = base_bearing + ANGLE_OFFSETS[i]
            target_distance_km = DIST_PROFILE[i]

            truck_lat, truck_lng = project_radial_point(s_lat, s_lng, target_distance_km, bearing)

            # Strict verification of distance: MUST be between 10.0 and 30.0 km
            actual_dist = haversine_distance(s_lat, s_lng, truck_lat, truck_lng)
            assert 10.0 <= actual_dist <= 30.0, f"Distance {actual_dist}km violation for {v_id}"

            # 2. Route registration
            pair = (stranded_hub_id, dest_hub_id)
            if pair in route_pair_map:
                route_id = route_pair_map[pair]
            else:
                curr_route_num += 1
                route_id = f"R{curr_route_num:03d}"
                route_dist = get_distance(stranded_hub_id, dest_hub_id)
                dur = round(max(1.5, route_dist / 50.0), 1)
                toll = round(route_dist * 2.5)
                fuel = round(route_dist * 18.0)
                new_route_entry = {
                    "Route_ID": route_id,
                    "From_Hub": stranded_hub_id,
                    "To_Hub": dest_hub_id,
                    "Distance_km": str(int(route_dist)),
                    "Duration_hr": str(dur),
                    "Toll_Cost_INR": str(toll),
                    "Fuel_Cost_INR": str(fuel),
                    "Cost_per_km_INR": "25",
                    "Route_Status": "Active"
                }
                new_routes.append(new_route_entry)
                route_pair_map[pair] = route_id

            # 3. Capacity & Load guarantees (8,000–14,000 kg available)
            avail_cap = CAPACITY_PROFILE[i]
            max_wt = MAX_WEIGHT_PROFILE[i]
            cur_load = max_wt - avail_cap
            vol = VOLUME_PROFILE[i]

            driver_name = FLEET_DRIVERS[driver_idx % len(FLEET_DRIVERS)]
            driver_idx += 1

            cost_km = 44 + (i * 2)  # 44, 46, 48 INR/km

            # 4. Create Vehicle Record
            loc_coord_str = f"{truck_lat:.5f}, {truck_lng:.5f}"
            new_veh_record = {
                "Vehicle_ID": v_id,
                "Vehicle_Type": "Multi-Axle Truck" if max_wt >= 18000 else "Truck",
                "Driver_Name": driver_name,
                "Max_Weight_kg": str(int(max_wt)),
                "Max_Volume_m3": str(vol),
                "Current_Load_kg": str(int(cur_load)),
                "Available_Capacity_kg": str(int(avail_cap)),
                "Current_Location": loc_coord_str,
                "Current_Lat": str(truck_lat),
                "Current_Lng": str(truck_lng),
                "Current_Route_ID": route_id,
                "Destination": dest_hub_id,
                "Departure_Time": "2026-09-18T18:00",
                "Expected_Arrival": "2026-09-19T06:00",
                "Operating_Cost_per_km_INR": str(cost_km),
                "Status": "In_Transit"
            }
            new_vehicles.append(new_veh_record)

            # 5. Create truck_routes.json entry
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
                "route": [stranded_hub_id, dest_hub_id],
                "current_location": loc_coord_str,
                "current_hub": stranded_hub_id,
                "current_lat": truck_lat,
                "current_lng": truck_lng,
                "distance_to_stranded_km": round(actual_dist, 1),
                "next_hub": dest_hub_id,
                "destination": dest_hub_id,
                "eta_next_hub": "2026-09-19T14:30:00",
                "final_eta": "2026-09-19T18:00:00",
                "cost_per_km": cost_km,
                "cost_per_km_inr": cost_km,
                "status": "in_transit"
            })

            print(f"  [+] {v_id} ({trk_id}) | Driver: {driver_name:<16} | Pos: ({truck_lat}, {truck_lng}) | Dist to {stranded_hub_id}: {actual_dist:.1f}km | Spare: {int(avail_cap)}kg | Dest: {dest_hub_id}")

    print(f"\n[*] Total new mid-route vehicles generated: {len(new_vehicles)}")
    print(f"[*] Total new routes generated: {len(new_routes)}")

    # -------------------------------------------------------------------------
    # PERSISTENCE 1: vehicles.csv
    # -------------------------------------------------------------------------
    all_vehicles = existing_vehicles + new_vehicles
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
                # Keep core base trucks TRK-001 to TRK-005
                for t in raw_json:
                    tid = t.get("truck_id", "")
                    if tid in ("TRK-001", "TRK-002", "TRK-003", "TRK-004", "TRK-005"):
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
            print(f"[OK] Successfully synced {len(supa_trucks_payload)} mid-route trucks to Supabase")
        else:
            print(f"[!] Supabase sync status {res.status_code}: {res.text[:100]}")
    except Exception as e:
        print(f"[!] Supabase sync skipped or failed (local CSVs primary): {e}")

    print("\n=================================================================")
    print(" MID-ROUTE VEHICLES SEEDING COMPLETED SUCCESSFULLY")
    print("=================================================================")

if __name__ == "__main__":
    seed_midroute_vehicles()
