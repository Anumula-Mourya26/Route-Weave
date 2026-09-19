import React, { useMemo, useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Eye, Crosshair, Navigation, Truck, Zap } from 'lucide-react';

// Real-world Highway Corridors (Telangana National & State Highways: NH 163, NH 65, NH 44, SH 1, SH 24)
const HIGHWAY_GEOMETRIES = {
  // NH 163: Hyderabad (H01) -> Warangal (H02)
  "H01-H02": [
    [17.3850, 78.4867], [17.4022, 78.5601], [17.4475, 78.6811], 
    [17.5111, 78.8912], [17.6534, 79.0494], [17.7249, 79.1764], 
    [17.8488, 79.3512], [17.9782, 79.5218], [17.9689, 79.5941]
  ],
  // NH 65: Hyderabad (H01) -> Nalgonda (H07)
  "H01-H07": [
    [17.3850, 78.4867], [17.3524, 78.5523], [17.3242, 78.6012], 
    [17.2519, 78.8967], [17.1852, 79.0521], [17.1524, 79.1350], 
    [17.1264, 79.1982], [17.0575, 79.2684]
  ],
  // SH 24 / NH 365: Nalgonda (H07) -> Warangal (H02)
  "H07-H02": [
    [17.0575, 79.2684], [17.1250, 79.4120], [17.1685, 79.4286], 
    [17.3120, 79.4890], [17.4250, 79.5120], [17.5320, 79.5410], 
    [17.6890, 79.5820], [17.8420, 79.5910], [17.9689, 79.5941]
  ],
  // NH 44: Mahbubnagar (H06) -> Hyderabad (H01)
  "H06-H01": [
    [16.7488, 77.9850], [16.7725, 78.1362], [16.9421, 78.2145], 
    [17.0682, 78.2089], [17.1420, 78.2910], [17.2543, 78.3982], 
    [17.3210, 78.4350], [17.3850, 78.4867]
  ],
  // SH 1 Rajiv Rahadari: Hyderabad (H01) -> Karimnagar (H04)
  "H01-H04": [
    [17.3850, 78.4867], [17.5925, 78.5684], [17.8542, 78.6821], 
    [18.1018, 78.8520], [18.2140, 78.9510], [18.3120, 79.0340], 
    [18.4386, 79.1288]
  ],
  // NH 44 North: Hyderabad (H01) -> Nizamabad (H03)
  "H01-H03": [
    [17.3850, 78.4867], [17.6321, 78.4812], [17.8521, 78.4720], 
    [18.0410, 78.4320], [18.1120, 78.3910], [18.3210, 78.3410], 
    [18.4820, 78.2510], [18.6725, 78.0941]
  ],
  // NH 44 North: Nizamabad (H03) -> Adilabad (H08)
  "H03-H08": [
    [18.6725, 78.0941], [18.7910, 78.2910], [18.8820, 78.3420], 
    [19.0120, 78.3210], [19.0964, 78.3421], [19.5310, 78.5120], 
    [19.6640, 78.5320]
  ],
  // NH 65 & SH 42: Hyderabad (H01) -> Khammam (H05)
  "H01-H05": [
    [17.3850, 78.4867], [17.2519, 78.8967], [17.1524, 79.1350], 
    [17.1439, 79.6239], [17.0910, 79.7820], [17.1820, 79.9810], 
    [17.2473, 80.1514]
  ],
  // Karimnagar (H04) -> Warangal (H02)
  "H04-H02": [
    [18.4386, 79.1288], [18.4010, 79.1920], [18.1912, 79.3951], 
    [18.1210, 79.4420], [18.0520, 79.5210], [17.9689, 79.5941]
  ],
  // Khammam (H05) -> Warangal (H02)
  "H05-H02": [
    [17.2473, 80.1514], [17.2810, 80.0120], [17.5982, 80.0021], 
    [17.9251, 79.8912], [17.9689, 79.5941]
  ],
  // Khammam (H05) -> Nalgonda (H07)
  "H05-H07": [
    [17.2473, 80.1514], [17.1439, 79.6239], [17.1685, 79.4286], 
    [17.0575, 79.2684]
  ]
};

