import pytest
from conflict_detection.engine import detect_conflicts

def test_overlapping_train_block():
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
        "start_time": "2026-09-01T11:00:00",
        "end_time": "2026-09-01T14:00:00",
        "safety_critical": False
    }]
    
    result = detect_conflicts(trains, maintenance)
    assert result["summary_counts"]["total"] == 1
    assert result["summary_counts"]["HIGH"] == 1
    conflict = result["conflicts"][0]
    assert conflict["activity_1"] == "TRN_1"
    assert conflict["activity_2"] == "MNT_1"
    assert conflict["section"] == "SEC_1"

def test_non_overlapping_activities():
    trains = [{
        "train_id": "TRN_1",
        "train_type": "Express",
        "section": "SEC_1",
        "planned_start": "2026-09-01T08:00:00",
        "planned_end": "2026-09-01T10:00:00",
        "priority": 3
    }]
    maintenance = [{
        "request_id": "MNT_1",
        "department": "Engineering",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T14:00:00",
        "safety_critical": False
    }]
    
    result = detect_conflicts(trains, maintenance)
    assert result["summary_counts"]["total"] == 0
    assert len(result["conflicts"]) == 0

def test_maintenance_overlap():
    trains = []
    maintenance = [
        {
            "request_id": "MNT_1",
            "department": "Engineering",
            "section": "SEC_1",
            "start_time": "2026-09-01T10:00:00",
            "end_time": "2026-09-01T14:00:00",
            "safety_critical": False
        },
        {
            "request_id": "MNT_2",
            "department": "S&T",
            "section": "SEC_1",
            "start_time": "2026-09-01T12:00:00",
            "end_time": "2026-09-01T16:00:00",
            "safety_critical": True
        }
    ]
    
    result = detect_conflicts(trains, maintenance)
    assert result["summary_counts"]["total"] == 1
    assert result["summary_counts"]["CRITICAL"] == 1 # Since MNT_2 is safety_critical
    assert result["conflicts"][0]["activity_1"] == "MNT_1"
    assert result["conflicts"][0]["activity_2"] == "MNT_2"

def test_different_sections():
    trains = [{
        "train_id": "TRN_1",
        "train_type": "Express",
        "section": "SEC_2",
        "planned_start": "2026-09-01T10:00:00",
        "planned_end": "2026-09-01T12:00:00",
        "priority": 3
    }]
    maintenance = [{
        "request_id": "MNT_1",
        "department": "Engineering",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T12:00:00",
        "safety_critical": False
    }]
    
    result = detect_conflicts(trains, maintenance)
    assert result["summary_counts"]["total"] == 0
