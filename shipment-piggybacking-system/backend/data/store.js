import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const INITIAL_DATA = {
  hubs: [
    {
      id: "HUB-MILWAUKEE",
      name: "Midwest North Sorting Hub (Milwaukee, WI)",
      location_coordinates: [43.0389, -87.9065]
    },
    {
      id: "HUB-CHICAGO",
      name: "Central Great Lakes Hub (Chicago, IL)",
      location_coordinates: [41.8781, -87.6298]
    },
    {
      id: "HUB-INDIANAPOLIS",
      name: "Cross-Dock Gateway (Indianapolis, IN)",
      location_coordinates: [39.7684, -86.1581]
    },
    {
      id: "HUB-DETROIT",
      name: "Motor City Distribution Hub (Detroit, MI)",
      location_coordinates: [42.3314, -83.0458]
    }
  ],
  active_routes: [
    {
      id: "TRUCK-RUN-101-CAPABLE",
      current_location: "HUB-MILWAUKEE",
      destination: "HUB-CHICAGO",
      available_capacity: 650.0,
      cost_per_km: 1.75,
      average_speed_kmh: 65.0
    },
    {
      id: "VAN-RUN-204-OVERLOADED",
      current_location: "HUB-MILWAUKEE",
      destination: "HUB-CHICAGO",
      available_capacity: 85.0,
      cost_per_km: 0.95,
      average_speed_kmh: 75.0
    },
    {
      id: "FREIGHT-FEEDER-305",
      current_location: "HUB-INDIANAPOLIS",
      destination: "HUB-CHICAGO",
      available_capacity: 1200.0,
      cost_per_km: 1.60,
      average_speed_kmh: 70.0
    }
  ],
  shipments: [
    {
      id: "SHP-1001",
      item_name: "Critical Medical Dialysis Kits",
      origin: "HUB-MILWAUKEE",
      destination: "HUB-CHICAGO",
      current_hub: "HUB-MILWAUKEE",
      expected_route: ["HUB-MILWAUKEE", "HUB-CHICAGO"],
      weight: 175.5,
      deadline: 5.0,
      priority: "HIGH",
      is_misplaced: false,
      last_event: "Checked in at origin hub",
      last_updated: new Date().toISOString(),
      recovery_strategies: []
    },
    {
      id: "SHP-1002",
      item_name: "Automotive Precision Assemblies",
      origin: "HUB-MILWAUKEE",
      destination: "HUB-CHICAGO",
      current_hub: "HUB-MILWAUKEE",
      expected_route: ["HUB-MILWAUKEE", "HUB-CHICAGO"],
      weight: 420.0,
      deadline: 8.0,
      priority: "MEDIUM",
      is_misplaced: false,
      last_event: "Staged for linehaul loading",
      last_updated: new Date().toISOString(),
      recovery_strategies: []
    },
    {
      id: "SHP-1003",
      item_name: "Aerospace Avionics Sensor Spares",
      origin: "HUB-INDIANAPOLIS",
      destination: "HUB-CHICAGO",
      current_hub: "HUB-INDIANAPOLIS",
      expected_route: ["HUB-INDIANAPOLIS", "HUB-CHICAGO"],
      weight: 95.0,
      deadline: 4.0,
      priority: "CRITICAL",
      is_misplaced: false,
      last_event: "Departing origin cross-dock",
      last_updated: new Date().toISOString(),
      recovery_strategies: []
    }
  ]
};

let inMemoryStore = null;
let writeQueue = Promise.resolve();

async function ensureDb() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
  }
}

export async function readStore() {
  if (inMemoryStore) {
    return inMemoryStore;
  }
  await ensureDb();
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    inMemoryStore = JSON.parse(raw);
  } catch {
    inMemoryStore = { ...INITIAL_DATA, sla_audit_logs: [], incidents: [] };
    await writeStore(inMemoryStore);
  }
  return inMemoryStore;
}

export async function writeStore(data) {
  inMemoryStore = data;
  writeQueue = writeQueue.then(async () => {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
      await fs.rename(tempFile, DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }
  }).catch(err => {
    console.error('[Store Write Error]:', err.message);
  });
  return writeQueue;
}

export async function getShipments() {
  const data = await readStore();
  return data.shipments;
}

export async function getShipmentById(id) {
  const data = await readStore();
  return data.shipments.find(s => s.id === id) || null;
}

export async function getHubs() {
  const data = await readStore();
  return data.hubs;
}

export async function getActiveRoutes() {
  const data = await readStore();
  return data.active_routes;
}

export async function updateShipment(id, patch) {
  const data = await readStore();
  const idx = data.shipments.findIndex(s => s.id === id);
  if (idx === -1) return null;

  data.shipments[idx] = {
    ...data.shipments[idx],
    ...patch,
    last_updated: new Date().toISOString()
  };

  await writeStore(data);
  return data.shipments[idx];
}

export async function getActiveRouteById(id) {
  const data = await readStore();
  return data.active_routes.find(r => r.id === id) || null;
}

export async function deductRouteCapacity(routeId, weight) {
  const data = await readStore();
  const idx = data.active_routes.findIndex(r => r.id === routeId);
  if (idx === -1) return null;

  const currentCapacity = data.active_routes[idx].available_capacity;
  const newCapacity = Math.max(0, Math.round((currentCapacity - weight) * 100) / 100);
  data.active_routes[idx].available_capacity = newCapacity;

  await writeStore(data);
  return data.active_routes[idx];
}

export async function getSlaLogs() {
  const data = await readStore();
  return data.sla_audit_logs || [];
}

export async function addSlaLog(logEntry) {
  const data = await readStore();
  if (!data.sla_audit_logs) {
    data.sla_audit_logs = [];
  }
  data.sla_audit_logs.push({
    ...logEntry,
    id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recorded_at: new Date().toISOString()
  });
  await writeStore(data);
  return data.sla_audit_logs;
}

export async function clearSlaLogs() {
  const data = await readStore();
  data.sla_audit_logs = [];
  await writeStore(data);
  return [];
}

export async function getIncidents() {
  const data = await readStore();
  return data.incidents || [];
}

export async function getIncidentById(id) {
  const data = await readStore();
  const incidents = data.incidents || [];
  return incidents.find(inc => inc.id === id) || null;
}

export async function addIncident(incident) {
  const data = await readStore();
  if (!data.incidents) {
    data.incidents = [];
  }
  const entry = {
    ...incident,
    id: incident.id || `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: incident.created_at || new Date().toISOString()
  };
  data.incidents.unshift(entry); // newest first
  await writeStore(data);
  return entry;
}

export async function updateIncident(id, patch) {
  const data = await readStore();
  if (!data.incidents) data.incidents = [];
  const idx = data.incidents.findIndex(inc => inc.id === id);
  if (idx === -1) return null;

  data.incidents[idx] = {
    ...data.incidents[idx],
    ...patch,
    updated_at: new Date().toISOString()
  };
  await writeStore(data);
  return data.incidents[idx];
}

export async function resetStore() {
  await writeStore({ ...INITIAL_DATA, sla_audit_logs: [], incidents: [] });
  return INITIAL_DATA;
}