// Default Master Coordinates for all Telangana Hubs to ensure zero missing coordinates
const DEFAULT_HUB_COORDS = {
  'H01': [17.3850, 78.4867], // Hyderabad Central
  'H02': [17.9689, 79.5941], // Warangal Hub
  'H03': [18.6725, 78.0941], // Nizamabad Hub
  'H04': [18.4386, 79.1288], // Karimnagar Hub
  'H05': [17.2473, 80.1514], // Khammam Hub
  'H06': [16.7488, 77.9850], // Mahbubnagar Hub
  'H07': [17.0575, 79.2684], // Nalgonda Transfer
  'H08': [19.6640, 78.5320], // Adilabad Hub
  'H09': [18.7557, 79.5127], // Ramagundam Hub
  'H10': [18.1018, 78.8520], // Siddipet Hub
  'H11': [18.7910, 78.9120], // Jagtial Hub
  'H12': [18.8710, 79.4520], // Mancherial Hub
  'H13': [17.5510, 80.6210], // Kothagudem Hub
  'H14': [17.1439, 79.6239], // Suryapet Hub
  'H15': [16.8720, 79.5620], // Miryalaguda Hub
  'H16': [17.5111, 78.8912], // Bhongir Hub
  'H17': [18.0410, 78.2610], // Medak Hub
  'H18': [17.6210, 78.0810], // Sangareddy Hub
  'H19': [17.6810, 77.6110], // Zaheerabad Hub
  'H20': [16.2310, 77.8010], // Gadwal Hub
  'H26': [12.9716, 77.5946], // Bengaluru Hub
  'H27': [13.0827, 80.2707], // Chennai Hub
};

// Generates smooth realistic highway curves between any two points
function generateRoadCurve(p1, p2, steps = 12) {
  const pts = [];
  const [lat1, lng1] = p1;
  const [lat2, lng2] = p2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = lat1 + t * (lat2 - lat1);
    const lng = lng1 + t * (lng2 - lng1);
    const curve = 0.02 * Math.sin(t * Math.PI);
    pts.push([parseFloat((lat + curve).toFixed(5)), parseFloat((lng - curve).toFixed(5))]);
  }
  return pts;
}

// Get realistic road geometry between two hubs with safe fallbacks
function getRoadGeometry(h1, h2, hubMap = {}) {
  if (!h1 || !h2 || h1 === h2) return [];
  const key1 = `${h1}-${h2}`;
  const key2 = `${h2}-${h1}`;
  if (HIGHWAY_GEOMETRIES[key1]) return HIGHWAY_GEOMETRIES[key1];
  if (HIGHWAY_GEOMETRIES[key2]) return [...HIGHWAY_GEOMETRIES[key2]].reverse();
  
  const p1 = hubMap[h1] || DEFAULT_HUB_COORDS[h1];
  const p2 = hubMap[h2] || DEFAULT_HUB_COORDS[h2];
  if (p1 && p2) return generateRoadCurve(p1, p2);
  return [];
}

