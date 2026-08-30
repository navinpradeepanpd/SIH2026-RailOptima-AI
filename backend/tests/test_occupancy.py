import pytest
from datetime import datetime, timedelta
from conflict_detection.engine import detect_conflicts
from optimization.engine import run_optimization
from emergency.engine import replan_schedule

def test_same_section_overlap():
    trains = [{"train_id": "T1", "section": "SEC_1", "planned_start": "2026-09-01T10:00:00", "planned_end": "2026-09-01T11:00:00", "priority": 1}]
    maint = [{"request_id": "M1", "section": "SEC_1", "start_time": "2026-09-01T10:30:00", "end_time": "2026-09-01T11:30:00", "duration": 60}]
    res = detect_conflicts(trains, maint)
    assert res["summary_counts"]["total"] == 1
    c = res["conflicts"][0]
    assert c["activity_1"] == "T1"
    assert c["activity_2"] == "M1"

def test_different_section_no_conflict():
    trains = [{"train_id": "T1", "section": "SEC_1", "planned_start": "2026-09-01T10:00:00", "planned_end": "2026-09-01T11:00:00"}]
    maint = [{"request_id": "M1", "section": "SEC_2", "start_time": "2026-09-01T10:30:00", "end_time": "2026-09-01T11:30:00", "duration": 60}]
    res = detect_conflicts(trains, maint)
    assert res["summary_counts"]["total"] == 0

def test_same_section_different_track():
    trains = [{"train_id": "T1", "section": "SEC_1", "track": "TRK_UP", "planned_start": "2026-09-01T10:00:00", "planned_end": "2026-09-01T11:00:00"}]
    maint = [{"request_id": "M1", "section": "SEC_1", "track": "TRK_DOWN", "start_time": "2026-09-01T10:30:00", "end_time": "2026-09-01T11:30:00", "duration": 60}]
    res = detect_conflicts(trains, maint)
    assert res["summary_counts"]["total"] == 0

def test_same_section_same_track_overlap_details():
    trains = [{"train_id": "T1", "section": "SEC_1", "track": "TRK_UP", "planned_start": "2026-09-01T10:00:00", "planned_end": "2026-09-01T11:00:00", "priority": 1}]
    maint = [{"request_id": "M1", "section": "SEC_1", "track": "TRK_UP", "start_time": "2026-09-01T10:30:00", "end_time": "2026-09-01T11:30:00", "duration": 60}]
    res = detect_conflicts(trains, maint)
    assert res["summary_counts"]["total"] == 1
    c = res["conflicts"][0]
    assert c["track"] == "TRK_UP"
    
    # overlap from 10:30 to 11:00 = 30m (no buffer in tests)
    assert c["overlap_duration_minutes"] == 30
    assert c["severity"] == "CRITICAL"
    assert res["summary_counts"]["total_overlap_duration_minutes"] == 30

def test_optimizer_respects_occupancy():
    trains = [{"train_id": "T1", "section": "SEC_1", "track": "TRK_UP", "planned_start": "2026-09-01T10:00:00", "planned_end": "2026-09-01T11:00:00", "priority": 1}]
    maint = [{"request_id": "M1", "section": "SEC_1", "track": "TRK_UP", "original_start": "2026-09-01T10:30:00", "original_end": "2026-09-01T11:30:00", "duration": 60}]
    res = run_optimization(trains, maint, "2026-09-01T00:00:00", "2026-09-02T00:00:00")
    
    sched = res["scheduled_requests"][0]
    assert sched["shifted"] == True
    # T1 ends at 11:00 (no buffer). M1 starts at 11:00.
    assert sched["start_time"] == "2026-09-01T11:00:00"
    assert sched["decision_explanation"]["track"] == "TRK_UP"
    assert "T1" in sched["decision_explanation"]["conflict_ids"]

def test_no_feasible_slot():
    trains = [{"train_id": "T1", "section": "SEC_1", "track": "TRK_UP", "planned_start": "2026-09-01T00:00:00", "planned_end": "2026-09-02T00:00:00", "priority": 1}]
    maint = [{"request_id": "M1", "section": "SEC_1", "track": "TRK_UP", "original_start": "2026-09-01T10:30:00", "original_end": "2026-09-01T11:30:00", "duration": 60}]
    res = run_optimization(trains, maint, "2026-09-01T00:00:00", "2026-09-02T00:00:00")
    
    assert len(res["unscheduled_requests"]) == 1
    assert res["unscheduled_requests"][0]["status"] == "Unscheduled"
    
def test_emergency_replanning_track_isolation():
    trains = [{"train_id": "T1", "section": "SEC_1", "track": "TRK_DOWN", "planned_start": "2026-09-01T10:00:00", "planned_end": "2026-09-01T12:00:00", "priority": 1}]
    maint = [{"request_id": "M1", "section": "SEC_1", "track": "TRK_UP", "start_time": "2026-09-01T10:00:00", "end_time": "2026-09-01T11:00:00", "duration": 60}]
    emg = {
        "request_id": "EMG_1",
        "department": "Engineering",
        "section": "SEC_1",
        "track": "TRK_UP",
        "start_time": "2026-09-01T10:00:00",
        "duration": 60
    }
    res = replan_schedule(emg, trains, maint, "2026-09-01T00:00:00", "2026-09-02T00:00:00")
    
    # Train is on TRK_DOWN, emergency is on TRK_UP. Maint is on TRK_UP.
    # M1 gets shifted, T1 is unaffected.
    assert len(res["actions"]) == 1
    assert res["actions"][0]["request_id"] == "M1"
    assert "T1" not in res["affected_activities"]["trains"]
