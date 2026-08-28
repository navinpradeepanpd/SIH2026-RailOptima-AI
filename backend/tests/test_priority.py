import pytest
from priority_scoring.engine import calculate_priority

def test_high_priority_request():
    requests = [{
        "request_id": "MNT_HIGH",
        "department": "Engineering (TMS)",
        "asset_type": "Track replacement",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T12:00:00",
        "duration": 120,
        "severity": "Critical",
        "urgency": "Emergency",
        "safety_critical": True,
        "overdue_days": 2,
        "status": "Pending"
    }]
    
    result = calculate_priority(requests)
    assert len(result) == 1
    scored = result[0]
    
    # Base calculation:
    # safety_critical (+50)
    # Critical severity (+30)
    # Emergency (+30)
    # overdue 2 days (+10)
    # duration < 240 (+10)
    # Total = 130
    
    assert scored["priority_score"] == 130
    assert scored["priority_level"] == "CRITICAL"
    assert "Safety critical (+50)" in scored["reasons"]
    assert "Severe defect (+30)" in scored["reasons"]
    assert "Emergency urgency (+30)" in scored["reasons"]

def test_low_priority_request():
    requests = [{
        "request_id": "MNT_LOW",
        "department": "S&T (SMMS)",
        "asset_type": "Track circuit testing",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "end_time": "2026-09-01T20:00:00",
        "duration": 600,
        "severity": "Low",
        "urgency": "Routine",
        "safety_critical": False,
        "overdue_days": 0,
        "status": "Pending"
    }]
    
    result = calculate_priority(requests)
    assert len(result) == 1
    scored = result[0]
    
    # Base calculation:
    # duration > 480 (-10)
    # Total = -10
    
    assert scored["priority_score"] == -10
    assert scored["priority_level"] == "LOW"
    assert "Long duration" in scored["reasons"]

def test_sorting_order():
    requests = [
        {"request_id": "MNT_LOW", "severity": "Low", "safety_critical": False, "urgency": "Routine"},
        {"request_id": "MNT_HIGH", "severity": "Critical", "safety_critical": True, "urgency": "Emergency"}
    ]
    
    result = calculate_priority(requests)
    assert result[0]["request_id"] == "MNT_HIGH"
    assert result[1]["request_id"] == "MNT_LOW"
