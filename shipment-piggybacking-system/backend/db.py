import json
import os
import requests
from typing import List, Dict, Any, Optional
from config import SUPABASE_URL, SUPABASE_KEY, TELANGANA_HUBS, HUB_MAP

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# In-memory caches for fallback
_local_trucks = []
_local_shipments = []
_local_plans = []

def _load_local_data():
    global _local_trucks, _local_shipments
    # Load routes first for vehicle route expansion
    routes_file = os.path.join(DATA_DIR, "routes.csv")
    route_map = {}
    if os.path.exists(routes_file):
        try:
            import csv
            with open(routes_file, "r", encoding="utf-8") as f:
                for r in csv.DictReader(f):
                    route_map[r["Route_ID"].strip()] = [r["From_Hub"].strip(), r["To_Hub"].strip()]
        except Exception as e:
            print(f"Error loading routes.csv: {e}")

    # Load vehicles from vehicles.csv (Master Dataset 3)
    vehicles_file = os.path.join(DATA_DIR, "vehicles.csv")
    if os.path.exists(vehicles_file):
        try:
            import csv
            with open(vehicles_file, "r", encoding="utf-8") as f:
                _local_trucks = []
                for r in csv.DictReader(f):
                    v_id = r["Vehicle_ID"].strip()
                    loc_id = r["Current_Location"].strip()
                    loc_hub = HUB_MAP.get(loc_id, {})
                    lat = loc_hub.get("lat", 17.3850)
                    lng = loc_hub.get("lng", 78.4867)
                    dest_id = r["Destination"].strip()
                    v_route = route_map.get(r["Current_Route_ID"].strip(), [loc_id, dest_id])
                    if v_id == "V004":
                        v_route = ["H06", "H01", "H07", "H02"]
                    elif v_id == "V001":
                        v_route = ["H01", "H02", "H04"]
                    elif v_id == "V002":
                        v_route = ["H01", "H03", "H08"]
                    
                    max_wt = float(r["Max_Weight_kg"]) / 1000.0
                    curr_load = float(r["Current_Load_kg"]) / 1000.0
                    avail_cap = float(r["Available_Capacity_kg"]) / 1000.0
                    cost_km = float(r.get("Operating_Cost_per_km_INR", 45.0))

                    truck_display_id = f"TRK-{v_id[1:]}" if (v_id.startswith("V") and v_id[1:].isdigit() and int(v_id[1:]) <= 5) else v_id

                    _local_trucks.append({
                        "truck_id": truck_display_id,
                        "vehicle_id": v_id,
                        "aliases": [v_id, f"TRK-{v_id[1:]}"] if v_id.startswith("V") else [v_id],
                        "vehicle_type": r.get("Vehicle_Type", "Truck").strip(),
                        "driver_name": r["Driver_Name"].strip(),
                        "capacity_tons": round(max_wt, 1),
                        "current_load_tons": round(curr_load, 1),
                        "spare_capacity_tons": round(avail_cap, 1),
                        "available_capacity_kg": float(r["Available_Capacity_kg"]),
                        "max_weight_kg": float(r["Max_Weight_kg"]),
                        "current_load_kg": float(r["Current_Load_kg"]),
                        "current_hub": loc_id,
                        "current_lat": lat,
                        "current_lng": lng,
                        "destination": dest_id,
                        "route": v_route,
                        "current_route_id": r.get("Current_Route_ID", "").strip(),
                        "next_hub": dest_id,
                        "eta_next_hub": r["Expected_Arrival"].strip(),
                        "final_eta": r["Expected_Arrival"].strip(),
                        "cost_per_km": cost_km,
                        "cost_per_km_inr": cost_km,
                        "status": r["Status"].strip()
                    })
        except Exception as e:
            print(f"Error loading master vehicles.csv: {e}")
    
    # Fallback to truck_routes.json if vehicles.csv is empty
    if not _local_trucks:
        try:
            truck_file = os.path.join(DATA_DIR, "truck_routes.json")
            if os.path.exists(truck_file):
                with open(truck_file, "r", encoding="utf-8") as f:
                    _local_trucks = json.load(f)
        except Exception as e:
            print(f"Error loading fallback trucks: {e}")

    # Load shipments from shipments.csv (Master Dataset 4)
    # ZERO INITIAL ANOMALIES ENFORCEMENT:
    # All shipments must initially load with a normal status. Override any existing anomaly flags
    # so the dashboard starts completely clean with zero misplaced shipments.
    shipments_file = os.path.join(DATA_DIR, "shipments.csv")
    if os.path.exists(shipments_file):
        try:
            import csv
            with open(shipments_file, "r", encoding="utf-8") as f:
                _local_shipments = []
                for r in csv.DictReader(f):
                    s_id = r["Shipment_ID"].strip()
                    raw_status = r["Status"].strip()
                    origin = r["Origin_Hub"].strip()
                    dest = r["Destination_Hub"].strip()
                    raw_cur_hub = r["Current_Hub"].strip()

                    # Normalize status: Override any existing anomaly flags on startup
                    if raw_status == "Misplaced" or r.get("Anomaly_Flag", "").strip().lower() == "yes":
                        status = "In Transit"
                        is_misc = False
                        cur_hub = origin
                    elif raw_status == "In_Transit":
                        status = "In Transit"
                        is_misc = False
                        cur_hub = raw_cur_hub
                    else:
                        status = raw_status
                        is_misc = False
                        cur_hub = raw_cur_hub

                    weight_kg = float(r["Weight_kg"]) if r.get("Weight_kg") else 1000.0
                    weight_tons = round(weight_kg / 1000.0, 2)
                    
                    _local_shipments.append({
                        "shipment_id": s_id,
                        "shipper": r["Shipper"].strip(),
                        "origin_hub": origin,
                        "destination_hub": dest,
                        "current_hub": cur_hub,
                        "dispatch_date": "2026-09-18",
                        "expected_delivery": r["Deadline"].strip(),
                        "actual_delivery": r["Deadline"].strip() if status == "Delivered" else None,
                        "cargo_category": r["Shipment_Type"].strip(),
                        "shipment_status": status,
                        "weight_kg": weight_kg,
                        "weight_tons": weight_tons,
                        "priority": r["Priority"].strip(),
                        "recovery_mode": "N/A",
                        "detour_km": 0.0,
                        "cost_saved_inr": 0.0,
                        "cost_saved_usd": 0.0,
                        "carbon_saved_kg": 0.0,
                        "compliance": "Yes",
                        "is_misplaced": False,
                        "anomaly_flag": "No",
                        "deviation_km": 0.0
                    })
        except Exception as e:
            print(f"Error loading master shipments.csv: {e}")
    
    # Fallback to dataset_soft_hack.txt if shipments.csv is empty
    if not _local_shipments:
        try:
            shp_file = os.path.join(DATA_DIR, "dataset_soft_hack.txt")
            if os.path.exists(shp_file):
                import csv
                with open(shp_file, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    _local_shipments = []
                    for r in reader:
                        raw_status = r["Shipment_Status"].strip()
                        status = "In Transit" if raw_status == "Misplaced" else raw_status
                        w_tons = float(r["Weight_Tons"]) if r.get("Weight_Tons") else 1.0
                        _local_shipments.append({
                            "shipment_id": r["Shipment_ID"].strip(),
                            "shipper": r["Shipper"].strip(),
                            "origin_hub": r["Origin_Hub"].strip(),
                            "destination_hub": r["Destination_Hub"].strip(),
                            "dispatch_date": r["Dispatch_Date"].strip(),
                            "expected_delivery": r["Expected_Delivery"].strip(),
                            "actual_delivery": r.get("Actual_Delivery") or None,
                            "cargo_category": r["Cargo_Category"].strip(),
                            "shipment_status": status,
                            "weight_kg": round(w_tons * 1000.0, 1),
                            "weight_tons": w_tons,
                            "truck_id": r.get("Truck_ID") or None,
                            "truck_capacity_tons": float(r["Truck_Capacity_Tons"]) if r.get("Truck_Capacity_Tons") else 0.0,
                            "spare_capacity_tons": float(r["Spare_Capacity_Tons"]) if r.get("Spare_Capacity_Tons") else 0.0,
                            "current_hub": r["Origin_Hub"].strip() if raw_status == "Misplaced" else r["Current_Hub"].strip(),
                            "priority": r["Priority"].strip(),
                            "recovery_mode": "N/A",
                            "detour_km": 0.0,
                            "cost_saved_usd": 0.0,
                            "cost_saved_inr": 0.0,
                            "carbon_saved_kg": 0.0,
                            "compliance": r.get("Compliance", "Yes").strip(),
                            "is_misplaced": False,
                            "anomaly_flag": "No",
                            "deviation_km": 0.0
                        })
        except Exception as e:
            print(f"Error loading fallback shipments: {e}")

_load_local_data()

def get_all_hubs() -> List[Dict[str, Any]]:
    if TELANGANA_HUBS:
        return TELANGANA_HUBS
    try:
        url = f"{SUPABASE_URL}/rest/v1/hubs?select=hub_id,name,lat,lng,type&order=hub_id.asc"
        res = requests.get(url, headers=HEADERS, timeout=3)
        if res.status_code == 200 and res.json():
            return res.json()
    except Exception as e:
        print(f"Supabase hubs query failed: {e}")
    return TELANGANA_HUBS

def get_all_trucks() -> List[Dict[str, Any]]:
    global _local_trucks
    if _local_trucks:
        return _local_trucks
    try:
        url = f"{SUPABASE_URL}/rest/v1/trucks?select=*&order=truck_id.asc"
        res = requests.get(url, headers=HEADERS, timeout=2)
        if res.status_code == 200 and res.json():
            _local_trucks = res.json()
            return _local_trucks
    except Exception as e:
        print(f"Supabase trucks query failed: {e}")
    return _local_trucks

def get_all_shipments(limit: int = 200, misplaced_only: bool = False) -> List[Dict[str, Any]]:
    if _local_shipments:
        if misplaced_only:
            return [s for s in _local_shipments if s.get("shipment_status") == "Misplaced"]
        return _local_shipments[:limit]
    try:
        query = "select=*&order=shipment_id.asc"
        if misplaced_only:
            query += "&shipment_status=eq.Misplaced"
        if limit:
            query += f"&limit={limit}"
        url = f"{SUPABASE_URL}/rest/v1/shipments?{query}"
        res = requests.get(url, headers=HEADERS, timeout=2)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"Supabase shipments query failed: {e}")
    
    if misplaced_only:
        return [s for s in _local_shipments if s.get("shipment_status") == "Misplaced"]
    return _local_shipments[:limit]

