"""
solver.py - Capacitated Vehicle Routing Problem with Time Windows (CVRPTW)
Powered by Google OR-Tools Constraint Solver (ortools.constraint_solver).

Solves the multi-objective piggyback recovery problem enforcing:
1. Vehicle payload capacity dimensions (cannot exceed vehicle.available_capacity)
2. Cumulative delivery time windows (arrival at destination <= deadline)
3. Priority-weighted penalty objective (CRITICAL / HIGH / MEDIUM / LOW shipments)
"""

from typing import List, Dict, Tuple, Optional
import math
import networkx as nx
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from models import Shipment, VehicleRoute, Hub, PiggybackStrategy
from optimizer import PRIORITY_MULTIPLIERS, REAL_CORRIDOR_WAYPOINTS, generate_road_waypoints

def solve_cvrptw_recovery(
    misplaced_shipment: Shipment,
    active_routes: List[VehicleRoute],
    hub_graph: nx.DiGraph,
    osm_graph: Optional[nx.MultiDiGraph] = None
) -> List[PiggybackStrategy]:
    """
    Solves the piggybacking recovery vehicle assignment using Google OR-Tools CVRPTW solver.
    Evaluates capacity dimensions, delivery time windows, and priority-penalized travel costs.
    """
    s_curr = misplaced_shipment.current_hub
    s_dest = misplaced_shipment.destination
    weight = float(misplaced_shipment.weight)
    deadline = float(misplaced_shipment.deadline)
    priority = (misplaced_shipment.priority or "MEDIUM").upper()
    priority_mult = PRIORITY_MULTIPLIERS.get(priority, 1.0)

    strategies: List[PiggybackStrategy] = []

    for route in active_routes:
        v_curr = route.current_location
        v_dest = route.destination
        speed = float(route.average_speed_kmh) if route.average_speed_kmh else 70.0
        available_cap = float(route.available_capacity)

        # -------------------------------------------------------------
        # 1. Capacity Constraint Dimension Check
        # Reject routes where vehicle available capacity is strictly less than shipment weight
        # -------------------------------------------------------------
        if available_cap < weight:
            strategies.append(
                PiggybackStrategy(
                    route_id=route.id,
                    vehicle_origin=v_curr,
                    vehicle_destination=v_dest,
                    available_capacity=available_cap,
                    shipment_weight=weight,
                    remaining_capacity_after=round(available_cap - weight, 2),
                    path=[v_curr, v_dest],
                    distance_km=0.0,
                    estimated_transit_hours=999.0,
                    deadline_hours=deadline,
                    estimated_cost=9999.0,
                    priority_score=99999.0,
                    meets_deadline=False,
                    status="INSUFFICIENT_CAPACITY",
                    details=f"Rejected by CVRPTW Capacity constraint: route {route.id} available payload ({available_cap} kg) < shipment weight ({weight} kg).",
                    path_coordinates=[]
                )
            )
            continue

        required_nodes = {s_curr, s_dest, v_curr, v_dest}
        if not required_nodes.issubset(hub_graph.nodes):
            continue

        is_direct = (v_curr == s_curr and v_dest == s_dest)

        # Build candidate route itinerary
        if is_direct:
            itinerary = [s_curr, s_dest]
            edge_data = hub_graph[s_curr][s_dest]
            true_dist = edge_data["distance"]
            road_waypoints = edge_data.get("waypoints", [])
            estimated_cost = round((true_dist * route.cost_per_km * 0.25) + 15.0, 2)
            base_details = f"Direct OSM highway piggyback on route {route.id} from {s_curr} to {s_dest}."
        elif v_curr == s_curr:
            itinerary = [s_curr, s_dest, v_dest]
            dist_to_dropoff = hub_graph[s_curr][s_dest]["distance"]
            dist_to_vdest = hub_graph[s_dest][v_dest]["distance"]
            original_dist = hub_graph[v_curr][v_dest]["distance"]
            detour_dist = (dist_to_dropoff + dist_to_vdest) - original_dist
            true_dist = dist_to_dropoff
            estimated_cost = round(max(15.0, detour_dist * route.cost_per_km + 25.0), 2)
            road_waypoints = hub_graph[s_curr][s_dest].get("waypoints", [])
            base_details = f"OSM Detour on {route.id}: departs {s_curr}, unloads at {s_dest}, continues to {v_dest}."
        else:
            try:
                itinerary = [v_curr, s_curr, s_dest]
                if s_dest != v_dest:
                    itinerary.append(v_dest)

                dist_to_pickup = hub_graph[v_curr][s_curr]["distance"]
                dist_delivery = hub_graph[s_curr][s_dest]["distance"]
                dist_finish = hub_graph[s_dest][v_dest]["distance"] if s_dest != v_dest else 0.0
                original_dist = hub_graph[v_curr][v_dest]["distance"]

                detour_dist = (dist_to_pickup + dist_delivery + dist_finish) - original_dist
                true_dist = round(dist_to_pickup + dist_delivery, 2)
                estimated_cost = round(max(30.0, detour_dist * route.cost_per_km + 40.0), 2)
                
                road_waypoints = (
                    hub_graph[v_curr][s_curr].get("waypoints", []) + 
                    hub_graph[s_curr][s_dest].get("waypoints", [])
                )
                base_details = f"OSM Multi-segment Detour on {route.id}: picks up at {s_curr} and delivers to {s_dest}."
            except Exception:
                continue

        # -------------------------------------------------------------
        # 2. OR-Tools CVRPTW Model Construction
        # -------------------------------------------------------------
        num_nodes = len(itinerary)
        manager = pywrapcp.RoutingIndexManager(num_nodes, 1, [0], [num_nodes - 1])
        routing = pywrapcp.RoutingModel(manager)

        # Distance & Arc Cost Evaluator
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            u = itinerary[from_node]
            v = itinerary[to_node]
            if u == v:
                return 0
            return int(hub_graph[u][v]["distance"] * 100)  # hectometers

        dist_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(dist_callback_index)

        # Capacity Dimension (in kg)
        def demand_callback(from_index):
            from_node = manager.IndexToNode(from_index)
            hub = itinerary[from_node]
            if hub == s_curr:
                return int(weight)
            return 0

        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,  # null capacity slack
            [int(available_cap)],
            True,  # start cumul to zero
            "Capacity"
        )

        # Time Windows Dimension (in minutes)
        def time_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            u = itinerary[from_node]
            v = itinerary[to_node]
            if u == v:
                return 0
            dist_km = hub_graph[u][v]["distance"]
            return int((dist_km / speed) * 60)  # minutes

        time_callback_index = routing.RegisterTransitCallback(time_callback)
        routing.AddDimension(
            time_callback_index,
            60 * 24,  # max slack / waiting time in minutes (24 hours)
            60 * 72,  # max time horizon (72 hours)
            True,     # fix start cumul to zero
            "Time"
        )
        time_dimension = routing.GetDimensionOrDie("Time")

        # Destination Delivery Time Window Constraint
        delivery_node_idx = itinerary.index(s_dest)
        if delivery_node_idx == 0:
            delivery_routing_idx = routing.Start(0)
        elif delivery_node_idx == num_nodes - 1:
            delivery_routing_idx = routing.End(0)
        else:
            delivery_routing_idx = manager.NodeToIndex(delivery_node_idx)

        # Priority-based penalty disjunction on intermediate delivery stops
        if not routing.IsStart(delivery_routing_idx) and not routing.IsEnd(delivery_routing_idx):
            priority_penalty = int(500000 * priority_mult)
            routing.AddDisjunction([delivery_routing_idx], priority_penalty)

        # Set delivery time window
        deadline_minutes = int(deadline * 60)
        time_dimension.CumulVar(delivery_routing_idx).SetRange(0, deadline_minutes)

        # Solve CVRPTW with OR-Tools
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.time_limit.seconds = 2

        solution = routing.SolveWithParameters(search_parameters)

        calculated_transit_hours = round(true_dist / speed, 2)

        if solution:
            cumul_time_var = time_dimension.CumulVar(delivery_routing_idx)
            solved_delivery_mins = solution.Min(cumul_time_var)
            transit_hours = round(solved_delivery_mins / 60.0, 2)
            meets_deadline = (transit_hours <= deadline)
        else:
            transit_hours = calculated_transit_hours
            meets_deadline = False

        time_slack = deadline - transit_hours
        status = "VIABLE" if meets_deadline else "EXCEEDS_DEADLINE"
        deadline_penalty = 0.0 if meets_deadline else 1000.0 + abs(time_slack) * 50.0
        slack_bonus = max(0.0, time_slack) * 2.0 if meets_deadline else 0.0

        # Multi-objective priority score
        composite_score = round(
            (estimated_cost / priority_mult) + deadline_penalty - slack_bonus, 2
        )

        details = f"[OR-Tools CVRPTW] {base_details}"

        strategies.append(
            PiggybackStrategy(
                route_id=route.id,
                vehicle_origin=v_curr,
                vehicle_destination=v_dest,
                available_capacity=available_cap,
                shipment_weight=weight,
                remaining_capacity_after=round(available_cap - weight, 2),
                path=itinerary,
                distance_km=true_dist,
                estimated_transit_hours=transit_hours,
                deadline_hours=deadline,
                estimated_cost=estimated_cost,
                priority_score=composite_score,
                meets_deadline=meets_deadline,
                status=status,
                details=details,
                path_coordinates=road_waypoints
            )
        )

    # Sort strategies: viable first, then by lowest priority_score
    strategies.sort(
        key=lambda s: (
            0 if s.meets_deadline and s.status == "VIABLE" else 1,
            s.priority_score
        )
    )

    return strategies
