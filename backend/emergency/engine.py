import copy
from datetime import datetime, timedelta
from optimization.engine import run_optimization
from conflict_detection.engine import detect_conflicts

def parse_time(time_str):
    return datetime.fromisoformat(time_str)

def replan_schedule(emergency_request, trains, maintenance, horizon_start_str, horizon_end_str):
    # 1. Baseline Schedule
    baseline_result = run_optimization(trains, maintenance, horizon_start_str, horizon_end_str)
    before_schedule = baseline_result["scheduled_requests"]
    
    # 2. Detect overlaps with the emergency block
    emg_start = parse_time(emergency_request["start_time"])
    emg_duration = timedelta(minutes=emergency_request["duration"])
    emg_end = emg_start + emg_duration
    emergency_request["end_time"] = emg_end.isoformat()
    
    # Mock it as a maintenance block for conflict detection
    emg_mock = [emergency_request]
    
    # Affected Trains
    affected_trains_raw = detect_conflicts(trains, emg_mock)["conflicts"]
    affected_trains = [c["activity_1"] for c in affected_trains_raw]
    
    # Affected Maintenance
    all_maint = before_schedule + emg_mock
    maint_conflicts = detect_conflicts([], all_maint)["conflicts"]
    
    affected_maint = []
    emg_id = emergency_request["request_id"]
    for c in maint_conflicts:
        if c["activity_1"] == emg_id:
            affected_maint.append(c["activity_2"])
        elif c["activity_2"] == emg_id:
            affected_maint.append(c["activity_1"])
    
    # 3. Re-optimize
    # We will treat the emergency block as an immovable constraint by injecting it into the trains list
    mock_train = {
        "train_id": emergency_request["request_id"],
        "train_type": "Emergency Block",
        "section": emergency_request["section"],
        "planned_start": emergency_request["start_time"],
        "planned_end": emergency_request["end_time"]
    }
    
    disrupted_trains = copy.deepcopy(trains)
    disrupted_trains.append(mock_train)
    
    # To "move only activities that actually need replanning", we set their requested start 
    # to the time they were assigned in the baseline schedule.
    # This prevents unaffected activities from randomly shifting to earlier newly-freed slots.
    replan_maintenance = copy.deepcopy(maintenance)
    baseline_dict = {req["request_id"]: req for req in before_schedule}
    
    for req in replan_maintenance:
        if req["request_id"] in baseline_dict:
            # They request the slot they had in baseline
            req["start_time"] = baseline_dict[req["request_id"]]["start_time"]
    
    # Run optimization again
    after_result = run_optimization(disrupted_trains, replan_maintenance, horizon_start_str, horizon_end_str)
    after_schedule = after_result["scheduled_requests"]
    
    # Add emergency block to the after schedule manually so it's included
    final_emg = copy.deepcopy(emergency_request)
    final_emg["status"] = "Emergency Scheduled"
    after_schedule.append(final_emg)
    
    # 4. Action Calculation (Delta)
    before_dict = {req["request_id"]: req for req in before_schedule}
    actions = []
    
    for req in after_schedule:
        if req["request_id"] == emergency_request["request_id"]:
            continue
            
        b_req = before_dict.get(req["request_id"])
        if b_req:
            if b_req["start_time"] != req["start_time"]:
                action_str = f"Move {req['request_id']} to {req['start_time']} - {req['end_time']}"
                reason_str = f"Emergency request {emergency_request['request_id']} ({emergency_request['department']}) has higher safety priority."
                actions.append({
                    "action": action_str,
                    "reason": reason_str
                })
        else:
            # It was unscheduled before, now scheduled?
            pass
            
    # Did anything get unscheduled?
    after_dict = {req["request_id"]: req for req in after_schedule}
    for req in before_schedule:
        if req["request_id"] not in after_dict:
            action_str = f"Cancel {req['request_id']}"
            reason_str = f"No alternative window available due to Emergency {emergency_request['request_id']}."
            actions.append({
                "action": action_str,
                "reason": reason_str
            })
            
    return {
        "before_schedule": before_schedule,
        "affected_activities": {
            "trains": affected_trains,
            "maintenance": affected_maint
        },
        "actions": actions,
        "after_schedule": after_schedule
    }
