from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import os
from conflict_detection.engine import detect_conflicts
from priority_scoring.engine import calculate_priority
from optimization.engine import run_optimization
from emergency.engine import replan_schedule
from data_providers.simulation_provider import SimulationProvider
from data_providers.live_train_provider import LiveTrainProvider

RAIL_DATA_MODE = os.environ.get("RAIL_DATA_MODE", "simulation")
if RAIL_DATA_MODE == "live":
    data_provider = LiveTrainProvider()
else:
    data_provider = SimulationProvider()

def get_train_data():
    try:
        return data_provider.get_trains()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch train data: {e}")

def get_maintenance_data():
    try:
        return data_provider.get_maintenance()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance data: {e}")

def get_sections_data():
    try:
        return data_provider.get_sections()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sections data: {e}")

app = FastAPI(title="RailOptima AI API", description="Backend for RailOptima AI Simulation")

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in FRONTEND_ORIGIN.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    mode = "unknown"
    try:
        mode = data_provider.get_mode_info().get("mode", "unknown")
    except Exception:
        pass
    return {
        "status": "ok", 
        "service": "RailOptima AI API",
        "data_mode": mode
    }

@app.get("/api/data-mode")
def get_data_mode():
    try:
        return data_provider.get_mode_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch mode info: {e}")

@app.get("/api/trains")
def get_trains():
    return get_train_data()

@app.get("/api/maintenance")
def get_maintenance():
    return get_maintenance_data()

@app.get("/api/maintenance/priorities")
def get_maintenance_priorities():
    maintenance = get_maintenance_data()
    return calculate_priority(maintenance)

@app.get("/api/sections")
def get_sections():
    return get_sections_data()

class OptimizationRequest(BaseModel):
    planning_horizon_start: str
    planning_horizon_end: str
    trains: Optional[List[Dict[str, Any]]] = None
    maintenance: Optional[List[Dict[str, Any]]] = None

@app.post("/api/optimize")
def optimize_schedule(req: OptimizationRequest):
    trains = req.trains if req.trains is not None else get_train_data()
    maintenance = req.maintenance if req.maintenance is not None else get_maintenance_data()
    
    try:
        return run_optimization(
            trains, 
            maintenance, 
            req.planning_horizon_start, 
            req.planning_horizon_end
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {e}")

class PlanningRequest(BaseModel):
    start_date: Optional[str] = "2026-09-01T00:00:00"
    end_date: Optional[str] = None
    trains: Optional[List[Dict[str, Any]]] = None
    maintenance: Optional[List[Dict[str, Any]]] = None

from datetime import datetime, timedelta

@app.post("/api/planning/weekly")
def planning_weekly(req: PlanningRequest):
    trains = req.trains if req.trains is not None else get_train_data()
    maintenance = req.maintenance if req.maintenance is not None else get_maintenance_data()
    
    start_dt = datetime.fromisoformat(req.start_date)
    end_dt = datetime.fromisoformat(req.end_date) if req.end_date else start_dt + timedelta(days=7)
    
    try:
        return run_optimization(trains, maintenance, start_dt.isoformat(), end_dt.isoformat())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weekly planning failed: {e}")

@app.post("/api/planning/monthly")
def planning_monthly(req: PlanningRequest):
    trains = req.trains if req.trains is not None else get_train_data()
    maintenance = req.maintenance if req.maintenance is not None else get_maintenance_data()
    
    start_dt = datetime.fromisoformat(req.start_date)
    end_dt = datetime.fromisoformat(req.end_date) if req.end_date else start_dt + timedelta(days=30)
    
    try:
        return run_optimization(trains, maintenance, start_dt.isoformat(), end_dt.isoformat())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Monthly planning failed: {e}")

class EmergencyRequestPayload(BaseModel):
    emergency_request: Dict[str, Any]
    trains: Optional[List[Dict[str, Any]]] = None
    maintenance: Optional[List[Dict[str, Any]]] = None
    horizon_start: Optional[str] = "2026-09-01T00:00:00"
    horizon_end: Optional[str] = "2026-09-08T00:00:00"

@app.post("/api/emergency/replan")
def emergency_replan(req: EmergencyRequestPayload):
    trains = req.trains if req.trains is not None else get_train_data()
    maintenance = req.maintenance if req.maintenance is not None else get_maintenance_data()
    
    try:
        return replan_schedule(
            req.emergency_request, 
            trains, 
            maintenance, 
            req.horizon_start, 
            req.horizon_end
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emergency replanning failed: {e}")

@app.get("/api/simulation")
def get_simulation_data():
    return {
        "trains": get_train_data(),
        "maintenance": get_maintenance_data(),
        "sections": get_sections_data()
    }

@app.get("/api/conflicts")
def get_conflicts():
    trains = get_train_data()
    maintenance = get_maintenance_data()
    try:
        return detect_conflicts(trains, maintenance)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conflict detection failed: {e}")