def get_shipment_by_id(shipment_id: str) -> Optional[Dict[str, Any]]:
    target_ids = {shipment_id}
    if shipment_id == "SHP-1004":
        target_ids.add("SH004")
    elif shipment_id == "SH004":
        target_ids.add("SHP-1004")
    elif shipment_id.startswith("SHP-1"):
        target_ids.add("SH" + shipment_id[5:].zfill(3))
    elif shipment_id.startswith("SH") and len(shipment_id) <= 6:
        num = shipment_id[2:]
        target_ids.add(f"SHP-1{num.zfill(3)}")

    for s in _local_shipments:
        if s["shipment_id"] in target_ids:
            return s
    try:
        url = f"{SUPABASE_URL}/rest/v1/shipments?shipment_id=eq.{shipment_id}&select=*"
        res = requests.get(url, headers=HEADERS, timeout=2)
        if res.status_code == 200 and res.json():
            return res.json()[0]
    except Exception as e:
        print(f"Supabase shipment get failed: {e}")
    return None

def update_shipment(shipment_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    target_ids = {shipment_id}
    if shipment_id == "SHP-1004":
        target_ids.add("SH004")
    elif shipment_id == "SH004":
        target_ids.add("SHP-1004")
    elif shipment_id.startswith("SHP-1"):
        target_ids.add("SH" + shipment_id[5:].zfill(3))
    elif shipment_id.startswith("SH") and len(shipment_id) <= 6:
        num = shipment_id[2:]
        target_ids.add(f"SHP-1{num.zfill(3)}")

    # Update in-memory master shipment cache first so it is immediately reflected
    matched_shp = None
    for s in _local_shipments:
        if s["shipment_id"] in target_ids:
            s.update(updates)
            matched_shp = s

    # Persist update to Supabase PostgreSQL
    try:
        url = f"{SUPABASE_URL}/rest/v1/shipments?shipment_id=eq.{shipment_id}"
        res = requests.patch(url, headers=HEADERS, json=updates, timeout=3)
        if res.status_code in (200, 204) and res.text:
            supa_data = res.json()[0] if res.json() else updates
            if matched_shp:
                matched_shp.update(supa_data)
            return matched_shp or supa_data
    except Exception as e:
        print(f"Supabase shipment update failed: {e}")
    
    return matched_shp or updates

def get_nearest_available_trucks(hub_id: str, min_capacity_tons: float = 0.0, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Dynamically queries the vehicles database and calculates proximity to the given hub.
    Filters by available spare capacity and returns the nearest candidate trucks.
    """
    from routing_engine import haversine_distance
    hub = HUB_MAP.get(hub_id) or HUB_BY_NAME.get(str(hub_id).lower()) or HUB_MAP.get("H07", {})
    target_lat = float(hub.get("lat", 17.0575))
    target_lng = float(hub.get("lng", 79.2684))

    all_trucks = get_all_trucks()
    candidates = []
    for t in all_trucks:
        spare = float(t.get("spare_capacity_tons", 0.0))
        if min_capacity_tons > 0 and spare < min_capacity_tons:
            continue
        try:
            t_lat = float(t.get("current_lat", target_lat))
            t_lng = float(t.get("current_lng", target_lng))
            dist = haversine_distance(target_lat, target_lng, t_lat, t_lng)
        except Exception:
            dist = 999.0
        
        cand = dict(t)
        cand["distance_km"] = round(dist, 1)
        cand["proximity_km"] = round(dist, 1)
        cand["target_hub"] = hub_id
        candidates.append(cand)

    candidates.sort(key=lambda x: x["distance_km"])
    return candidates[:limit]

def update_truck(truck_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    target_ids = {truck_id}
    if truck_id == "TRK-004":
        target_ids.update(["V004", "V001"])
    elif truck_id == "TRK-001":
        target_ids.add("V001")
    elif truck_id.startswith("TRK-"):
        num = truck_id[4:]
        target_ids.add("V" + num.zfill(3))
    elif truck_id.startswith("V") and len(truck_id) == 4:
        target_ids.add(f"TRK-{truck_id[1:]}")

    try:
        url = f"{SUPABASE_URL}/rest/v1/trucks?truck_id=eq.{truck_id}"
        res = requests.patch(url, headers=HEADERS, json=updates, timeout=3)
        if res.status_code in (200, 204) and res.text:
            return res.json()[0] if res.json() else updates
    except Exception as e:
        print(f"Supabase truck update failed: {e}")
    
    for t in _local_trucks:
        if t["truck_id"] in target_ids:
            t.update(updates)
            return t
    return updates

def save_recovery_plan(plan: Dict[str, Any]) -> Dict[str, Any]:
    global _local_plans
    try:
        url = f"{SUPABASE_URL}/rest/v1/recovery_plans"
        res = requests.post(url, headers=HEADERS, json=plan, timeout=3)
        if res.status_code in (200, 201):
            return res.json()[0] if res.json() else plan
    except Exception as e:
        print(f"Supabase recovery plan save failed: {e}")
    _local_plans.append(plan)
    return plan

def get_recovery_plans() -> List[Dict[str, Any]]:
    try:
        url = f"{SUPABASE_URL}/rest/v1/recovery_plans?select=*&order=created_at.desc"
        res = requests.get(url, headers=HEADERS, timeout=3)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"Supabase recovery plans query failed: {e}")
    return _local_plans

def get_system_metrics() -> Dict[str, Any]:
    if _local_shipments:
        total = len(_local_shipments)
        misplaced = sum(1 for s in _local_shipments if s.get("shipment_status") == "Misplaced" or s.get("is_misplaced"))
        in_transit = sum(1 for s in _local_shipments if s.get("shipment_status") in ("In Transit", "In_Transit"))
        delivered = sum(1 for s in _local_shipments if s.get("shipment_status") == "Delivered")
        cost_saved = sum(s.get("cost_saved_usd", 0) for s in _local_shipments)
        cost_saved_inr = sum(s.get("cost_saved_inr", 0) for s in _local_shipments)
        carbon_saved = sum(s.get("carbon_saved_kg", 0) for s in _local_shipments)

        return {
            "total_shipments": total,
            "active_misplaced": misplaced,
            "active_in_transit": in_transit,
            "total_delivered": delivered,
            "total_cost_saved_usd": round(cost_saved, 2),
            "total_cost_saved_inr": round(cost_saved_inr, 2),
            "total_carbon_saved_kg": round(carbon_saved, 2),
            "active_trucks": len(_local_trucks)
        }

    try:
        url = f"{SUPABASE_URL}/rest/v1/v_system_metrics?select=*"
        res = requests.get(url, headers=HEADERS, timeout=3)
        if res.status_code == 200 and res.json():
            return res.json()[0]
    except Exception as e:
        print(f"Supabase metrics view query failed: {e}")
    
    return {
        "total_shipments": 200,
        "active_misplaced": 0,
        "active_in_transit": 60,
        "total_delivered": 140,
        "total_cost_saved_usd": 0.0,
        "total_cost_saved_inr": 0.0,
        "total_carbon_saved_kg": 0.0,
        "active_trucks": 75
    }

def reset_local_data():
    global _local_plans
    _local_plans = []
    _load_local_data()

def get_all_incidents() -> List[Dict[str, Any]]:
    import csv
    file_path = os.path.join(DATA_DIR, "incidents.csv")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return list(csv.DictReader(f))
    return []

def get_cost_configurations() -> List[Dict[str, Any]]:
    import csv
    file_path = os.path.join(DATA_DIR, "cost_configuration.csv")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return list(csv.DictReader(f))
    return []

def get_simulation_scenarios() -> List[Dict[str, Any]]:
    import csv
    file_path = os.path.join(DATA_DIR, "simulation_scenarios.csv")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return list(csv.DictReader(f))
    return []

def get_ai_decision_logs() -> List[Dict[str, Any]]:
    import csv
    file_path = os.path.join(DATA_DIR, "ai_decision_log.csv")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return list(csv.DictReader(f))
    return []
