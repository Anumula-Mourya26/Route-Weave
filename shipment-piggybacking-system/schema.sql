-- ============================================================================
-- SH-205: Intelligent Shipment Piggybacking System
-- Database Schema: PostgreSQL with PostGIS Spatial Extensions (Supabase)
-- Domain: Telangana Logistics Corridor (Hyderabad - Warangal - Nalgonda)
-- ============================================================================

-- 1. Enable Required Spatial & Utility Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables and views if re-running migration
DROP VIEW IF EXISTS v_system_metrics CASCADE;
DROP TABLE IF EXISTS recovery_plans CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS trucks CASCADE;
DROP TABLE IF EXISTS hubs CASCADE;

-- ============================================================================
-- 3. HUBS TABLE (8 Strategic Telangana Logistics Nodes)
-- ============================================================================
CREATE TABLE hubs (
    hub_id VARCHAR(10) PRIMARY KEY, -- 'H1' through 'H8'
    name VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('origin', 'destination', 'transit', 'transfer_hub')),
    -- PostGIS spatial point geometry in WGS 84 (SRID 4326)
    geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hubs_geom ON hubs USING GIST (geom);
CREATE INDEX idx_hubs_type ON hubs (type);

-- ============================================================================
-- 4. TRUCKS TABLE (Active Fleet TRK-001 through TRK-005)
-- ============================================================================
CREATE TABLE trucks (
    truck_id VARCHAR(20) PRIMARY KEY, -- 'TRK-001' to 'TRK-005'
    driver_name VARCHAR(100) NOT NULL,
    capacity_tons NUMERIC(6, 2) NOT NULL CHECK (capacity_tons > 0),
    current_load_tons NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (current_load_tons >= 0),
    spare_capacity_tons NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (spare_capacity_tons >= 0),
    route TEXT[] NOT NULL, -- e.g. ARRAY['H1', 'H7', 'H2']
    current_hub VARCHAR(10) REFERENCES hubs(hub_id),
    current_lat DOUBLE PRECISION NOT NULL,
    current_lng DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(current_lng, current_lat), 4326)) STORED,
    next_hub VARCHAR(10) REFERENCES hubs(hub_id),
    eta_next_hub TIMESTAMPTZ,
    final_eta TIMESTAMPTZ,
    cost_per_km NUMERIC(6, 2) NOT NULL DEFAULT 45.0,
    status VARCHAR(50) DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'idle', 'recovering', 'delivered')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trucks_geom ON trucks USING GIST (geom);
CREATE INDEX idx_trucks_spare_cap ON trucks (spare_capacity_tons);
CREATE INDEX idx_trucks_current_hub ON trucks (current_hub);

