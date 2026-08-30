import pytest
from optimization.engine import run_optimization

def test_optimization_resolves_conflict():
    # Setup conflicting situation
    trains = [{
        "train_id": "TRN_1",
        "train_type": "Express",
        "section": "SEC_1",
        "planned_start": "2026-09-01T10:00:00",
        "planned_end": "2026-09-01T12:00:00",
        "priority": 3
    }]
    # Maintenance wants to run 10:00 to 14:00 (overlaps with train)
    maintenance = [{
        "request_id": "MNT_1",
        "department": "Engineering",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T14:00:00",
        "duration": 240, # 4 hours
        "safety_critical": True
    }]
    
    result = run_optimization(trains, maintenance, "2026-09-01T00:00:00", "2026-09-03T00:00:00")
    
    # Assert conflict existed before
    assert result["conflicts_before"]["total"] > 0
    
    # Assert conflict is resolved
    assert result["conflicts_after"]["total"] == 0
    
    # Assert request is scheduled and moved to a safe window
    assert len(result["scheduled_requests"]) == 1
    scheduled_mnt = result["scheduled_requests"][0]
    assert scheduled_mnt["status"] == "Scheduled"
    
    # Train occupies 10 to 12. Earliest free window starting at or after 10:00 is 12:00.
    assert scheduled_mnt["start_time"] == "2026-09-01T12:00:00"
    
    # Assert decision explanation exists
    assert "decision_explanation" in scheduled_mnt
    explanation = scheduled_mnt["decision_explanation"]
    assert explanation is not None
    assert "TRN_1" in explanation["conflict_ids"]
    assert explanation["shift_duration"] == 120
    assert explanation["original_start"] == "2026-09-01T10:00:00"
    assert explanation["optimized_start"] == "2026-09-01T12:00:00"

def test_unscheduled_due_to_no_window():
    # Train occupies entire 24h horizon
    trains = [{
        "train_id": "TRN_1",
        "train_type": "Freight",
        "section": "SEC_1",
        "planned_start": "2026-09-01T00:00:00",
        "planned_end": "2026-09-02T00:00:00",
        "priority": 5
    }]
    # Maintenance wants 4 hours on same section
    maintenance = [{
        "request_id": "MNT_1",
        "department": "Engineering",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T14:00:00",
        "duration": 240,
        "severity": "Low",
        "urgency": "Routine",
        "safety_critical": False
    }]
    
    result = run_optimization(trains, maintenance, "2026-09-01T00:00:00", "2026-09-02T00:00:00")
    
    assert len(result["scheduled_requests"]) == 0
    assert len(result["unscheduled_requests"]) == 1
    
    unscheduled = result["unscheduled_requests"][0]
    assert unscheduled["status"] == "Unscheduled"
    assert "No feasible" in unscheduled["reason"]
    
    # Assert decision explanation exists for rejection
    assert "decision_explanation" in unscheduled
    explanation = unscheduled["decision_explanation"]
    assert explanation is not None
    assert "TRN_1" in explanation["conflict_ids"]
    assert explanation["optimized_start"] is None
    assert "Reject" in explanation["decision"]
