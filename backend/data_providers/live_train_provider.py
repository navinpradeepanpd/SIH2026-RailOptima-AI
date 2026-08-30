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

    def get_trains(self) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.error("Live data provider is not configured.")
            raise RuntimeError("Live data provider is not configured.")
        
        try:
            req = urllib.request.Request(self.api_url, headers={"Authorization": f"Bearer {self.api_key}"})
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                data = json.loads(response.read().decode())
                
            if not isinstance(data, list):
                raise ValueError("Malformed response: Expected a list of trains")
                
            now = datetime.now().isoformat()
            for t in data:
                t["source"] = "Live RailOptima Provider"
                t["mode"] = "live"
                t["is_live"] = True
                t["generated_at"] = now
                t["last_updated"] = now
                
            return data
            
        except urllib.error.URLError as e:
            logger.error(f"Live API request failed: {e}.")
            raise RuntimeError(f"Live API request failed: {e}.")
        except Exception as e:
            logger.error(f"Error processing live API response: {e}.")
            raise RuntimeError(f"Error processing live API response: {e}.")

    def get_maintenance(self) -> List[Dict[str, Any]]:
        raise NotImplementedError("Live provider does not currently support fetching maintenance schedules.")

    def get_sections(self) -> List[Dict[str, Any]]:
        raise NotImplementedError("Live provider does not currently support fetching sections.")

    def get_mode_info(self) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "mode": "live",
                "provider": "live",
                "live_ready": True,
                "live_configured": False,
                "message": "Live data provider is not configured."
            }
            
        return {
            "mode": "live",
            "provider": "live",
            "live_ready": True,
            "live_configured": True,
            "message": "Connected to authorized live provider."
        }