-- ============================================================================
-- 5. SHIPMENTS TABLE (200 Telangana Records SHP-1001 to SHP-1200)
-- ============================================================================
CREATE TABLE shipments (
    shipment_id VARCHAR(20) PRIMARY KEY, -- 'SHP-1001' to 'SHP-1200'
    shipper VARCHAR(100) NOT NULL,
    origin_hub VARCHAR(100) NOT NULL,
    destination_hub VARCHAR(100) NOT NULL,
    dispatch_date DATE NOT NULL,
    expected_delivery DATE NOT NULL,
    actual_delivery DATE,
    cargo_category VARCHAR(100) NOT NULL,
    shipment_status VARCHAR(50) NOT NULL CHECK (shipment_status IN ('Delivered', 'In Transit', 'Misplaced', 'Pending')),
    weight_tons NUMERIC(6, 2) NOT NULL CHECK (weight_tons > 0),
    truck_id VARCHAR(20),
    truck_capacity_tons NUMERIC(6, 2) DEFAULT 0,
    spare_capacity_tons NUMERIC(6, 2) DEFAULT 0,
    current_hub VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    recovery_mode VARCHAR(50) DEFAULT 'N/A' CHECK (recovery_mode IN ('Direct Piggyback', 'Relay', 'N/A', 'Pending')),
    detour_km NUMERIC(8, 2) DEFAULT 0,
    cost_saved_usd NUMERIC(10, 2) DEFAULT 0,
    carbon_saved_kg NUMERIC(10, 2) DEFAULT 0,
    compliance VARCHAR(10) DEFAULT 'Yes',
    is_misplaced BOOLEAN GENERATED ALWAYS AS (shipment_status = 'Misplaced') STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipments_status ON shipments (shipment_status);
CREATE INDEX idx_shipments_priority ON shipments (priority);
CREATE INDEX idx_shipments_current_hub ON shipments (current_hub);
CREATE INDEX idx_shipments_misplaced ON shipments (is_misplaced);

-- ============================================================================
-- 6. RECOVERY PLANS TABLE (Autonomous Matching, Optimization & Execution)
-- ============================================================================
CREATE TABLE recovery_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id VARCHAR(20) NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
    recovery_mode VARCHAR(50) NOT NULL CHECK (recovery_mode IN ('DIRECT_PIGGYBACK', 'RELAY')),
    primary_truck_id VARCHAR(20) REFERENCES trucks(truck_id),
    relay_truck_id VARCHAR(20) REFERENCES trucks(truck_id),
    transfer_hub_id VARCHAR(10) REFERENCES hubs(hub_id),
    detour_km NUMERIC(8, 2) NOT NULL DEFAULT 0,
    cost_saved_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    carbon_saved_kg NUMERIC(10, 2) NOT NULL DEFAULT 0,
    hours_saved NUMERIC(6, 2) NOT NULL DEFAULT 0,
    new_eta TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'EXECUTED', 'REJECTED')),
    solver_type VARCHAR(50) DEFAULT 'OR_TOOLS' CHECK (solver_type IN ('OR_TOOLS', 'GREEDY_FALLBACK')),
    solver_duration_ms NUMERIC(8, 2) DEFAULT 0,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_shipment_id ON recovery_plans (shipment_id);
CREATE INDEX idx_recovery_status ON recovery_plans (status);

-- ============================================================================
-- 7. REAL-TIME METRICS AGGREGATION VIEW (Dashboard Cards)
-- ============================================================================
CREATE OR REPLACE VIEW v_system_metrics AS
SELECT 
    COUNT(*) AS total_shipments,
    COUNT(*) FILTER (WHERE shipment_status = 'Misplaced') AS active_misplaced,
    COUNT(*) FILTER (WHERE shipment_status = 'In Transit') AS active_in_transit,
    COUNT(*) FILTER (WHERE shipment_status = 'Delivered') AS total_delivered,
    COALESCE(SUM(cost_saved_usd), 0) AS total_cost_saved_usd,
    COALESCE(SUM(carbon_saved_kg), 0) AS total_carbon_saved_kg,
    (SELECT COUNT(*) FROM trucks WHERE status = 'in_transit') AS active_trucks
FROM shipments;

-- ============================================================================
-- 8. POSTGIS HELPER FUNCTIONS (Geodesic Distance & Proximity Filter)
-- ============================================================================

-- Distance in km between two hubs
CREATE OR REPLACE FUNCTION fn_hub_distance_km(h1_id VARCHAR(10), h2_id VARCHAR(10))
RETURNS NUMERIC AS $$
DECLARE
    dist_km NUMERIC;
BEGIN
    SELECT ST_Distance(h1.geom::geography, h2.geom::geography) / 1000.0
    INTO dist_km
    FROM hubs h1, hubs h2
    WHERE h1.hub_id = h1_id AND h2.hub_id = h2_id;
    
    RETURN ROUND(dist_km, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Find trucks within radius_km of a given coordinate
CREATE OR REPLACE FUNCTION fn_find_nearby_trucks(target_lat DOUBLE PRECISION, target_lng DOUBLE PRECISION, radius_km DOUBLE PRECISION)
RETURNS TABLE (
    truck_id VARCHAR(20),
    driver_name VARCHAR(100),
    spare_capacity_tons NUMERIC(6, 2),
    distance_km NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.truck_id,
        t.driver_name,
        t.spare_capacity_tons,
        ROUND((ST_Distance(t.geom::geography, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography) / 1000.0)::numeric, 2) AS distance_km
    FROM trucks t
    WHERE ST_DWithin(t.geom::geography, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography, radius_km * 1000.0)
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;
