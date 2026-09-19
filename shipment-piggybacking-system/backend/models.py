from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class HubModel(BaseModel):
    hub_id: str
    name: str
    lat: float
    lng: float
    type: str

class TruckModel(BaseModel):
    truck_id: str
    driver_name: str
    capacity_tons: float
    current_load_tons: float
    spare_capacity_tons: float
    route: List[str]
    current_hub: Optional[str] = None
    current_lat: float
    current_lng: float
    next_hub: Optional[str] = None
    eta_next_hub: Optional[str] = None
    final_eta: Optional[str] = None
    cost_per_km: float = 45.0
    status: str = "in_transit"

class ShipmentModel(BaseModel):
    shipment_id: str
    shipper: str
    origin_hub: str
    destination_hub: str
    dispatch_date: str
    expected_delivery: str
    actual_delivery: Optional[str] = None
    cargo_category: str
    shipment_status: str
    weight_tons: float
    truck_id: Optional[str] = None
    truck_capacity_tons: float = 0.0
    spare_capacity_tons: float = 0.0
    current_hub: str
    priority: str
    recovery_mode: Optional[str] = "N/A"
    detour_km: float = 0.0
    cost_saved_usd: float = 0.0
    cost_saved_inr: float = 0.0
    carbon_saved_kg: float = 0.0
    distance_to_destination_km: Optional[float] = None
    dedicated_cost_inr: Optional[float] = None
    piggyback_cost_inr: Optional[float] = None
    compliance: str = "Yes"
    is_misplaced: Optional[bool] = False

class DisruptRequest(BaseModel):
    shipment_id: Optional[str] = "SH004"
    anomaly_hub: Optional[str] = None

class PriorityWeights(BaseModel):
    cost_weight: float = 0.4
    time_weight: float = 0.4
    carbon_weight: float = 0.2

class MatchRequest(BaseModel):
    shipment_id: str = "SHP-1004"

class OptimizeRequest(BaseModel):
    shipment_id: str = "SHP-1004"
    truck_id: Optional[str] = "TRK-004"
    weights: Optional[PriorityWeights] = Field(default_factory=PriorityWeights)
    timeout_seconds: float = 2.0
    force_fallback: bool = False

class ExecuteRecoveryRequest(BaseModel):
    shipment_id: str = "SHP-1004"
    truck_id: str = "TRK-004"
    recovery_mode: str = "Direct Piggyback"
    detour_km: float = 0.0
    cost_saved_usd: Optional[float] = None
    cost_saved_inr: Optional[float] = None
    carbon_saved_kg: Optional[float] = 250.0
    hours_saved: float = 2.0
    new_route: Optional[List[str]] = None

class SystemMetrics(BaseModel):
    total_shipments: int
    active_misplaced: int
    active_in_transit: int
    total_delivered: int
    total_cost_saved_usd: float
    total_cost_saved_inr: float
    total_carbon_saved_kg: float
    active_trucks: int
