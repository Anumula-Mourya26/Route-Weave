"""
Unit and constraint test suite for Google OR-Tools CVRPTW Solver and Optimization Engine.
Validates:
1. Capacity Dimension: Reject routes where vehicle capacity < shipment weight.
2. Time Window Dimension: Reject routes where total transit time > shipment deadline.
3. Multi-Objective Priority: Verify high-priority shipments prioritize faster/cheaper routes.
"""

import pytest
import networkx as nx
from models import Shipment, VehicleRoute, Hub
from optimizer import build_hub_graph, find_piggyback_opportunities
from solver import solve_cvrptw_recovery

@pytest.fixture
def sample_hubs():
    return [
        Hub(id="HUB-CHICAGO", name="Chicago Hub", location_coordinates=[41.8781, -87.6298]),
        Hub(id="HUB-MILWAUKEE", name="Milwaukee Hub", location_coordinates=[43.0389, -87.9065]),
        Hub(id="HUB-INDIANAPOLIS", name="Indianapolis Hub", location_coordinates=[39.7684, -86.1581]),
    ]

@pytest.fixture
def sample_graph(sample_hubs):
    return build_hub_graph(sample_hubs)

# ============================================================================
# Test Case 1: Reject routes where vehicle capacity is strictly less than weight
# ============================================================================
def test_reject_insufficient_capacity(sample_graph):
    # Heavy shipment: 850 kg
    heavy_shipment = Shipment(
        id="SHP-TEST-HEAVY",
        current_hub="HUB-MILWAUKEE",
        destination="HUB-CHICAGO",
        weight=850.0,
        deadline=10.0,
        priority="HIGH",
        is_misplaced=True
    )

    routes = [
        # Route 1 has only 400 kg available capacity (< 850 kg)
        VehicleRoute(
            id="VEH-UNDERSIZED",
            current_location="HUB-MILWAUKEE",
            destination="HUB-CHICAGO",
            available_capacity=400.0,
            cost_per_km=1.5,
            average_speed_kmh=70.0
        ),
        # Route 2 has 1200 kg available capacity (>= 850 kg)
        VehicleRoute(
            id="VEH-SUFFICIENT",
            current_location="HUB-MILWAUKEE",
            destination="HUB-CHICAGO",
            available_capacity=1200.0,
            cost_per_km=1.5,
            average_speed_kmh=70.0
        )
    ]

    # Evaluate with OR-Tools CVRPTW solver
    strategies = solve_cvrptw_recovery(heavy_shipment, routes, sample_graph)

    # Strategy for undersized vehicle must be rejected
    undersized_strat = next((s for s in strategies if s.route_id == "VEH-UNDERSIZED"), None)
    assert undersized_strat is not None, "Undersized route must be recorded in evaluation"
    assert undersized_strat.status == "INSUFFICIENT_CAPACITY"
    assert undersized_strat.meets_deadline is False
    assert "Capacity constraint" in undersized_strat.details

    # Strategy for sufficient vehicle must be viable
    sufficient_strat = next((s for s in strategies if s.route_id == "VEH-SUFFICIENT"), None)
    assert sufficient_strat is not None
    assert sufficient_strat.status == "VIABLE"
    assert sufficient_strat.meets_deadline is True

    # Also verify NetworkX heuristic filters out undersized routes
    nx_strategies = find_piggyback_opportunities(heavy_shipment, routes, sample_graph)
    assert all(s.route_id != "VEH-UNDERSIZED" for s in nx_strategies)

