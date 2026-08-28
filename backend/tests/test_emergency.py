import pytest
from emergency.engine import replan_schedule

def test_emergency_replan_moves_lower_priority():
    trains = [{
        "train_id": "TRN_BLOCKER",
        "train_type": "Express",
        "section": "SEC_1",
        "planned_start": "2026-09-01T00:00:00",
        "planned_end": "2026-09-01T10:00:00",
        "priority": 1
    }]
    
    # Existing maintenance scheduled from 10:00 to 12:00
    maintenance = [{
        "request_id": "MNT_OLD",
        "department": "Engineering",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T12:00:00",
        "duration": 120,
        "severity": "Low",
        "urgency": "Routine",
        "safety_critical": False
    }]
    
    # Emergency request overlaps exactly at 10:00 to 11:00
    emergency = {
        "request_id": "EMG_1",
        "department": "Traction",
        "asset_type": "OHE",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "duration": 60,
        "severity": "Critical",
        "urgency": "Emergency",
        "safety_critical": True
    }
    
    result = replan_schedule(emergency, trains, maintenance, "2026-09-01T00:00:00", "2026-09-02T00:00:00")
    
    # MNT_OLD should be in affected_activities
    assert "MNT_OLD" in result["affected_activities"]["maintenance"]
    
    # We should have an action moving MNT_OLD
    assert len(result["actions"]) > 0
    move_action = result["actions"][0]
    assert "Move MNT_OLD" in move_action["action"]
    assert "higher safety priority" in move_action["reason"]
    
    # After schedule should contain both
    assert len(result["after_schedule"]) == 2
    
    # Ensure EMG_1 is scheduled at exactly 10:00
    emg_scheduled = next(x for x in result["after_schedule"] if x["request_id"] == "EMG_1")
    assert emg_scheduled["start_time"] == "2026-09-01T10:00:00"
