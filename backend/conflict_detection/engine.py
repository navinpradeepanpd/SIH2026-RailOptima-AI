from datetime import datetime
import uuid

def parse_time(time_str):
    return datetime.fromisoformat(time_str)

def get_severity(act1, act2):
    # Determine type of activities
    t1_is_train = "train_id" in act1
    t2_is_train = "train_id" in act2
    
    # Extract properties
    is_safety_critical_1 = act1.get("safety_critical", False) if not t1_is_train else False
    is_safety_critical_2 = act2.get("safety_critical", False) if not t2_is_train else False
    
    priority_1 = act1.get("priority", 99) if t1_is_train else 99
    priority_2 = act2.get("priority", 99) if t2_is_train else 99
    
    is_high_priority_train = (priority_1 <= 2) or (priority_2 <= 2)
    is_passenger_train = (priority_1 <= 4) or (priority_2 <= 4)
    
    # CRITICAL: safety-critical maintenance OR high priority passenger train involved
    if is_safety_critical_1 or is_safety_critical_2 or is_high_priority_train:
        return "CRITICAL"
        
    # HIGH: two maintenances overlapping, OR regular passenger train vs maintenance
    if (not t1_is_train and not t2_is_train) or is_passenger_train:
        return "HIGH"
        
    # MEDIUM: freight train vs maintenance
    if t1_is_train or t2_is_train:
        return "MEDIUM"
        
    # LOW: fallback
    return "LOW"

def get_reason(act1, act2):
    t1_type = "Train" if "train_id" in act1 else "Maintenance"
    t2_type = "Train" if "train_id" in act2 else "Maintenance"
    
    if t1_type == "Train" and t2_type == "Maintenance":
        return f"Train {act1['train_id']} ({act1['train_type']}) overlaps with {act2['department']} maintenance block."
    elif t1_type == "Maintenance" and t2_type == "Train":
        return f"Train {act2['train_id']} ({act2['train_type']}) overlaps with {act1['department']} maintenance block."
    elif t1_type == "Train" and t2_type == "Train":
        return f"Train {act1['train_id']} overlaps with Train {act2['train_id']}."
    else:
        return f"Maintenance block ({act1['department']}) overlaps with Maintenance block ({act2['department']})."

def detect_conflicts(trains, maintenance):
    conflicts = []
    summary_counts = {
        "total": 0,
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0
    }
    
    # Combine all activities into a list with uniform start/end/section
    activities = []
    
    for t in trains:
        activities.append({
            "type": "train",
            "data": t,
            "section": t["section"],
            "start": parse_time(t["planned_start"]),
            "end": parse_time(t["planned_end"])
        })
        
    for m in maintenance:
        activities.append({
            "type": "maintenance",
            "data": m,
            "section": m["section"],
            "start": parse_time(m["start_time"]),
            "end": parse_time(m["end_time"])
        })
        
    # Compare every pair (O(N^2) is fine for small simulation data)
    n = len(activities)
    for i in range(n):
        for j in range(i + 1, n):
            a1 = activities[i]
            a2 = activities[j]
            
            # Check section match
            if a1["section"] != a2["section"]:
                continue
                
            # Check time overlap (exclusive boundaries)
            if a1["start"] < a2["end"] and a1["end"] > a2["start"]:
                # Conflict detected
                overlap_start = max(a1["start"], a2["start"])
                overlap_end = min(a1["end"], a2["end"])
                
                act1_data = a1["data"]
                act2_data = a2["data"]
                
                severity = get_severity(act1_data, act2_data)
                reason = get_reason(act1_data, act2_data)
                
                id_1 = act1_data.get("train_id") or act1_data.get("request_id")
                id_2 = act2_data.get("train_id") or act2_data.get("request_id")
                
                depts = []
                if "department" in act1_data: depts.append(act1_data["department"])
                if "department" in act2_data: depts.append(act2_data["department"])
                
                conflict = {
                    "conflict_id": f"CNF_{str(uuid.uuid4())[:8]}",
                    "section": a1["section"],
                    "activity_1": id_1,
                    "activity_2": id_2,
                    "department(s)": depts,
                    "start_time": overlap_start.isoformat(),
                    "end_time": overlap_end.isoformat(),
                    "severity": severity,
                    "reason": reason
                }
                
                conflicts.append(conflict)
                summary_counts["total"] += 1
                summary_counts[severity] += 1
                
    return {
        "summary_counts": summary_counts,
        "conflicts": conflicts
    }
