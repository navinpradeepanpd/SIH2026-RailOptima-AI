import os
import logging
import json
import urllib.request
import urllib.error
from datetime import datetime
from typing import List, Dict, Any
from .provider import TrainDataProvider
from .simulation_provider import SimulationProvider

logger = logging.getLogger(__name__)

class LiveTrainProvider(TrainDataProvider):
    def __init__(self):
        self.api_key = os.environ.get("RAIL_LIVE_API_KEY")
        self.api_url = os.environ.get("RAIL_LIVE_API_URL", "https://api.indianrailways.gov.example/v1/trains")
        self.timeout = int(os.environ.get("RAIL_LIVE_API_TIMEOUT", "5"))
        self.fallback_provider = SimulationProvider()

    def get_trains(self) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("No live API credentials found. Falling back to simulation data.")
            return self.fallback_provider.get_trains()
        
        try:
            req = urllib.request.Request(self.api_url, headers={"Authorization": f"Bearer {self.api_key}"})
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                data = json.loads(response.read().decode())
                
            if not isinstance(data, list):
                raise ValueError("Malformed response: Expected a list of trains")
                
            now = datetime.now().isoformat()
            for t in data:
                t["_data_source"] = "live"
                t["_fetched_at"] = now
                
            return data
            
        except urllib.error.URLError as e:
            logger.error(f"Live API request failed: {e}. Falling back to simulation data.")
        except Exception as e:
            logger.error(f"Error processing live API response: {e}. Falling back to simulation data.")
            
        return self.fallback_provider.get_trains()

    def get_maintenance(self) -> List[Dict[str, Any]]:
        # Maintenance requests are internally generated, not pulled from live API
        return self.fallback_provider.get_maintenance()

    def get_sections(self) -> List[Dict[str, Any]]:
        # Sections are static network topology, not pulled from live API
        return self.fallback_provider.get_sections()

    def get_mode_info(self) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "mode": "simulation",
                "source": "Simulated RailOptima Dataset (Live Fallback - No Credentials)",
                "live_available": False
            }
            
        return {
            "mode": "live",
            "source": "Live RailOptima Provider",
            "live_available": True
        }

