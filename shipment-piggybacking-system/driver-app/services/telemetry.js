import axios from 'axios';
import * as Location from 'expo-location';

const DEFAULT_API_BASE = 'http://localhost:3000';

let telemetryInterval = null;
let lastPingDetails = null;

// Route waypoints along the I-65 Midwest corridor (Indianapolis to Chicago)
const MIDWEST_CORRIDOR_COORDS = [
  { latitude: 39.7684, longitude: -86.1581, hub: 'HUB-INDIANAPOLIS', label: 'Indianapolis Logistics Terminal' },
  { latitude: 40.4173, longitude: -86.8753, hub: null, label: 'Lafayette Interstate Mile 172' },
  { latitude: 40.8520, longitude: -87.0520, hub: null, label: 'Remington Waypoint Mile 201' },
  { latitude: 41.5312, longitude: -87.3204, hub: null, label: 'Merrillville Corridor Mile 253' },
  { latitude: 41.8781, longitude: -87.6298, hub: 'HUB-CHICAGO', label: 'Chicago Central Freight Terminal' }
];

let waypointIndex = 0;

/**
 * Sends a single telemetry GPS ping to the Node.js ingestion backend.
 */
export async function sendTelemetryPing({ 
  apiBase = DEFAULT_API_BASE, 
  token, 
  shipmentId, 
  latitude, 
  longitude, 
  currentHub 
}) {
  try {
    let lat = latitude;
    let lon = longitude;
    let hub = currentHub;

    // If coordinates are not explicitly passed, attempt device GPS or fallback to corridor waypoint
    if (!lat || !lon) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      } catch (locErr) {
        // Silent fallback to simulated route telemetry if running in Node or simulator without sensor
      }
    }

    // Corridor waypoint fallback
    if (!lat || !lon) {
      const currentPt = MIDWEST_CORRIDOR_COORDS[waypointIndex % MIDWEST_CORRIDOR_COORDS.length];
      lat = currentPt.latitude;
      lon = currentPt.longitude;
      hub = currentPt.hub || hub;
      waypointIndex++;
    }

    const payload = {
      shipmentId: shipmentId || 'SHP-2001',
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lon.toFixed(4)),
      currentHub: hub || undefined
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.post(`${apiBase}/api/tracking/ping`, payload, { headers });

    lastPingDetails = {
      timestamp: new Date().toISOString(),
      coordinates: [payload.latitude, payload.longitude],
      hub: payload.currentHub,
      result: response.data
    };

    return {
      success: true,
      data: payload,
      response: response.data
    };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('[Telemetry Service] Ping transmission error:', errorMsg);
    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * Starts automated periodic telemetry tracking (every intervalMs, default 10s).
 */
export function startTelemetry({ 
  apiBase = DEFAULT_API_BASE, 
  token, 
  shipmentId, 
  intervalMs = 10000, 
  onPingSuccess, 
  onError 
}) {
  stopTelemetry();

  // Trigger immediate initial ping
  sendTelemetryPing({ apiBase, token, shipmentId }).then(result => {
    if (result.success && onPingSuccess) onPingSuccess(result);
    if (!result.success && onError) onError(result.error);
  });

  // Recurring 10-second background updater
  telemetryInterval = setInterval(async () => {
    const result = await sendTelemetryPing({ apiBase, token, shipmentId });
    if (result.success && onPingSuccess) onPingSuccess(result);
    if (!result.success && onError) onError(result.error);
  }, intervalMs);

  return { active: true, intervalMs };
}

/**
 * Halts active recurring telemetry updater.
 */
export function stopTelemetry() {
  if (telemetryInterval) {
    clearInterval(telemetryInterval);
    telemetryInterval = null;
  }
}

/**
 * Returns latest telemetry telemetry state.
 */
export function getTelemetryStatus() {
  return {
    isActive: Boolean(telemetryInterval),
    lastPing: lastPingDetails
  };
}