# ============================================================================
# Test Case 2: Reject routes where total transit time exceeds delivery deadline
# ============================================================================
def test_reject_exceeded_deadline(sample_graph):
    # Urgent shipment with tight deadline: 2.5 hours
    urgent_shipment = Shipment(
        id="SHP-TEST-URGENT",
        current_hub="HUB-MILWAUKEE",
        destination="HUB-CHICAGO",
        weight=150.0,
        deadline=2.5,
        priority="CRITICAL",
        is_misplaced=True
    )

    routes = [
        # Direct route: Milwaukee -> Chicago (~140 km at 70 km/h = ~2.0 hrs <= 2.5 hrs)
        VehicleRoute(
            id="VEH-FAST-DIRECT",
            current_location="HUB-MILWAUKEE",
            destination="HUB-CHICAGO",
            available_capacity=1000.0,
            cost_per_km=1.4,
            average_speed_kmh=70.0
        ),
        # Detour route starting in Indianapolis: Ind -> Milw -> Chic (~450 km at 70 km/h = ~6.5 hrs > 2.5 hrs)
        VehicleRoute(
            id="VEH-SLOW-DETOUR",
            current_location="HUB-INDIANAPOLIS",
            destination="HUB-CHICAGO",
            available_capacity=1000.0,
            cost_per_km=1.2,
            average_speed_kmh=70.0
        )
    ]

    # Evaluate with OR-Tools CVRPTW solver
    strategies = solve_cvrptw_recovery(urgent_shipment, routes, sample_graph)

    fast_strat = next(s for s in strategies if s.route_id == "VEH-FAST-DIRECT")
    assert fast_strat.meets_deadline is True
    assert fast_strat.status == "VIABLE"
    assert fast_strat.estimated_transit_hours <= urgent_shipment.deadline

    slow_strat = next(s for s in strategies if s.route_id == "VEH-SLOW-DETOUR")
    assert slow_strat.meets_deadline is False
    assert slow_strat.status == "EXCEEDS_DEADLINE"
    assert slow_strat.estimated_transit_hours > urgent_shipment.deadline

    # Top-ranked recommendation must be the viable fast route
    assert strategies[0].route_id == "VEH-FAST-DIRECT"

# ============================================================================
# Test Case 3: Verify higher-priority shipments prioritize faster/lower-cost routes
# ============================================================================
def test_priority_ranking_precedence(sample_graph):
    # Two identical route network conditions evaluated under CRITICAL vs LOW priority
    critical_shipment = Shipment(
        id="SHP-CRITICAL",
        current_hub="HUB-INDIANAPOLIS",
        destination="HUB-CHICAGO",
        weight=200.0,
        deadline=5.0,
        priority="CRITICAL",
        is_misplaced=True
    )

    low_shipment = Shipment(
        id="SHP-LOW",
        current_hub="HUB-INDIANAPOLIS",
        destination="HUB-CHICAGO",
        weight=200.0,
        deadline=5.0,
        priority="LOW",
        is_misplaced=True
    )

    routes = [
        # Fast, direct linehaul: 4.2 hrs, $140
        VehicleRoute(
            id="VEH-DIRECT-FAST",
            current_location="HUB-INDIANAPOLIS",
            destination="HUB-CHICAGO",
            available_capacity=1500.0,
            cost_per_km=1.65,
            average_speed_kmh=72.0
        ),
        # Slower multi-stop detour: 11.0 hrs (breaches deadline)
        VehicleRoute(
            id="VEH-DETOUR-SLOW",
            current_location="HUB-MILWAUKEE",
            destination="HUB-CHICAGO",
            available_capacity=1500.0,
            cost_per_km=1.45,
            average_speed_kmh=68.0
        )
    ]

    crit_strategies = solve_cvrptw_recovery(critical_shipment, routes, sample_graph)
    low_strategies = solve_cvrptw_recovery(low_shipment, routes, sample_graph)

    # For both, the viable fast route must be Rank #1
    assert crit_strategies[0].route_id == "VEH-DIRECT-FAST"
    assert low_strategies[0].route_id == "VEH-DIRECT-FAST"

    # CRITICAL shipment priority multiplier (2.5x) scales down the effective penalty score
    # of the viable route compared to LOW priority (1.0x), rewarding prompt resolution:
    crit_best_score = crit_strategies[0].priority_score
    low_best_score = low_strategies[0].priority_score
    assert crit_best_score < low_best_score, (
        f"Critical score ({crit_best_score}) should be lower (better) than Low score ({low_best_score})"
    )

    # The deadline breach penalty on the unviable detour is much higher relative to the base score
    crit_detour = next(s for s in crit_strategies if s.route_id == "VEH-DETOUR-SLOW")
    assert crit_detour.status == "EXCEEDS_DEADLINE"
    assert crit_detour.priority_score > 1000.0
