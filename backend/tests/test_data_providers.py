import pytest
import os
import json
import urllib.error
from unittest.mock import patch, MagicMock

from data_providers.simulation_provider import SimulationProvider
from data_providers.live_train_provider import LiveTrainProvider

def test_simulation_provider():
    provider = SimulationProvider()
    trains = provider.get_trains()
    assert isinstance(trains, list)
    assert len(trains) > 0
    # Check if metadata fields are added
    for t in trains:
        assert "source" in t
        assert t["source"] == "RailOptima Simulation"
        assert "generated_at" in t

    mode_info = provider.get_mode_info()
    assert mode_info["mode"] == "simulation"
    assert mode_info["live_ready"] is True
    assert mode_info["live_configured"] is False

@patch.dict(os.environ, {"RAIL_LIVE_API_KEY": "dummy_key", "RAIL_LIVE_API_URL": "http://fake.api/trains"})
@patch('urllib.request.urlopen')
def test_live_provider_success(mock_urlopen):
    mock_response = MagicMock()
    mock_response.read.return_value = json.dumps([{"train_id": "L_123", "speed": 100}]).encode('utf-8')
    # urlopen returns a context manager
    mock_urlopen.return_value.__enter__.return_value = mock_response

    provider = LiveTrainProvider()
    trains = provider.get_trains()
    
    mock_urlopen.assert_called_once()
    assert len(trains) == 1
    assert trains[0]["train_id"] == "L_123"
    assert trains[0]["source"] == "Live RailOptima Provider"
    assert "generated_at" in trains[0]
    
    mode_info = provider.get_mode_info()
    assert mode_info["mode"] == "live"
    assert mode_info["live_configured"] is True

@patch.dict(os.environ, {"RAIL_LIVE_API_KEY": "dummy_key", "RAIL_LIVE_API_URL": "http://fake.api/trains"})
@patch('urllib.request.urlopen')
def test_live_provider_failure_fallback(mock_urlopen):
    mock_urlopen.side_effect = urllib.error.URLError("Connection timed out")
    
    provider = LiveTrainProvider()
    with pytest.raises(RuntimeError) as excinfo:
        trains = provider.get_trains()
    
    assert "Live API request failed" in str(excinfo.value)

@patch.dict(os.environ, {"RAIL_LIVE_API_KEY": "dummy_key", "RAIL_LIVE_API_URL": "http://fake.api/trains"})
@patch('urllib.request.urlopen')
def test_live_provider_malformed_fallback(mock_urlopen):
    mock_response = MagicMock()
    # Malformed response (dict instead of list)
    mock_response.read.return_value = json.dumps({"error": "Not a list"}).encode('utf-8')
    mock_urlopen.return_value.__enter__.return_value = mock_response

    provider = LiveTrainProvider()
    with pytest.raises(RuntimeError) as excinfo:
        trains = provider.get_trains()
    
    assert "Error processing live API response" in str(excinfo.value)

@patch.dict(os.environ, clear=True)
def test_live_provider_no_credentials():
    # Ensure RAIL_LIVE_API_KEY is not set
    if "RAIL_LIVE_API_KEY" in os.environ:
        del os.environ["RAIL_LIVE_API_KEY"]
        
    provider = LiveTrainProvider()
    with pytest.raises(RuntimeError) as excinfo:
        trains = provider.get_trains()
    
    assert "Live data provider is not configured" in str(excinfo.value)
    
    mode_info = provider.get_mode_info()
    assert mode_info["mode"] == "live"
    assert mode_info["live_configured"] is False
