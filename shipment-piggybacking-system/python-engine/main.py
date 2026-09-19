from fastapi import FastAPI, HTTPException
from datetime import datetime, timezone
import networkx as nx
import osmnx as ox

from models import OptimizationRequest, OptimizationResponse
from optimizer import build_hub_graph, find_piggyback_opportunities, build_osm_graph
from solver import solve_cvrptw_recovery
import ortools

app = FastAPI(
    title="Shipment Piggybacking Optimization Engine with OpenStreetMap & Google OR-Tools",
    description="Python microservice for graph, OSM highway routing, CVRPTW constraint solver, and piggybacking optimization",
    version="2.1.0"
)

# Global cached OSM graph
osm_network = None

@app.on_event("startup")
def load_osm_network():
    global osm_network
    try:
        osm_network = build_osm_graph("Chicago, Illinois, USA")
        print(f"[Startup] Loaded OSM network with {len(osm_network.nodes)} nodes.")
    except Exception as e:
        print(f"[Startup] OSM network deferred: {e}")

@app.get("/")
def read_root():
    return {
        "service": "shipment-piggybacking-optimization-engine",
        "status": "online",
        "version": "2.1.0",
        "osm_enabled": True,
        "ortools_enabled": True
    }

@app.get("/health")
def health_check():
    test_graph = nx.Graph()
    test_graph.add_edge("HubA", "HubB", weight=10)
    has_path = nx.has_path(test_graph, "HubA", "HubB")

    return {
        "status": "healthy",
        "service": "python-optimization-engine",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "graph_engine": {
            "library": "networkx",
            "version": nx.__version__,
            "operational": has_path
        },
        "osm_engine": {
            "library": "osmnx",
            "version": ox.__version__,
            "loaded_nodes": len(osm_network.nodes) if osm_network else 0
        },
        "constraint_solver": {
            "library": "ortools",
            "version": ortools.__version__,
            "cvrptw_enabled": True
        }
    }

@app.post("/api/optimize-recovery", response_model=OptimizationResponse)
def optimize_recovery(payload: OptimizationRequest, use_ortools: bool = True):
    try:
        # 1. Construct the logistics hub graph with OSM road geometry
        hub_graph = build_hub_graph(payload.hubs)
        
        # 2. Run the optimization solver (OR-Tools CVRPTW exact solver or NetworkX heuristic)
        if use_ortools:
            strategies = solve_cvrptw_recovery(
                misplaced_shipment=payload.misplaced_shipment,
                active_routes=payload.active_routes,
                hub_graph=hub_graph,
                osm_graph=osm_network
            )
        else:
            strategies = find_piggyback_opportunities(
                misplaced_shipment=payload.misplaced_shipment,
                active_routes=payload.active_routes,
                hub_graph=hub_graph,
                osm_graph=osm_network
            )

        viable_count = sum(1 for s in strategies if s.meets_deadline and s.status == "VIABLE")

        return OptimizationResponse(
            shipment_id=payload.misplaced_shipment.id,
            total_candidates_evaluated=len(payload.active_routes),
            viable_strategies_count=viable_count,
            strategies=strategies
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Optimization solver error: {str(exc)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
