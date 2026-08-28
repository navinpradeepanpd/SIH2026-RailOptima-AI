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

app = FastAPI(title="RailOptima AI API", description="Backend for RailOptima AI Simulation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "RailOptima AI Backend"}

def load_data_file(filename: str):
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', filename)
    if not os.path.exists(data_path):
        raise HTTPException(status_code=404, detail=f"Data file {filename} not found.")
    with open(data_path, 'r') as f:
        return json.load(f)

@app.get("/api/trains")
def get_trains():
    return load_data_file("trains.json")

@app.get("/api/maintenance")
def get_maintenance():
    return load_data_file("maintenance.json")

@app.get("/api/maintenance/priorities")
def get_maintenance_priorities():
    maintenance = load_data_file("maintenance.json")
    return calculate_priority(maintenance)

@app.get("/api/sections")
def get_sections():
    return load_data_file("sections.json")

class OptimizationRequest(BaseModel):
    planning_horizon_start: str
    planning_horizon_end: str
    trains: Optional[List[Dict[str, Any]]] = None
    maintenance: Optional[List[Dict[str, Any]]] = None

@app.post("/api/optimize")
def optimize_schedule(req: OptimizationRequest):
    trains = req.trains if req.trains is not None else load_data_file("trains.json")
    maintenance = req.maintenance if req.maintenance is not None else load_data_file("maintenance.json")
    
    return run_optimization(
        trains, 
        maintenance, 
        req.planning_horizon_start, 
        req.planning_horizon_end
    )

class PlanningRequest(BaseModel):
    start_date: Optional[str] = "2026-09-01T00:00:00"
    end_date: Optional[str] = None
    trains: Optional[List[Dict[str, Any]]] = None
    maintenance: Optional[List[Dict[str, Any]]] = None

from datetime import datetime, timedelta

@app.post("/api/planning/weekly")
def planning_weekly(req: PlanningRequest):
    trains = req.trains if req.trains is not None else load_data_file("trains.json")
    maintenance = req.maintenance if req.maintenance is not None else load_data_file("maintenance.json")
    
    start_dt = datetime.fromisoformat(req.start_date)
    end_dt = datetime.fromisoformat(req.end_date) if req.end_date else start_dt + timedelta(days=7)
    
    return run_optimization(trains, maintenance, start_dt.isoformat(), end_dt.isoformat())

@app.post("/api/planning/monthly")
def planning_monthly(req: PlanningRequest):
    trains = req.trains if req.trains is not None else load_data_file("trains.json")
    maintenance = req.maintenance if req.maintenance is not None else load_data_file("maintenance.json")
    
    start_dt = datetime.fromisoformat(req.start_date)
    end_dt = datetime.fromisoformat(req.end_date) if req.end_date else start_dt + timedelta(days=30)
    
    return run_optimization(trains, maintenance, start_dt.isoformat(), end_dt.isoformat())

class EmergencyRequestPayload(BaseModel):
    emergency_request: Dict[str, Any]
    trains: Optional[List[Dict[str, Any]]] = None
    maintenance: Optional[List[Dict[str, Any]]] = None
    horizon_start: Optional[str] = "2026-09-01T00:00:00"
    horizon_end: Optional[str] = "2026-09-08T00:00:00"

@app.post("/api/emergency/replan")
def emergency_replan(req: EmergencyRequestPayload):
    trains = req.trains if req.trains is not None else load_data_file("trains.json")
    maintenance = req.maintenance if req.maintenance is not None else load_data_file("maintenance.json")
    
    return replan_schedule(
        req.emergency_request, 
        trains, 
        maintenance, 
        req.horizon_start, 
        req.horizon_end
    )

@app.get("/api/simulation")
def get_simulation_data():
    return {
        "trains": load_data_file("trains.json"),
        "maintenance": load_data_file("maintenance.json"),
        "sections": load_data_file("sections.json")
    }

@app.get("/api/conflicts")
def get_conflicts():
    trains = load_data_file("trains.json")
    maintenance = load_data_file("maintenance.json")
    return detect_conflicts(trains, maintenance)
