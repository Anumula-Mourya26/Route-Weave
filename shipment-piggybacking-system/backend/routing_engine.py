import math
from typing import Dict, List, Tuple, Any
from config import TELANGANA_HUBS, HUB_MAP, HUB_BY_NAME

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on earth in kilometers"""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

# Curated road highway distances in Telangana (km)
HIGHWAY_DISTANCES = {
    ("H1", "H2"): 148.0,  # Hyderabad - Warangal (NH 163)
    ("H1", "H3"): 175.0,  # Hyderabad - Nizamabad (NH 44)
    ("H1", "H4"): 164.0,  # Hyderabad - Karimnagar (SH 1)
    ("H1", "H5"): 198.0,  # Hyderabad - Khammam (NH 65 & SH 42)
    ("H1", "H6"): 98.0,   # Hyderabad - Mahbubnagar (NH 44)
    ("H1", "H7"): 102.0,  # Hyderabad - Nalgonda (NH 65)
    ("H1", "H8"): 305.0,  # Hyderabad - Adilabad (NH 44)
    ("H7", "H2"): 135.0,  # Nalgonda - Warangal
    ("H6", "H1"): 98.0,   # Mahbubnagar - Hyderabad
    ("H4", "H3"): 145.0,  # Karimnagar - Nizamabad
    ("H4", "H2"): 75.0,   # Karimnagar - Warangal
    ("H5", "H2"): 115.0,  # Khammam - Warangal
    ("H5", "H7"): 88.0,   # Khammam - Nalgonda
    ("H3", "H8"): 155.0,  # Nizamabad - Adilabad
    ("H4", "H8"): 195.0,  # Karimnagar - Adilabad
}

def _canonical_hub_id(h: str) -> str:
    if not h:
        return ""
    s = str(h).strip().upper()
    if s in HUB_MAP:
        return HUB_MAP[s].get("hub_id", s)
    lower = str(h).strip().lower()
    if lower in HUB_BY_NAME:
        return HUB_BY_NAME[lower].get("hub_id", s)
    return s

def get_distance(h1: str, h2: str) -> float:
    c1 = _canonical_hub_id(h1)
    c2 = _canonical_hub_id(h2)
    if c1 == c2:
        return 0.0
        
    s1 = "H" + c1[2:] if c1.startswith("H0") else c1
    s2 = "H" + c2[2:] if c2.startswith("H0") else c2

    for k in [(c1, c2), (c2, c1), (s1, s2), (s2, s1)]:
        if k in HIGHWAY_DISTANCES:
            return HIGHWAY_DISTANCES[k]
    
    # Fallback to haversine with road winding factor of 1.25
    node1 = HUB_MAP.get(c1) or HUB_MAP.get(s1) or HUB_BY_NAME.get(str(h1).lower())
    node2 = HUB_MAP.get(c2) or HUB_MAP.get(s2) or HUB_BY_NAME.get(str(h2).lower())
    if node1 and node2:
        return round(haversine_distance(node1["lat"], node1["lng"], node2["lat"], node2["lng"]) * 1.25, 2)
    return 100.0

# Curated Intermediate Transfer/Transit Hubs along Major Corridors (~50km to destination or along trajectory)
CANONICAL_INTERMEDIATE_HUBS = {
    ("H01", "H02"): "H07",  # Hyderabad -> Warangal: Nalgonda Transfer (or H16 Bhongir)
    ("H02", "H01"): "H16",  # Warangal -> Hyderabad: Bhongir Hub (56km from Hyderabad)
    ("H03", "H01"): "H18",  # Nizamabad -> Hyderabad: Sangareddy Hub (62km from Hyderabad)
    ("H03", "H04"): "H11",  # Nizamabad -> Karimnagar: Jagtial Hub (57km from Karimnagar)
    ("H04", "H03"): "H11",  # Karimnagar -> Nizamabad: Jagtial Hub (60km from Nizamabad)
    ("H07", "H01"): "H16",  # Nalgonda -> Hyderabad: Bhongir Hub (56km from Hyderabad)
    ("H05", "H01"): "H16",  # Khammam -> Hyderabad: Bhongir Hub (56km from Hyderabad)
    ("H02", "H03"): "H10",  # Warangal -> Nizamabad: Siddipet Hub
    ("H07", "H04"): "H10",  # Nalgonda -> Karimnagar: Siddipet Hub (59km from Karimnagar)
    ("H07", "H03"): "H10",  # Nalgonda -> Nizamabad: Siddipet Hub
    ("H07", "H08"): "H04",  # Nalgonda -> Adilabad: Karimnagar Hub
    ("H07", "H05"): "H14",  # Nalgonda -> Khammam: Suryapet Hub (58km from Khammam)
    ("H07", "H02"): "H14",  # Nalgonda -> Warangal: Suryapet Hub
    ("H08", "H01"): "H03",  # Adilabad -> Hyderabad: Nizamabad Hub
    ("H08", "H02"): "H04",  # Adilabad -> Warangal: Karimnagar Hub (75km from Warangal)
    ("H08", "H04"): "H11",  # Adilabad -> Karimnagar: Jagtial Hub (57km from Karimnagar)
    ("H08", "H05"): "H02",  # Adilabad -> Khammam: Warangal Hub
    ("H06", "H01"): "H21",  # Mahbubnagar -> Hyderabad: Wanaparthy Hub
    ("H06", "H02"): "H07",  # Mahbubnagar -> Warangal: Nalgonda Transfer
    ("H05", "H04"): "H02",  # Khammam -> Karimnagar: Warangal Hub (75km from Karimnagar)
    ("H05", "H02"): "H14",  # Khammam -> Warangal: Suryapet Hub
    ("H04", "H08"): "H11",  # Karimnagar -> Adilabad: Jagtial Hub
    ("H01", "H03"): "H17",  # Hyderabad -> Nizamabad: Medak Hub (68km from Nizamabad)
    ("H01", "H04"): "H10",  # Hyderabad -> Karimnagar: Siddipet Hub (59km from Karimnagar)
    ("H01", "H05"): "H14",  # Hyderabad -> Khammam: Suryapet Hub (58km from Khammam)
    ("H01", "H06"): "H21",  # Hyderabad -> Mahbubnagar: Wanaparthy Hub
    ("H01", "H08"): "H04",  # Hyderabad -> Adilabad: Karimnagar Hub
}

def get_valid_intermediate_hub(origin: str, destination: str) -> str:
    """
    STRICT SPATIAL CONSTRAINT ENFORCEMENT:
    An Anomaly_Hub MUST NEVER equal Origin_Hub or Destination_Hub.
    The stranded location must occur at an intermediate transit/transfer hub
    located roughly 50km away from the destination, or logically situated
    along the originally intended route trajectory.
    """
    orig_id = _canonical_hub_id(origin)
    dest_id = _canonical_hub_id(destination)
    
    # 1. Check curated canonical corridor map
    pair = (orig_id, dest_id)
    if pair in CANONICAL_INTERMEDIATE_HUBS:
        candidate = CANONICAL_INTERMEDIATE_HUBS[pair]
        if candidate != orig_id and candidate != dest_id:
            return candidate

    # 2. Dynamic Corridor Trajectory & 50km Proximity Optimization
    direct_dist = max(1.0, get_distance(orig_id, dest_id))
    candidates = []

    for hub in TELANGANA_HUBS:
        hid = hub["hub_id"]
        # HARD CONSTRAINT: Must NEVER equal Origin or Destination
        if hid == orig_id or hid == dest_id:
            continue
        # Restrict to Telangana regional hubs (H01-H25) unless origin/dest is outside
        try:
            num = int(hid[1:])
            if num > 25:
                continue
        except ValueError:
            pass

        d_orig = get_distance(orig_id, hid)
        d_dest = get_distance(hid, dest_id)
        total_d = d_orig + d_dest
        detour_ratio = total_d / direct_dist

        # Spatial score:
        # - Penalize deviation from direct trajectory (detour_ratio > 1.0)
        # - Target roughly 50km from destination (|d_dest - 50.0|)
        # - Bonus for transit / transfer hubs
        dist_diff_50 = abs(d_dest - 50.0)
        score = (dist_diff_50 * 1.5) + (max(0.0, detour_ratio - 1.0) * 45.0)
        
        hub_type = hub.get("type", "").lower()
        if hub_type in ("transfer_hub", "transit"):
            score -= 12.0

        candidates.append((score, hid))

    if candidates:
        candidates.sort(key=lambda x: x[0])
        return candidates[0][1]

    # Extreme fallback that is guaranteed != orig_id and != dest_id
    for fallback in ["H07", "H16", "H14", "H10", "H11", "H18"]:
        if fallback != orig_id and fallback != dest_id:
            return fallback
    return "H07"

# Realistic Highway Road Corridors in Telangana (NH 44, NH 65, NH 163, SH 1, SH 24)
HIGHWAY_CORRIDOR_GEOMETRIES: Dict[Tuple[str, str], List[List[float]]] = {
    # NH 163: Hyderabad (H1) -> Warangal (H2)
    ("H1", "H2"): [
        [17.3850, 78.4867], [17.4022, 78.5601], [17.4475, 78.6811], 
        [17.5111, 78.8912], [17.6534, 79.0494], [17.7249, 79.1764], 
        [17.8488, 79.3512], [17.9782, 79.5218], [17.9689, 79.5941]
    ],
    # NH 65: Hyderabad (H1) -> Nalgonda (H7)
    ("H1", "H7"): [
        [17.3850, 78.4867], [17.3524, 78.5523], [17.3242, 78.6012], 
        [17.2519, 78.8967], [17.1852, 79.0521], [17.1524, 79.1350], 
        [17.1264, 79.1982], [17.0575, 79.2684]
    ],
    # SH 24 / NH 365: Nalgonda (H7) -> Warangal (H2)
    ("H7", "H2"): [
        [17.0575, 79.2684], [17.1250, 79.4120], [17.1685, 79.4286], 
        [17.3120, 79.4890], [17.4250, 79.5120], [17.5320, 79.5410], 
        [17.6890, 79.5820], [17.8420, 79.5910], [17.9689, 79.5941]
    ],
    # NH 44: Mahbubnagar (H6) -> Hyderabad (H1)
    ("H6", "H1"): [
        [16.7488, 77.9856], [16.7725, 78.1362], [16.9421, 78.2145], 
        [17.0682, 78.2089], [17.1420, 78.2910], [17.2543, 78.3982], 
        [17.3210, 78.4350], [17.3850, 78.4867]
    ],
    # SH 1 Rajiv Rahadari: Hyderabad (H1) -> Karimnagar (H4)
    ("H1", "H4"): [
        [17.3850, 78.4867], [17.5925, 78.5684], [17.8542, 78.6821], 
        [18.1018, 78.8520], [18.2140, 78.9510], [18.3120, 79.0340], 
        [18.4386, 79.1288]
    ],
    # NH 44: Hyderabad (H1) -> Nizamabad (H3)
    ("H1", "H3"): [
        [17.3850, 78.4867], [17.6321, 78.4812], [17.8521, 78.4720], 
        [18.0410, 78.4320], [18.1120, 78.3910], [18.3210, 78.3410], 
        [18.4820, 78.2510], [18.6725, 78.0941]
    ],
    # NH 44 / SH: Karimnagar (H4) -> Adilabad (H8)
    ("H4", "H8"): [
        [18.4386, 79.1288], [18.7952, 78.9142], [18.8210, 78.7120], 
        [18.8310, 78.5910], [18.7910, 78.2910], [19.0964, 78.3421], 
        [19.4210, 78.4520], [19.6641, 78.5320]
    ],
    # NH 44: Nizamabad (H3) -> Adilabad (H8)
    ("H3", "H8"): [
        [18.6725, 78.0941], [18.7910, 78.2910], [18.8820, 78.3420], 
        [19.0120, 78.3210], [19.0964, 78.3421], [19.5310, 78.5120], 
        [19.6641, 78.5320]
    ],
    # NH 65 & SH 42: Hyderabad (H1) -> Khammam (H5)
    ("H1", "H5"): [
        [17.3850, 78.4867], [17.2519, 78.8967], [17.1524, 79.1350], 
        [17.1439, 79.6239], [17.0910, 79.7820], [17.1820, 79.9810], 
        [17.2473, 80.1514]
    ],
    # Karimnagar (H4) -> Warangal (H2)
    ("H4", "H2"): [
        [18.4386, 79.1288], [18.4010, 79.1920], [18.1912, 79.3951], 
        [18.1210, 79.4420], [18.0520, 79.5210], [17.9689, 79.5941]
    ],
    # Khammam (H5) -> Warangal (H2)
    ("H5", "H2"): [
        [17.2473, 80.1514], [17.2810, 80.0120], [17.5982, 80.0021], 
        [17.9251, 79.8912], [17.9689, 79.5941]
    ],
    # Khammam (H5) -> Nalgonda (H7)
    ("H5", "H7"): [
        [17.2473, 80.1514], [17.1439, 79.6239], [17.1685, 79.4286], 
        [17.0575, 79.2684]
    ],
    # Karimnagar (H4) -> Nizamabad (H3)
    ("H4", "H3"): [
        [18.4386, 79.1288], [18.7952, 78.9142], [18.8210, 78.7120], 
        [18.7910, 78.2910], [18.6725, 78.0941]
    ]
}

def generate_interpolated_waypoints(start_lat: float, start_lng: float, end_lat: float, end_lng: float, steps: int = 15) -> List[List[float]]:
    coords = []
    for i in range(steps + 1):
        t = i / float(steps)
        lat = start_lat + t * (end_lat - start_lat)
        lng = start_lng + t * (end_lng - start_lng)
        # Add realistic natural curve along topography
        curvature = 0.018 * math.sin(t * math.pi)
        coords.append([round(lat + curvature, 5), round(lng - curvature, 5)])
    return coords

def get_segment_waypoints(h1_id: str, h2_id: str) -> List[List[float]]:
    """Returns precise highway geometry between two hubs, or curved fallback."""
    if (h1_id, h2_id) in HIGHWAY_CORRIDOR_GEOMETRIES:
        return [list(pt) for pt in HIGHWAY_CORRIDOR_GEOMETRIES[(h1_id, h2_id)]]
    if (h2_id, h1_id) in HIGHWAY_CORRIDOR_GEOMETRIES:
        # Reverse geometry for opposite direction
        return [list(pt) for pt in reversed(HIGHWAY_CORRIDOR_GEOMETRIES[(h2_id, h1_id)])]
    
    node1 = HUB_MAP.get(h1_id) or HUB_BY_NAME.get(h1_id.lower())
    node2 = HUB_MAP.get(h2_id) or HUB_BY_NAME.get(h2_id.lower())
    if node1 and node2:
        return generate_interpolated_waypoints(node1["lat"], node1["lng"], node2["lat"], node2["lng"])
    return []

def get_route_waypoints(hub_ids: List[str]) -> List[List[float]]:
    all_points = []
    for i in range(len(hub_ids) - 1):
        h1 = HUB_MAP.get(hub_ids[i]) or HUB_BY_NAME.get(hub_ids[i].lower())
        h2 = HUB_MAP.get(hub_ids[i+1]) or HUB_BY_NAME.get(hub_ids[i+1].lower())
        h1_id = h1["hub_id"] if h1 else hub_ids[i]
        h2_id = h2["hub_id"] if h2 else hub_ids[i+1]
        seg = get_segment_waypoints(h1_id, h2_id)
        if not seg and h1 and h2:
            seg = generate_interpolated_waypoints(h1["lat"], h1["lng"], h2["lat"], h2["lng"])
        if seg:
            if all_points:
                seg = seg[1:]  # avoid duplicate vertex
            all_points.extend(seg)
    return all_points