// Controls Leaflet map size invalidation, smooth camera transitions, and fitting corridor bounds
function MapController({ bounds, stage, isFocusMode }) {
  const map = useMap();
  useEffect(() => {
    // Invalidate size immediately so Leaflet recalculates correct container dimensions
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (bounds && bounds.length >= 2) {
        try {
          map.fitBounds(bounds, { 
            padding: [50, 50], 
            maxZoom: isFocusMode ? 10.5 : 8.5,
            animate: true,
            duration: 0.75
          });
        } catch (e) {
          // ignore transient geometry race conditions
        }
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [bounds, stage, map, isFocusMode]);
  return null;
}

// Custom Hub Marker
function createHubIcon(hub, isKeyFocus = false) {
  const isTransfer = hub.type === 'transfer_hub' || hub.hub_id === 'H07' || hub.hub_id === 'H7';
  const bg = isKeyFocus ? '#7c3aed' : (isTransfer ? '#fef3c7' : '#f0fdf4');
  const color = isKeyFocus ? '#ffffff' : (isTransfer ? '#b45309' : '#166534');
  const border = isKeyFocus ? '#ffffff' : (isTransfer ? '#f59e0b' : '#22c55e');

  return L.divIcon({
    className: 'custom-hub-icon',
    html: `
      <div style="
        display: flex;
        align-items: center;
        gap: 5px;
        background: ${bg};
        color: ${color};
        border: 2px solid ${border};
        border-radius: 8px;
        padding: 3px 8px;
        font-weight: 800;
        font-size: 11px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, ${isKeyFocus ? '0.35' : '0.1'});
        white-space: nowrap;
        transform: scale(${isKeyFocus ? '1.15' : '1.0'});
      ">
        <span>${isTransfer ? '🔄' : '🏢'}</span>
        <span>${hub.name || hub.city || hub.hub_id}</span>
      </div>
    `,
    iconSize: [120, 26],
    iconAnchor: [60, 13]
  });
}

// Custom Truck Marker
function createTruckIcon(truck, isMatched = false) {
  const bg = isMatched ? '#7c3aed' : '#2563eb';
  const border = isMatched ? '#c4b5fd' : '#93c5fd';
  return L.divIcon({
    className: 'custom-truck-icon',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: ${bg};
        border: 2.5px solid ${border};
        border-radius: 50%;
        color: #ffffff;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        cursor: pointer;
        transform: scale(${isMatched ? '1.25' : '1.0'});
      ">
        🚚
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

// Anomaly Marker Icon (Pulsing Red Dot)
function createAnomalyIcon() {
  return L.divIcon({
    className: 'custom-anomaly-icon',
    html: `
      <div style="position: relative; width: 38px; height: 38px;">
        <div style="
          position: absolute;
          top: -8px;
          left: -8px;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.4);
          animation: pulse-ring 1.3s cubic-bezier(0.2, 0.6, 0.35, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 38px;
          height: 38px;
          background: #ef4444;
          border: 3px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
          cursor: pointer;
        ">
          🚨
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
}

// State 2: Candidate Nearby Truck Marker Icon (Amber Proximity Badge)
function createNearbyTruckIcon(truck) {
  return L.divIcon({
    className: 'custom-nearby-truck-icon',
    html: `
      <div style="position: relative; width: 36px; height: 36px;">
        <div style="
          position: absolute;
          top: -4px;
          left: -4px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.35);
          animation: pulse-ring 1.8s cubic-bezier(0.2, 0.6, 0.35, 1) infinite;
        "></div>
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: #d97706;
          border: 2.5px solid #fef3c7;
          border-radius: 50%;
          color: #ffffff;
          font-size: 15px;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.55);
          cursor: pointer;
        ">
          🚚
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

// Distance Calculation Helper for Proximity Querying
function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10;
}

export default function NetworkMap({ 
  hubs = [], 
  trucks = [], 
  anomalyActive = false, 
  anomalyData = null, 
  matchedTruck = null,
  corridorWaypoints = [],
  recoveryExecuted = false,
  aiSolved = false,
  mapStage = null,
  isControlCenter = false,
  height = "450px",
  hideOverlayLegend = false,
  hideControls = false
}) {
  const [globalViewMode, setGlobalViewMode] = useState(false);

  // Normalize Hub Map (combines API hubs with master Telangana defaults)
  const hubMap = useMemo(() => {
    const map = { ...DEFAULT_HUB_COORDS };
    hubs.forEach(h => {
      const lat = parseFloat(h.lat);
      const lng = parseFloat(h.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const latLng = [lat, lng];
        map[h.hub_id] = latLng;
        if (h.hub_id.startsWith('H0')) {
          map['H' + h.hub_id[2]] = latLng;
        }
        if (h.name) map[h.name.toLowerCase()] = latLng;
        if (h.city) map[h.city.toLowerCase()] = latLng;
      }
    });
    return map;
  }, [hubs]);

  // Extract Anomaly Hub IDs
  const originHubId = anomalyData?.origin_hub || 'H01';
  const destHubId = anomalyData?.destination_hub || 'H02';
  const strandedHubId = anomalyData?.stranded_hub || anomalyData?.current_hub || 'H07';

  // Persistent cache to preserve calculated route polylines after plan acceptance
  const cachedRoutesRef = useRef({
    deviationRoute: null,
    originalIntendedRoute: null,
    optimizedRecoveryRoute: null,
  });

  // Helper to canonicalize Hub ID
  const canonicalHub = (id) => {
    if (!id) return '';
    const s = String(id).trim();
    const match = s.match(/H\d+/i);
    if (match) {
      const c = match[0].toUpperCase();
      return c.length === 2 ? `H0${c[1]}` : c;
    }
    const lower = s.toLowerCase();
    if (lower.includes('hyd')) return 'H01';
    if (lower.includes('war')) return 'H02';
    if (lower.includes('nal')) return 'H07';
    if (lower.includes('kha')) return 'H05';
    if (lower.includes('kar')) return 'H04';
    if (lower.includes('niz')) return 'H03';
    if (lower.includes('mah')) return 'H06';
    if (lower.includes('adi')) return 'H08';
    if (lower.includes('ram')) return 'H09';
    if (lower.includes('sid')) return 'H10';
    if (lower.includes('sur')) return 'H14';
    if (lower.includes('mir')) return 'H15';
    return s;
  };

  // Safe intermediate stranded hub resolver (guarantees stranded is distinct from origin & destination)
  const resolveStrandedHub = (orig, dest, requestedStranded) => {
    const s = canonicalHub(requestedStranded);
    if (s && s !== orig && s !== dest) return s;
    if ((orig === 'H01' && dest === 'H02') || (orig === 'H02' && dest === 'H01')) return 'H07';
    if ((orig === 'H01' && dest === 'H04') || (orig === 'H04' && dest === 'H01')) return 'H10';
    if ((orig === 'H01' && dest === 'H03') || (orig === 'H03' && dest === 'H01')) return 'H18';
    if ((orig === 'H01' && dest === 'H05') || (orig === 'H05' && dest === 'H01')) return 'H14';
    if ((orig === 'H06' && dest === 'H02')) return 'H07';
    if ((orig === 'H03' && dest === 'H08')) return 'H11';
    return orig === 'H07' || dest === 'H07' ? 'H14' : 'H07';
  };

  const normOrigin = canonicalHub(originHubId) || 'H01';
  const normDest = canonicalHub(destHubId) || 'H02';
  const normStranded = resolveStrandedHub(normOrigin, normDest, strandedHubId);

  const [persistedAccepted, setPersistedAccepted] = useState(false);

  useEffect(() => {
    if (
      recoveryExecuted || 
      anomalyData?.is_recovery_accepted || 
      anomalyData?.recovery_plan_accepted || 
      anomalyData?.shipment_status === 'Recovered' || 
      anomalyData?.shipment_status === 'Accepted'
    ) {
      setPersistedAccepted(true);
    }
  }, [recoveryExecuted, anomalyData]);

  // =========================================================================
  // PROGRESSIVE 3-STAGE STATE RESOLUTION
  // State 1: Pre-Anomaly (Normal View)
  // State 2: Post-Anomaly (Stranded View - cleared polylines, candidate trucks)
  // State 3: Post-Recovery (AI Solved / Plan Accepted - Red, Blue, Green paths + matched truck)
  // =========================================================================
  const isRecoveryAccepted = Boolean(
    persistedAccepted ||
    recoveryExecuted || 
    anomalyData?.is_recovery_accepted || 
    anomalyData?.recovery_plan_accepted || 
    anomalyData?.shipment_status === 'Recovered' || 
    anomalyData?.shipment_status === 'Accepted'
  );

  const isMisplaced = Boolean(anomalyData?.shipment_status === 'Misplaced' || anomalyData?.is_misplaced || anomalyActive);
  const isSolved = Boolean(aiSolved || recoveryExecuted || isRecoveryAccepted);

  const resolvedStage = useMemo(() => {
    // If recovery plan accepted or AI solved, strictly resolve to Stage 3 to show all 3 routes
    if (isRecoveryAccepted || isSolved) return 3;
    if (mapStage === 1 || mapStage === 2 || mapStage === 3) return mapStage;
    if (isMisplaced) return 2;
    return 1;
  }, [mapStage, isMisplaced, isSolved, isRecoveryAccepted]);

  const isFocusMode = !globalViewMode;

  // Filtered Hubs strictly adhering to stage logic
  const visibleHubs = useMemo(() => {
    if (globalViewMode) return hubs;
    if (resolvedStage === 1 && !isRecoveryAccepted) {
      const stage1Ids = new Set([normOrigin, normDest]);
      return hubs.filter(h => stage1Ids.has(canonicalHub(h.hub_id)));
    }
    // Stage 2 & 3: Origin Hub, Destination Hub, Stranded Hub
    const focusIds = new Set([normOrigin, normDest, normStranded]);
    return hubs.filter(h => focusIds.has(canonicalHub(h.hub_id)));
  }, [hubs, globalViewMode, resolvedStage, normOrigin, normDest, normStranded, isRecoveryAccepted]);

  // Filtered Trucks strictly adhering to progressive stage logic
  const visibleTrucks = useMemo(() => {
    if (globalViewMode) return trucks;
    
    // State 1: Pre-Anomaly (Intended Route) -> Zero truck markers in route preview
    if (resolvedStage === 1 && !isRecoveryAccepted) {
      return [];
    }

    // State 2: Post-Disruption (Stranded Location + Nearest Available Trucks)
    // Dynamically queries the vehicles database to render map markers specifically
    // showing the nearest available trucks currently located around the disruption area.
    if (resolvedStage === 2 && !isRecoveryAccepted) {
      const strandedCoords = hubMap[normStranded] || [17.0575, 79.2684];
      const cargoWeight = Number(anomalyData?.weight_tons) || 4.5;

      const candidates = trucks.map(t => {
        const lat = parseFloat(t.current_lat);
        const lng = parseFloat(t.current_lng);
        if (isNaN(lat) || isNaN(lng)) return null;
        const dist = getHaversineDistanceKm(strandedCoords[0], strandedCoords[1], lat, lng);
        const spare = parseFloat(t.spare_capacity_tons) || 0;
        return {
          ...t,
          distance_to_stranded_km: dist,
          has_capacity: spare >= cargoWeight,
          is_candidate: true
        };
      }).filter(Boolean);

      // Prioritize available spare capacity match first, then closest distance
      candidates.sort((a, b) => {
        if (a.has_capacity && !b.has_capacity) return -1;
        if (!a.has_capacity && b.has_capacity) return 1;
        return a.distance_to_stranded_km - b.distance_to_stranded_km;
      });

      // Show top 3-4 nearest available candidate trucks around disruption area
      return candidates.slice(0, 4);
    }

    // State 3: Post-Recovery (AI Solved View / Plan Accepted) -> ONLY display the newly matched truck
    if (resolvedStage === 3 || isRecoveryAccepted) {
      const matchedId = matchedTruck?.truck_id || matchedTruck?.vehicle_id || 'TRK-004';
      const matched = trucks.filter(t => 
        t.truck_id === matchedId || 
        t.vehicle_id === matchedId || 
        (t.aliases && t.aliases.includes(matchedId))
      );
      if (matched.length > 0) return matched;
      return matchedTruck ? [matchedTruck] : [];
    }
    return [];
  }, [trucks, globalViewMode, resolvedStage, matchedTruck, hubMap, normStranded, anomalyData, isRecoveryAccepted]);

  // Regular fleet roads (only for Global Fleet mode)
  const regularRoads = useMemo(() => {
    if (!globalViewMode) return [];
    return trucks.slice(0, 15).map((t, idx) => {
      const r = t.route || [];
      if (r.length < 2) return null;
      const pts = [];
      for (let i = 0; i < r.length - 1; i++) {
        const seg = getRoadGeometry(canonicalHub(r[i]), canonicalHub(r[i+1]), hubMap);
        if (seg.length > 0) {
          pts.push(...(pts.length > 0 ? seg.slice(1) : seg));
        }
      }
      if (pts.length < 2) return null;
      return {
        id: `${t.truck_id}-${idx}`,
        positions: pts,
        color: '#94a3b8',
        weight: 2.5,
        dashArray: '3, 4'
      };
    }).filter(Boolean);
  }, [trucks, hubMap, globalViewMode]);

  // ---------------------------------------------------------------------------
  // STATE 1 POLYLINE: Originally intended route from Origin to Destination
  // ---------------------------------------------------------------------------
  const intendedRoute = useMemo(() => {
    if (globalViewMode || resolvedStage !== 1 || isRecoveryAccepted) return null;
    return getRoadGeometry(normOrigin, normDest, hubMap);
  }, [globalViewMode, resolvedStage, normOrigin, normDest, hubMap, isRecoveryAccepted]);

  // ---------------------------------------------------------------------------
  // STATE 3 POLYLINES (Post-Recovery AI Solved / Plan Accepted View):
  // 1. Red path (Deviation/Stranded): Origin_Hub to intermediate Anomaly_Hub
  // 2. Blue path (Original Intended Route): Origin_Hub directly bypassing anomaly to Destination_Hub
  // 3. Green path (AI Solved Recovery): mid-point Anomaly_Hub strictly to Destination_Hub
  // ---------------------------------------------------------------------------
  const deviationRoute = useMemo(() => {
    if (globalViewMode) return null;
    if (resolvedStage !== 3 && !isRecoveryAccepted) return null;
    const geom = getRoadGeometry(normOrigin, normStranded, hubMap);
    const route = geom.length > 0 ? geom : getRoadGeometry('H01', 'H07', hubMap);
    if (route && route.length > 0) cachedRoutesRef.current.deviationRoute = route;
    return route || cachedRoutesRef.current.deviationRoute;
  }, [globalViewMode, resolvedStage, normOrigin, normStranded, hubMap, isRecoveryAccepted]);

  const originalIntendedRoute = useMemo(() => {
    if (globalViewMode) return null;
    if (resolvedStage !== 3 && !isRecoveryAccepted) return null;
    const geom = getRoadGeometry(normOrigin, normDest, hubMap);
    const route = geom.length > 0 ? geom : getRoadGeometry('H01', 'H02', hubMap);
    if (route && route.length > 0) cachedRoutesRef.current.originalIntendedRoute = route;
    return route || cachedRoutesRef.current.originalIntendedRoute;
  }, [globalViewMode, resolvedStage, normOrigin, normDest, hubMap, isRecoveryAccepted]);

  const optimizedRecoveryRoute = useMemo(() => {
    if (globalViewMode) return null;
    if (resolvedStage !== 3 && !isRecoveryAccepted) return null;
    const geom = getRoadGeometry(normStranded, normDest, hubMap);
    const route = geom.length > 0 ? geom : getRoadGeometry('H07', 'H02', hubMap);
    if (route && route.length > 0) cachedRoutesRef.current.optimizedRecoveryRoute = route;
    return route || cachedRoutesRef.current.optimizedRecoveryRoute;
  }, [globalViewMode, resolvedStage, normStranded, normDest, hubMap, isRecoveryAccepted]);

  // Explicit route polylines array strictly managing map states
  // State 1: Single Blue/Indigo Intended Route
  // State 2: Empty array (zero polylines)
  // State 3 / Accepted: Exactly 3 polylines (Red Deviation, Blue Intended, Green Recovery)
  const routePolylines = useMemo(() => {
    if (globalViewMode) return [];

    // State 3 / Recovery Accepted: ALWAYS retain and persistently display all 3 polylines
    if (resolvedStage === 3 || isRecoveryAccepted) {
      const polylines = [];

      // 1. RED: Deviation / Stranded path (Origin to Stranded Hub)
      const red = deviationRoute || cachedRoutesRef.current.deviationRoute || getRoadGeometry(normOrigin, normStranded, hubMap) || getRoadGeometry('H01', 'H07', hubMap);
      if (red && red.length > 1) {
        cachedRoutesRef.current.deviationRoute = red;
        polylines.push({
          id: 'route-red-deviation',
          positions: red,
          color: '#ef4444',
          weight: 5,
          opacity: 0.95,
          tooltip: `🔴 Red: Deviation/Stranded (${normOrigin} ➔ ${normStranded})`,
          tooltipClass: 'bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 shadow-sm'
        });
      }

      // 2. BLUE: Original Intended Route (Origin directly to Destination)
      const blue = originalIntendedRoute || cachedRoutesRef.current.originalIntendedRoute || getRoadGeometry(normOrigin, normDest, hubMap) || getRoadGeometry('H01', 'H02', hubMap);
      if (blue && blue.length > 1) {
        cachedRoutesRef.current.originalIntendedRoute = blue;
        polylines.push({
          id: 'route-blue-original',
          positions: blue,
          color: '#2563eb',
          weight: 4.5,
          dashArray: '6, 6',
          opacity: 0.85,
          tooltip: `🔵 Blue: Original Intended Route (${normOrigin} ➔ ${normDest})`,
          tooltipClass: 'bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 shadow-sm'
        });
      }

      // 3. GREEN: Newly Changed, AI Solved Recovery (Stranded Hub to Destination)
      const green = optimizedRecoveryRoute || cachedRoutesRef.current.optimizedRecoveryRoute || getRoadGeometry(normStranded, normDest, hubMap) || getRoadGeometry('H07', 'H02', hubMap);
      if (green && green.length > 1) {
        cachedRoutesRef.current.optimizedRecoveryRoute = green;
        polylines.push({
          id: 'route-green-recovery',
          positions: green,
          color: '#10b981',
          weight: 6,
          opacity: 0.95,
          tooltip: `🟢 Green: ${isRecoveryAccepted ? 'Dispatched Piggyback Recovery' : 'AI Solved Recovery'} (${normStranded} ➔ ${normDest})`,
          tooltipClass: 'bg-emerald-50 text-emerald-800 font-black border border-emerald-300 shadow-md'
        });
      }

      return polylines;
    }

    // State 2: Post-Disruption -> Zero polylines drawn
    if (resolvedStage === 2 && !isRecoveryAccepted) {
      return [];
    }

    // State 1: Pre-Disruption -> Single Blue route
    if (resolvedStage === 1 && !isRecoveryAccepted) {
      const standard = intendedRoute || cachedRoutesRef.current.originalIntendedRoute || getRoadGeometry(normOrigin, normDest, hubMap) || getRoadGeometry('H01', 'H02', hubMap);
      if (standard && standard.length > 1) {
        return [{
          id: 'route-standard-intended',
          positions: standard,
          color: '#4f46e5',
          weight: 4.5,
          opacity: 0.9,
          tooltip: `Standard Intended Route: ${normOrigin} ➔ ${normDest}`,
          tooltipClass: 'bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-sm'
        }];
      }
    }

    return [];
  }, [globalViewMode, resolvedStage, isRecoveryAccepted, deviationRoute, originalIntendedRoute, optimizedRecoveryRoute, intendedRoute, normOrigin, normDest, normStranded, hubMap]);

  // Calculate Map Bounds
  const mapBounds = useMemo(() => {
    if (globalViewMode) {
      return hubs.map(h => [parseFloat(h.lat), parseFloat(h.lng)]).filter(c => !isNaN(c[0]));
    }
    if (resolvedStage === 1 && !isRecoveryAccepted) {
      const p1 = hubMap[normOrigin] || [17.3850, 78.4867];
      const p2 = hubMap[normDest] || [17.9689, 79.5941];
      return [p1, p2];
    }
    if (resolvedStage === 2 && !isRecoveryAccepted) {
      const p1 = hubMap[normOrigin] || [17.3850, 78.4867];
      const p2 = hubMap[normStranded] || [17.0575, 79.2684];
      const p3 = hubMap[normDest] || [17.9689, 79.5941];
      const truckPts = visibleTrucks
        .map(t => [parseFloat(t.current_lat), parseFloat(t.current_lng)])
        .filter(c => !isNaN(c[0]) && !isNaN(c[1]));
      return [p1, p2, p3, ...truckPts];
    }
    // Stage 3 / Recovery Accepted: Bounds encompass Origin, Stranded, and Destination
    const p1 = hubMap[normOrigin] || [17.3850, 78.4867];
    const p2 = hubMap[normStranded] || [17.0575, 79.2684];
    const p3 = hubMap[normDest] || [17.9689, 79.5941];
    return [p1, p2, p3];
  }, [globalViewMode, resolvedStage, hubs, hubMap, normOrigin, normStranded, normDest, visibleTrucks, isRecoveryAccepted]);

  const defaultCenter = [17.65, 79.15];
  const defaultZoom = 8.0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white" style={{ height }}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.9; }
          50% { transform: scale(1.6); opacity: 0.3; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Floating Modern HUD */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm text-xs flex items-center gap-2.5">
        <span className="font-bold text-gray-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Telangana Logistics Network
        </span>
        <span className="text-gray-300">|</span>
        
        {/* Progressive Stage Badge */}
        {!globalViewMode && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
            (resolvedStage === 1 && !isRecoveryAccepted)
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : (resolvedStage === 2 && !isRecoveryAccepted)
                ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' 
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            {(resolvedStage === 1 && !isRecoveryAccepted) && 'State 1: Pre-Anomaly (Intended Route)'}
            {(resolvedStage === 2 && !isRecoveryAccepted) && 'State 2: Post-Disruption (Stranded Hub + Nearest Trucks)'}
            {(resolvedStage === 3 || isRecoveryAccepted) && (isRecoveryAccepted ? 'State 3: Recovery Plan Accepted & Active' : 'State 3: AI Solved (Blue/Red/Green Resolution)')}
          </span>
        )}

        {globalViewMode && (
          <span className="text-gray-600 font-medium">32 Regional Hubs · 75 Linehaul Fleet</span>
        )}
      </div>

      {/* Floating View Toggle (Hidden if hideControls is true) */}
      {!hideControls && (
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-1 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1">
          <button
            onClick={() => setGlobalViewMode(false)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              !globalViewMode 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>Progressive State View</span>
          </button>
          <button
            onClick={() => setGlobalViewMode(true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              globalViewMode 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Global Fleet ({trucks.length})</span>
          </button>
        </div>
      )}

      {/* Dynamic Route Legend for Overlay */}
      {!hideOverlayLegend && !globalViewMode && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-gray-200 shadow-md text-xs space-y-1.5 max-w-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Progressive Map State: {isRecoveryAccepted ? 'Stage 3 (Accepted)' : `Stage ${resolvedStage}`}
          </div>
          
          {/* Stage 1 Legend */}
          {resolvedStage === 1 && !isRecoveryAccepted && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600">
              <span className="w-3.5 h-1.5 bg-indigo-600 rounded-full inline-block"></span>
              <span>Intended Route ({normOrigin} ➔ {normDest})</span>
            </div>
          )}

          {/* Stage 2 Legend */}
          {resolvedStage === 2 && !isRecoveryAccepted && (
            <>
              <div className="flex items-center gap-2 text-[11px] font-bold text-rose-600">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block animate-pulse"></span>
                <span>Stranded at {normStranded} · Intended Route Cleared</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span>
                <span>Nearest Available Trucks ({visibleTrucks.length} around area)</span>
              </div>
            </>
          )}

          {/* Stage 3 Legend */}
          {(resolvedStage === 3 || isRecoveryAccepted) && (
            <>
              <div className="flex items-center gap-2 text-[11px] font-bold text-rose-600">
                <span className="w-3.5 h-1.5 bg-rose-500 rounded-full inline-block"></span>
                <span>Red: Deviation / Stranded ({normOrigin} ➔ {normStranded})</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600">
                <span className="w-3.5 h-1.5 bg-blue-600 rounded-full inline-block"></span>
                <span>Blue: Original Intended Route ({normOrigin} ➔ {normDest})</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700">
                <span className="w-3.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                <span>Green: {isRecoveryAccepted ? 'Dispatched Piggyback Recovery' : 'AI Solved Recovery'} ({normStranded} ➔ {normDest})</span>
              </div>
            </>
          )}
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController bounds={mapBounds} stage={resolvedStage} isFocusMode={!globalViewMode} />

        {/* Regular Fleet Road Polylines (Global Mode only) */}
        {globalViewMode && regularRoads.map(r => (
          <Polyline
            key={r.id}
            positions={r.positions}
            pathOptions={{
              color: r.color,
              weight: r.weight,
              dashArray: r.dashArray,
              opacity: 0.55
            }}
          />
        ))}

        {/* ================================================================= */}
        {/* PERSISTENT PROGRESSIVE POLYLINES (Strictly from routePolylines)   */}
        {/* State 3 & post-acceptance persistently renders Red, Blue, Green   */}
        {/* ================================================================= */}
        {!globalViewMode && routePolylines.map((line) => (
          <Polyline
            key={`route-${line.id}-${resolvedStage}-${normOrigin}-${normStranded}-${normDest}`}
            positions={line.positions}
            pathOptions={{
              color: line.color,
              weight: line.weight,
              opacity: line.opacity,
              dashArray: line.dashArray
            }}
          >
            {line.tooltip && (
              <Tooltip sticky className={line.tooltipClass}>
                {line.tooltip}
              </Tooltip>
            )}
          </Polyline>
        ))}

        {/* Hub Markers */}
        {visibleHubs.map(hub => {
          const lat = parseFloat(hub.lat);
          const lng = parseFloat(hub.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          const isKeyFocus = !globalViewMode && [normOrigin, normDest, normStranded].includes(canonicalHub(hub.hub_id));

          return (
            <Marker
              key={hub.hub_id}
              position={[lat, lng]}
              icon={createHubIcon(hub, isKeyFocus)}
            >
              <Popup>
                <div className="p-1.5 text-gray-900 text-xs">
                  <div className="font-bold text-sm text-gray-900">{hub.name || hub.city} ({hub.hub_id})</div>
                  <div className="text-gray-600 capitalize mt-0.5">Type: {(hub.type || 'hub').replace('_', ' ')}</div>
                  <div className="text-[11px] text-gray-500 mt-1 font-medium">Coords: {lat.toFixed(4)}, {lng.toFixed(4)}</div>
                  {hub.storage_capacity_tons && (
                    <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
                      Capacity: {hub.storage_capacity_tons} Tons
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* State 2 & State 3: Distinct Stranded Position Marker */}
        {!globalViewMode && (resolvedStage === 2 || resolvedStage === 3 || isRecoveryAccepted) && (
          <Marker
            position={hubMap[normStranded] || [17.0575, 79.2684]}
            icon={createAnomalyIcon()}
          >
            <Popup>
              <div className="p-2 text-gray-900 max-w-xs">
                <div className="font-black text-sm text-rose-600 flex items-center gap-1">
                  🚨 {isRecoveryAccepted ? 'RESOLVED STRANDED POSITION (RECOVERED)' : 'CURRENT STRANDED POSITION'}
                </div>
                <div className="font-bold text-xs mt-1 text-gray-900">
                  Shipment: {anomalyData?.shipment_id || 'SH004'} ({anomalyData?.shipper || 'Consignor'})
                </div>
                <div className="text-xs text-rose-700 font-semibold mt-1">
                  Stranded Location: {normStranded}
                </div>
                <div className="text-[11px] text-gray-600 mt-0.5">
                  Weight: {anomalyData?.weight_tons || 4.5} Tons | Destination: {normDest}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* State 2 (Candidate Nearby Trucks), State 3 (Matched Truck), & Global Fleet */}
        {visibleTrucks.map(truck => {
          const lat = parseFloat(truck.current_lat);
          const lng = parseFloat(truck.current_lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          const isCandidate = resolvedStage === 2;
          const isMatched = truck.truck_id === (matchedTruck?.truck_id || 'TRK-004') || truck.truck_id === 'V004' || truck.truck_id === 'V001';

          return (
            <Marker
              key={truck.truck_id}
              position={[lat, lng]}
              icon={isCandidate ? createNearbyTruckIcon(truck) : createTruckIcon(truck, isMatched)}
            >
              <Popup>
                <div className="p-2 text-gray-900 text-xs max-w-xs">
                  {isCandidate && (
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Nearest Available Candidate Truck
                    </div>
                  )}
                  <div className="font-bold text-sm flex items-center gap-1.5 text-gray-900">
                    🚚 {truck.truck_id} · {truck.driver_name}
                  </div>
                  {isCandidate && truck.distance_to_stranded_km !== undefined && (
                    <div className="text-xs font-bold text-rose-700 mt-1">
                      📍 {truck.distance_to_stranded_km} km from Stranded Location ({normStranded})
                    </div>
                  )}
                  <div className="text-[11px] text-gray-600 mt-1">
                    Route: {(truck.route || []).join(' ➔ ') || `${truck.current_hub} ➔ ${truck.next_hub}`}
                  </div>
                  <div className="text-xs font-bold text-emerald-700 mt-1 flex items-center justify-between">
                    <span>Spare: {truck.spare_capacity_tons} Tons</span>
                    <span className="font-semibold text-gray-700">₹{truck.cost_per_km_inr || truck.cost_per_km || 45}/km</span>
                  </div>
                </div>
              </Popup>
              {isCandidate && (
                <Tooltip permanent direction="top" className="bg-amber-50 text-amber-900 font-bold text-[10px] border border-amber-300 shadow-xs">
                  🚚 {truck.truck_id} · {truck.distance_to_stranded_km}km · {truck.spare_capacity_tons}T Spare
                </Tooltip>
              )}
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
}