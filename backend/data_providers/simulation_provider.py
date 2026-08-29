import json
import os
from typing import List, Dict, Any
from .provider import TrainDataProvider

class SimulationProvider(TrainDataProvider):
    def _load_data_file(self, filename: str) -> Any:
        # Assuming we are in backend/data_providers, data is in ../../data
        data_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', filename)
        if not os.path.exists(data_path):
            return []
        with open(data_path, 'r') as f:
            return json.load(f)

    def get_trains(self) -> List[Dict[str, Any]]:
        from datetime import datetime
        trains = self._load_data_file("trains.json")
        now = datetime.now().isoformat()
        for t in trains:
            t["_data_source"] = "simulation"
            t["_fetched_at"] = now
        return trains

    def get_maintenance(self) -> List[Dict[str, Any]]:
        return self._load_data_file("maintenance.json")

    def get_sections(self) -> List[Dict[str, Any]]:
        return self._load_data_file("sections.json")

    def get_mode_info(self) -> Dict[str, Any]:
        return {
            "mode": "simulation",
            "source": "Simulated RailOptima Dataset",
            "live_available": False
        }
