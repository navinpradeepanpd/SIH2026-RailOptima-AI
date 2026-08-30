from datetime import datetime, timedelta
import uuid
import os

SAFETY_BUFFER_MINUTES = int(os.getenv("SAFETY_BUFFER_MINUTES", "30"))

def parse_time(time_str):
    return datetime.fromisoformat(time_str)

def get_severity(act1, act2):
    t1_is_train = "train_id" in act1
    t2_is_train = "train_id" in act2
    
    is_safety_critical_1 = act1.get("safety_critical", False) if not t1_is_train else False
    is_safety_critical_2 = act2.get("safety_critical", False) if not t2_is_train else False
    
    priority_1 = act1.get("priority", 99) if t1_is_train else 99
    priority_2 = act2.get("priority", 99) if t2_is_train else 99
    
    category_1 = act1.get("category", "") if t1_is_train else ""
    category_2 = act2.get("category", "") if t2_is_train else ""
    
    # Infer passenger if category missing but priority <= 4
    has_passenger_train = category_1 == "Passenger" or category_2 == "Passenger" or (t1_is_train and priority_1 <= 4) or (t2_is_train and priority_2 <= 4)
    has_high_priority_train = priority_1 <= 2 or priority_2 <= 2
    
    if is_safety_critical_1 or is_safety_critical_2 or has_high_priority_train:
        return "CRITICAL"
        
    if has_passenger_train or (not t1_is_train and not t2_is_train):
        return "HIGH"
        
    if t1_is_train or t2_is_train:
        return "MEDIUM"
        
    return "LOW"

def get_reason(act1, act2):
    t1_is_train = "train_id" in act1
    t2_is_train = "train_id" in act2
    
    if t1_is_train and not t2_is_train:
        return f"Train {act1.get('train_name', act1.get('train_id'))} ({act1.get('category', 'Unknown')}) overlaps with {act2.get('department', 'Maintenance')} block."
    elif not t1_is_train and t2_is_train:
        return f"Train {act2.get('train_name', act2.get('train_id'))} ({act2.get('category', 'Unknown')}) overlaps with {act1.get('department', 'Maintenance')} block."
    elif t1_is_train and t2_is_train:
        return f"Train {act1.get('train_name', act1.get('train_id'))} overlaps with Train {act2.get('train_name', act2.get('train_id'))}."
    else:
        return f"Maintenance ({act1.get('department', 'Unknown')}) overlaps with Maintenance ({act2.get('department', 'Unknown')})."

def detect_conflicts(trains, maintenance):
    conflicts = []
    summary_counts = {
        "total": 0,
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
        "total_overlap_duration_minutes": 0
    }
    
    activities = []
    
    for t in trains:
        # Add safety buffer to train occupancy
        activities.append({
            "type": "train",
            "data": t,
            "section": t["section"],
            "start": parse_time(t["planned_start"]) - timedelta(minutes=SAFETY_BUFFER_MINUTES),
            "end": parse_time(t["planned_end"]) + timedelta(minutes=SAFETY_BUFFER_MINUTES)
        })
        
    for m in maintenance:
        activities.append({
            "type": "maintenance",
            "data": m,
            "section": m["section"],
            "start": parse_time(m.get("start_time", m.get("original_start"))),
            "end": parse_time(m.get("end_time", m.get("original_end")))
        })
        
    n = len(activities)
    for i in range(n):
        for j in range(i + 1, n):
            a1 = activities[i]
            a2 = activities[j]
            
            if a1["section"] != a2["section"]:
                continue
                
            track1 = a1["data"].get("track")
            track2 = a2["data"].get("track")
            if track1 and track2 and track1 != track2:
                continue
                
            # If both are trains, skip conflict detection for now (focus on train vs maintenance and maint vs maint)
            if a1["type"] == "train" and a2["type"] == "train":
                continue
                
            if a1["start"] < a2["end"] and a1["end"] > a2["start"]:
                overlap_start = max(a1["start"], a2["start"])
                overlap_end = min(a1["end"], a2["end"])
                overlap_duration_mins = int((overlap_end - overlap_start).total_seconds() / 60)
                
                act1_data = a1["data"]
                act2_data = a2["data"]
                
                severity = get_severity(act1_data, act2_data)
                reason = get_reason(act1_data, act2_data)
                
                # Check if it's purely a buffer overlap (meaning original times don't overlap, only buffer does)
                # To do this, check original times.
                orig_a1_start = parse_time(act1_data.get("planned_start") or act1_data.get("start_time", act1_data.get("original_start")))
                orig_a1_end = parse_time(act1_data.get("planned_end") or act1_data.get("end_time", act1_data.get("original_end")))
                orig_a2_start = parse_time(act2_data.get("planned_start") or act2_data.get("start_time", act2_data.get("original_start")))
                orig_a2_end = parse_time(act2_data.get("planned_end") or act2_data.get("end_time", act2_data.get("original_end")))
                
                if orig_a1_start >= orig_a2_end or orig_a1_end <= orig_a2_start:
                    reason += f" (Violates {SAFETY_BUFFER_MINUTES}m safety buffer)"
                
                id_1 = act1_data.get("train_id") or act1_data.get("request_id")
                id_2 = act2_data.get("train_id") or act2_data.get("request_id")
                
                type_1 = act1_data.get("train_type", act1_data.get("department", "Unknown"))
                type_2 = act2_data.get("train_type", act2_data.get("department", "Unknown"))
                
                conflict = {
                    "conflict_id": f"CNF_{str(uuid.uuid4())[:8]}",
                    "activity_1": id_1,
                    "activity_2": id_2,
                    "activity_1_type": type_1,
                    "activity_2_type": type_2,
                    "section": a1["section"],
                    "track": track1 if track1 == track2 else (track1 or track2 or "Unknown"),
                    "overlap_start": overlap_start.isoformat(),
                    "overlap_end": overlap_end.isoformat(),
                    "overlap_duration_minutes": overlap_duration_mins,
                    "severity": severity,
                    "reason": reason
                }
                
                conflicts.append(conflict)
                summary_counts["total"] += 1
                summary_counts[severity] += 1
                summary_counts["total_overlap_duration_minutes"] += overlap_duration_mins
                
    return {
        "summary_counts": summary_counts,
        "conflicts": conflicts
    }
