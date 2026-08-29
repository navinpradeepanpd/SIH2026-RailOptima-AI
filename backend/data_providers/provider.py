from abc import ABC, abstractmethod
from typing import List, Dict, Any

class TrainDataProvider(ABC):
    @abstractmethod
    def get_trains(self) -> List[Dict[str, Any]]:
        """Fetch train data."""
        pass

    @abstractmethod
    def get_maintenance(self) -> List[Dict[str, Any]]:
        """Fetch maintenance data."""
        pass

    @abstractmethod
    def get_sections(self) -> List[Dict[str, Any]]:
        """Fetch sections data."""
        pass

    @abstractmethod
    def get_mode_info(self) -> Dict[str, Any]:
        """Return information about the provider's mode and status."""
        pass
