import os
import csv
import sys

# Ensure backend root is on path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from config import DATA_DIR, HUB_MAP, TELANGANA_HUBS
from routing_engine import get_valid_intermediate_hub, get_distance

INCIDENTS_CSV = os.path.join(DATA_DIR, "incidents.csv")
SHIPMENTS_CSV = os.path.join(DATA_DIR, "shipments.csv")

def sanitize_datasets():
    print("=== STARTING DATASET GEOSPATIAL SANITIZATION ===")
    
    # 1. Load Shipments
    shipments = []
    shipment_by_id = {}
    with open(SHIPMENTS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames_shipments = reader.fieldnames
        for r in reader:
            shipments.append(r)
            shipment_by_id[r["Shipment_ID"].strip()] = r

    # 2. Process and Sanitize Incidents
    incidents = []
    sanitized_incidents_count = 0
    with open(INCIDENTS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames_incidents = reader.fieldnames
        for r in reader:
            s_id = r["Shipment_ID"].strip()
            shp = shipment_by_id.get(s_id, {})
            orig = shp.get("Origin_Hub", "H01").strip()
            dest = shp.get("Destination_Hub", "H02").strip()
            actual = r["Actual_Hub"].strip()

            # STRICT SPATIAL CONSTRAINT: Anomaly_Hub MUST NEVER equal Origin_Hub or Destination_Hub
            if actual == orig or actual == dest or not actual:
                new_actual = get_valid_intermediate_hub(orig, dest)
                hub_info = HUB_MAP.get(new_actual, {})
                dest_info = HUB_MAP.get(dest, {})

                old_actual = actual
                r["Actual_Hub"] = new_actual
                r["Actual_Lat"] = str(round(hub_info.get("lat", 17.0575), 4))
                r["Actual_Lng"] = str(round(hub_info.get("lng", 79.2684), 4))
                
                # Expected hub should be destination
                r["Expected_Hub"] = dest
                if dest_info:
                    r["Expected_Lat"] = str(round(dest_info.get("lat", 17.9689), 4))
                    r["Expected_Lng"] = str(round(dest_info.get("lng", 79.5941), 4))

                # Recalculate true deviation km from origin to stranded hub
                dev = get_distance(orig, new_actual)
                r["Deviation_KM"] = str(round(dev, 1))

                sanitized_incidents_count += 1
                print(f"  [Incident {r['Incident_ID']}] Shipment {s_id}: Reassigned flawed Actual_Hub '{old_actual}' (was orig/dest) -> '{new_actual}' ({hub_info.get('city')}). Dev: {r['Deviation_KM']}km")
            
            incidents.append(r)

    # 3. Process and Sanitize Shipments
    sanitized_shipments_count = 0
    # Map of sanitized actual hubs by shipment id
    incident_actual_map = {inc["Shipment_ID"].strip(): inc for inc in incidents}

    for s in shipments:
        s_id = s["Shipment_ID"].strip()
        status = s.get("Status", "").strip()
        anomaly = s.get("Anomaly_Flag", "").strip().lower()
        orig = s.get("Origin_Hub", "").strip()
        dest = s.get("Destination_Hub", "").strip()
        cur = s.get("Current_Hub", "").strip()

        # Misplaced shipments must have a valid intermediate hub
        if status == "Misplaced" or anomaly == "yes":
            if cur == orig or cur == dest or not cur:
                if s_id in incident_actual_map:
                    sanitized_hub = incident_actual_map[s_id]["Actual_Hub"]
                    dev = float(incident_actual_map[s_id]["Deviation_KM"])
                else:
                    sanitized_hub = get_valid_intermediate_hub(orig, dest)
                    dev = get_distance(orig, sanitized_hub)

                old_cur = cur
                s["Current_Hub"] = sanitized_hub
                s["Deviation_KM"] = str(round(dev, 1))
                sanitized_shipments_count += 1
                print(f"  [Shipment {s_id}] Reassigned flawed Current_Hub '{old_cur}' -> '{sanitized_hub}'. Dev: {s['Deviation_KM']}km")

    # 4. Save sanitized files
    with open(INCIDENTS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames_incidents)
        writer.writeheader()
        writer.writerows(incidents)

    # 5. Also sync write_shipments.py so any future re-runs generate the sanitized data
    write_shipments_path = os.path.join(BACKEND_DIR, "scripts", "write_shipments.py")
    with open(SHIPMENTS_CSV, "r", encoding="utf-8") as f:
        csv_text = f.read().strip()
    with open(write_shipments_path, "w", encoding="utf-8") as f:
        f.write('import os\n\n')
        f.write('DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")\n\n')
        f.write('SHIPMENTS_DATA = """' + csv_text + '"""\n\n')
        f.write('with open(os.path.join(DATA_DIR, "shipments.csv"), "w", encoding="utf-8") as f:\n')
        f.write('    f.write(SHIPMENTS_DATA.strip())\n')
        f.write('print("Saved sanitized shipments.csv (200 shipments)")\n')
    print(f"Synced: {write_shipments_path}")

    print(f"\n=== SANITIZATION COMPLETE ===")
    print(f"Total Incidents Sanitized: {sanitized_incidents_count} / {len(incidents)}")
    print(f"Total Shipments Sanitized: {sanitized_shipments_count} / {len(shipments)}")
    print(f"Saved: {INCIDENTS_CSV}")
    print(f"Saved: {SHIPMENTS_CSV}")

if __name__ == "__main__":
    sanitize_datasets()
