from typing import List, Tuple, Union, Optional
from pydantic import BaseModel, Field

class Hub(BaseModel):
    id: str = Field(..., description="Unique hub identifier, e.g., 'HUB-B'")
    name: str = Field(..., description="Descriptive hub name")
    location_coordinates: Union[Tuple[float, float], List[float]] = Field(
        ..., description="Geographical coordinates [latitude, longitude]"
    )

class Shipment(BaseModel):
    id: str = Field(..., description="Shipment tracking identifier")
    current_hub: str = Field(..., description="Current hub where shipment is located")
    destination: str = Field(..., description="Final destination hub")
    weight: float = Field(..., gt=0, description="Weight in kilograms")
    deadline: float = Field(..., gt=0, description="Maximum allowable delivery time in hours")
    priority: str = Field("MEDIUM", description="Shipment priority: CRITICAL, HIGH, MEDIUM, LOW")
    is_misplaced: bool = Field(True, description="Whether shipment is flagged as misplaced")

class VehicleRoute(BaseModel):
    id: str = Field(..., description="Vehicle / Route identifier")
    current_location: str = Field(..., description="Current hub of vehicle")
    destination: str = Field(..., description="Scheduled destination hub of vehicle")
    available_capacity: float = Field(..., ge=0, description="Available payload capacity in kg")
    cost_per_km: float = Field(..., gt=0, description="Marginal cost per kilometer in currency units")
    average_speed_kmh: Optional[float] = Field(60.0, description="Average transit speed in km/h")

class OptimizationRequest(BaseModel):
    misplaced_shipment: Shipment
    active_routes: List[VehicleRoute]
    hubs: List[Hub]

class PiggybackStrategy(BaseModel):
    route_id: str
    vehicle_origin: str
    vehicle_destination: str
    available_capacity: float
    shipment_weight: float
    remaining_capacity_after: float
    path: List[str]
    distance_km: float
    estimated_transit_hours: float
    deadline_hours: float
    estimated_cost: float
    priority_score: float
    meets_deadline: bool
    status: str
    details: str
    path_coordinates: Optional[List[List[float]]] = Field(default_factory=list, description="Real road waypoints [lat, lon]")

class OptimizationResponse(BaseModel):
    shipment_id: str
    total_candidates_evaluated: int
    viable_strategies_count: int
    strategies: List[PiggybackStrategy]
