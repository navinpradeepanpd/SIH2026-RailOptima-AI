from datetime import datetime, timedelta
from priority_scoring.engine import calculate_priority
from conflict_detection.engine import detect_conflicts

def parse_time(time_str):
    return datetime.fromisoformat(time_str)

def get_free_windows(occupied_intervals, horizon_start, horizon_end):
    # occupied_intervals is a list of (start, end)
    # Merge overlapping intervals
    if not occupied_intervals:
        return [(horizon_start, horizon_end)]
        
    occupied_intervals.sort(key=lambda x: x[0])
    merged = []
    current_start, current_end = occupied_intervals[0]
    
    for start, end in occupied_intervals[1:]:
        if start <= current_end:
            current_end = max(current_end, end)
        else:
            merged.append((current_start, current_end))
            current_start, current_end = start, end
    merged.append((current_start, current_end))
    
    free_windows = []
    current_time = horizon_start
    
    for start, end in merged:
        if current_time < start:
            free_windows.append((current_time, start))
        current_time = max(current_time, end)
        
    if current_time < horizon_end:
        free_windows.append((current_time, horizon_end))
        
    return free_windows

def run_optimization(trains, maintenance, horizon_start_str, horizon_end_str):
    horizon_start = parse_time(horizon_start_str)
    horizon_end = parse_time(horizon_end_str)
    
    # 1. Pre-optimization conflicts
    before_conflicts = detect_conflicts(trains, maintenance)["summary_counts"]
    
    # 2. Priority Scoring
    scored_maintenance = calculate_priority(maintenance)
    
    # 3. Build initial occupied intervals per section (from trains)
    section_occupancy = {}
    for t in trains:
        sec = t["section"]
        if sec not in section_occupancy:
            section_occupancy[sec] = []
        section_occupancy[sec].append((parse_time(t["planned_start"]), parse_time(t["planned_end"])))
        
    scheduled_requests = []
    unscheduled_requests = []
    
    # 4. Greedy Assignment
    for req in scored_maintenance:
        sec = req["section"]
        duration_mins = req["duration"]
        duration_td = timedelta(minutes=duration_mins)
        
        # Get free windows for this section
        occupied = section_occupancy.get(sec, [])
        free_windows = get_free_windows(occupied, horizon_start, horizon_end)
        
        assigned = False
        for w_start, w_end in free_windows:
            if (w_end - w_start) >= duration_td:
                # Assign to earliest feasible time in this window
                new_start = w_start
                new_end = w_start + duration_td
                
                req["start_time"] = new_start.isoformat()
                req["end_time"] = new_end.isoformat()
                req["status"] = "Scheduled"
                
                scheduled_requests.append(req)
                
                # Update occupancy
                if sec not in section_occupancy:
                    section_occupancy[sec] = []
                section_occupancy[sec].append((new_start, new_end))
                assigned = True
                break
                
        if not assigned:
            req["status"] = "Unscheduled"
            req["reason"] = f"No continuous time window of {duration_mins} mins available on {sec}."
            unscheduled_requests.append(req)
            
    # 5. Post-optimization conflicts
    after_conflicts = detect_conflicts(trains, scheduled_requests)["summary_counts"]
    
    # 6. Utilization Stats
    total_hours_requested = sum(req["duration"] for req in scored_maintenance) / 60.0
    total_hours_scheduled = sum(req["duration"] for req in scheduled_requests) / 60.0
    total_requests = len(scored_maintenance)
    critical_completed = len([req for req in scheduled_requests if req.get("priority_level") == "CRITICAL"])
    
    return {
        "scheduled_requests": scheduled_requests,
        "unscheduled_requests": unscheduled_requests,
        "conflicts_before": before_conflicts,
        "conflicts_after": after_conflicts,
        "summary_metrics": {
            "total_maintenance_requests": total_requests,
            "scheduled_requests": len(scheduled_requests),
            "unscheduled_requests": len(unscheduled_requests),
            "block_hours": round(total_hours_requested, 2),
            "utilized_block_hours": round(total_hours_scheduled, 2),
            "critical_maintenance_completed": critical_completed,
            "conflicts_resolved": before_conflicts["total"] - after_conflicts["total"]
        }
    }
