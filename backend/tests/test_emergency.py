import pytest
from emergency.engine import replan_schedule
import copy

def test_emergency_replan_moves_lower_priority():
    trains = [{
        "train_id": "TRN_BLOCKER",
        "train_type": "Express",
        "section": "SEC_1",
        "planned_start": "2026-09-01T00:00:00",
        "planned_end": "2026-09-01T10:00:00",
        "priority": 1
    }]
    
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
    
    assert "MNT_OLD" in result["affected_activities"]["maintenance"]
    assert len(result["actions"]) > 0
    move_action = result["actions"][0]
    assert "Move MNT_OLD" in move_action["action"]
    assert "higher safety priority" in move_action["reason"]
    assert len(result["after_schedule"]) == 2
    emg_scheduled = next(x for x in result["after_schedule"] if x["request_id"] == "EMG_1")
    assert emg_scheduled["start_time"] == "2026-09-01T10:00:00"

def get_intelligence_scenario():
    trains = []
    
    maintenance = [
        {
            "request_id": "MNT_UNCHANGED",
            "department": "Track",
            "section": "SEC_1",
            "start_time": "2026-09-01T08:00:00",
            "end_time": "2026-09-01T09:00:00",
            "duration": 60,
            "severity": "High",
            "urgency": "Routine",
            "safety_critical": True
        },
        {
            "request_id": "MNT_A",
            "department": "Track",
            "section": "SEC_1",
            "start_time": "2026-09-01T10:00:00",
            "end_time": "2026-09-01T11:00:00",
            "duration": 60,
            "severity": "Critical",
            "urgency": "Routine",
            "safety_critical": True
        },
        {
            "request_id": "MNT_B",
            "department": "Track",
            "section": "SEC_1",
            "start_time": "2026-09-01T11:00:00",
            "end_time": "2026-09-01T12:00:00",
            "duration": 60,
            "severity": "Critical",
            "urgency": "Routine",
            "safety_critical": True
        },
        {
            "request_id": "MNT_C",
            "department": "Track",
            "section": "SEC_1",
            "start_time": "2026-09-01T16:00:00",
            "end_time": "2026-09-01T17:00:00",
            "duration": 60,
            "severity": "Low",
            "urgency": "Routine",
            "safety_critical": False
        },
        {
            "request_id": "MNT_D",
            "department": "Track",
            "section": "SEC_1",
            "start_time": "2026-09-01T17:00:00",
            "end_time": "2026-09-01T18:00:00",
            "duration": 60,
            "severity": "Low",
            "urgency": "Routine",
            "safety_critical": False
        }
    ]
    
    emergency = {
        "request_id": "EMG_DISRUPTION",
        "department": "Track",
        "asset_type": "Track",
        "section": "SEC_1",
        "start_time": "2026-09-01T10:00:00",
        "duration": 360,  # 10:00 to 16:00
        "severity": "Critical",
        "urgency": "Emergency",
        "safety_critical": True
    }
    
    return emergency, trains, maintenance, "2026-09-01T08:00:00", "2026-09-01T19:00:00"

def test_emergency_intelligence_features():
    emergency, trains, maintenance, horizon_start, horizon_end = get_intelligence_scenario()
    
    # Execute Surgical Replanning
    result = replan_schedule(emergency, trains, maintenance, horizon_start, horizon_end)
    
    # Extract Outputs
    summary = result["summary_metrics"]
    actions = result["actions"]
    affected_maint = result["affected_activities"]["maintenance"]
    after_schedule = result["after_schedule"]
    
    # 1 & 5. TEST DIRECT IMPACT & SUMMARY METRICS
    assert "MNT_A" in affected_maint
    assert "MNT_B" in affected_maint
    assert "MNT_UNCHANGED" not in affected_maint
    assert "MNT_C" not in affected_maint
    assert "MNT_D" not in affected_maint
    
    assert summary["directly_affected"] == 2
    assert summary["cascade_affected"] == 2
    assert summary["unchanged"] == 1
    assert summary["shifted"] == 3
    assert summary["unscheduled"] == 1
    assert "MNT_C" in summary["cascade_activities"]
    assert "MNT_D" in summary["cascade_activities"]
    
    # 2 & 9. TEST UNCHANGED CLASSIFICATION & SURGICAL REPLANNING
    # MNT_UNCHANGED should be exactly at baseline start 08:00
    unchanged_block = next((x for x in after_schedule if x["request_id"] == "MNT_UNCHANGED"), None)
    assert unchanged_block is not None
    assert unchanged_block["start_time"] == "2026-09-01T08:00:00"
    assert not any(a["request_id"] == "MNT_UNCHANGED" for a in actions)
    
    # 3. TEST SHIFTED CLASSIFICATION & CASCADE SHIFT
    action_c = next((a for a in actions if a["request_id"] == "MNT_C"), None)
    assert action_c is not None
    assert action_c["type"] == "SHIFTED"
    assert action_c["shift_minutes"] == 120  # shifted from 16:00 to 18:00
    
    # 4. TEST UNSCHEDULED CLASSIFICATION & CASCADE UNSCHEDULED
    action_d = next((a for a in actions if a["request_id"] == "MNT_D"), None)
    assert action_d is not None
    assert action_d["type"] == "UNSCHEDULED"
    
    # 6. TEST EMERGENCY DECISION EXPLANATION
    # The action for MNT_C (Shifted) should contain decision explanation
    assert action_c.get("decision_explanation") is not None
    expl_c = action_c["decision_explanation"]
    assert "decision" in expl_c
    assert "conflict_ids" in expl_c
    assert "MNT_A" in expl_c["conflict_ids"]
    
    # The action for MNT_D (Unscheduled) should contain decision explanation
    assert action_d.get("decision_explanation") is not None
    expl_d = action_d["decision_explanation"]
    assert "decision" in expl_d
    assert "constraint" in expl_d
    
    # 8. TEST EMERGENCY TIMELINE DATA
    # Verify the emergency response contains sufficient real data for the timeline
    emg_scheduled = next((x for x in after_schedule if x["request_id"] == "EMG_DISRUPTION"), None)
    assert emg_scheduled is not None
    assert emg_scheduled["start_time"] == "2026-09-01T10:00:00"
    assert emg_scheduled["section"] == "SEC_1"
    
    # 10. TEST REPEATABILITY
    # Ensure SIH Demo Mode is perfectly deterministic by running it a second time
    emergency2, trains2, maintenance2, h_start2, h_end2 = get_intelligence_scenario()
    result2 = replan_schedule(emergency2, trains2, maintenance2, h_start2, h_end2)
    assert result2["summary_metrics"] == result["summary_metrics"]
    assert [a["request_id"] for a in result2["actions"]] == [a["request_id"] for a in result["actions"]]
