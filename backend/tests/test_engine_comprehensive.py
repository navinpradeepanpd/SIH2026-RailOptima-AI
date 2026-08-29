import pytest
from datetime import datetime, timedelta
from optimization.engine import run_optimization
from emergency.engine import replan_schedule
from conflict_detection.engine import detect_conflicts

def test_maintenance_maintenance_overlap_and_priority_scheduling():
    # Two maintenance blocks on same section requesting same time
    # Priority 1 (Critical) should get the requested slot.
    # Priority 2 (Low) should be shifted to after Priority 1.
    maintenance = [
        {
            "request_id": "MNT_LOW",
            "department": "Engineering",
            "section": "SEC_1",
            "start_time": "2026-09-01T10:00:00",
            "end_time": "2026-09-01T12:00:00",
            "duration": 120,
            "severity": "Low",
            "urgency": "Routine",
            "safety_critical": False
        },
        {
            "request_id": "MNT_CRIT",
            "department": "Traction",
            "section": "SEC_1",
            "start_time": "2026-09-01T10:00:00",
            "end_time": "2026-09-01T14:00:00",
            "duration": 240,
            "severity": "Critical",
            "urgency": "Emergency",
            "safety_critical": True
        }
    ]
    
    result = run_optimization([], maintenance, "2026-09-01T00:00:00", "2026-09-02T00:00:00")
    
    scheduled = {req["request_id"]: req for req in result["scheduled_requests"]}
    
    assert len(scheduled) == 2
    
    # MNT_CRIT gets its requested time
    assert scheduled["MNT_CRIT"]["start_time"] == "2026-09-01T10:00:00"
    assert scheduled["MNT_CRIT"]["shifted"] is False
    
    # MNT_LOW gets shifted to after MNT_CRIT ends (14:00)
    assert scheduled["MNT_LOW"]["start_time"] == "2026-09-01T14:00:00"
    assert scheduled["MNT_LOW"]["shifted"] is True
    assert scheduled["MNT_LOW"]["shift_duration"] == 240
    
def test_emergency_cascading_replanning_and_preservation():
    # 1 Train, 1 Mnt (Low) at 10:00, 1 Mnt (High) at 14:00
    # Emergency injected at 10:00.
    # Low Mnt should be pushed back to 14:00. High Mnt should be pushed back to 16:00.
    trains = []
    maintenance = [
        {
            "request_id": "MNT_1",
            "department": "Engineering",
            "section": "SEC_1",
            "start_time": "2026-09-01T10:00:00",
            "end_time": "2026-09-01T12:00:00",
            "duration": 120,
            "severity": "Low",
            "urgency": "Routine",
            "safety_critical": False
        },
        {
            "request_id": "MNT_UNAFFECTED",
            "department": "S&T",
            "section": "SEC_2", # Different section! Should be perfectly preserved
            "start_time": "2026-09-01T10:00:00",
            "end_time": "2026-09-01T12:00:00",
            "duration": 120,
            "severity": "Low",
            "urgency": "Routine",
            "safety_critical": False
        }
    ]
    
    emergency_req = {
        "request_id": "EMG_1",
        "department": "Engineering",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T14:00:00",
        "duration": 240,
        "severity": "Critical",
        "urgency": "Emergency",
        "safety_critical": True
    }
    
    result = replan_schedule(emergency_req, trains, maintenance, "2026-09-01T00:00:00", "2026-09-03T00:00:00")
    
    after_schedule = {req["request_id"]: req for req in result["after_schedule"]}
    
    # SEC_2 MNT_UNAFFECTED should not have moved
    assert after_schedule["MNT_UNAFFECTED"]["start_time"] == "2026-09-01T10:00:00"
    
    # MNT_1 was at 10:00, but EMG_1 took 10:00 to 14:00. So MNT_1 shifts to 14:00.
    assert after_schedule["MNT_1"]["start_time"] == "2026-09-01T14:00:00"
    
    # Actions should only contain MNT_1 shift
    actions = result["actions"]
    assert len(actions) == 1
    assert "MNT_1" in actions[0]["action"]
    assert "MNT_UNAFFECTED" not in actions[0]["action"]

def test_before_after_kpi_calculations():
    # Setup conflicting situation to test metrics
    trains = [{
        "train_id": "TRN_1",
        "train_type": "Express",
        "section": "SEC_1",
        "planned_start": "2026-09-01T10:00:00",
        "planned_end": "2026-09-01T12:00:00",
        "priority": 3
    }]
    maintenance = [{
        "request_id": "MNT_1",
        "department": "Engineering",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T14:00:00",
        "duration": 240,
        "severity": "Critical",
        "urgency": "Emergency",
        "safety_critical": True
    }]
    
    result = run_optimization(trains, maintenance, "2026-09-01T00:00:00", "2026-09-03T00:00:00")
    metrics = result["summary_metrics"]
    
    assert metrics["total_maintenance_requests"] == 1
    assert metrics["scheduled_requests"] == 1
    assert metrics["unscheduled_requests"] == 0
    assert metrics["block_hours"] == 4.0
    assert metrics["utilized_block_hours"] == 4.0
    assert metrics["critical_maintenance_completed"] == 1
    assert metrics["conflicts_resolved"] == 1
