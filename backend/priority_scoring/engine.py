def calculate_priority(maintenance_requests):
    scored_requests = []
    
    for req in maintenance_requests:
        score = 0
        reasons = []
        
        # 1. Safety Critical
        if req.get("safety_critical", False):
            score += 50
            reasons.append("Safety critical (+50)")
            
        # 2. Severity
        severity = req.get("severity", "Low")
        if severity == "Critical":
            score += 30
            reasons.append("Severe defect (+30)")
        elif severity == "High":
            score += 20
            reasons.append("High defect severity (+20)")
        elif severity == "Medium":
            score += 10
            reasons.append("Medium defect severity (+10)")
            
        # 3. Urgency
        urgency = req.get("urgency", "Routine")
        if urgency == "Emergency":
            score += 30
            reasons.append("Emergency urgency (+30)")
        elif urgency == "Urgent":
            score += 15
            reasons.append("Urgent request (+15)")
            
        # 4. Overdue
        overdue_days = req.get("overdue_days", 0)
        if overdue_days > 0:
            overdue_score = min(25, overdue_days * 5)
            score += overdue_score
            reasons.append(f"Overdue by {overdue_days} days (+{overdue_score})")
            
        # 5. Operational Impact / Duration
        duration_mins = req.get("duration", 0)
        if duration_mins <= 240: # <= 4 hours
            score += 10
            reasons.append("Short duration, easy to schedule (+10)")
        elif duration_mins >= 480: # >= 8 hours
            score -= 10
            reasons.append("Long duration, high operational impact (-10)")
            
        # Determine Priority Level
        if score >= 80:
            level = "CRITICAL"
        elif score >= 50:
            level = "HIGH"
        elif score >= 30:
            level = "MEDIUM"
        else:
            level = "LOW"
            
        # Clone request and add new fields
        enriched_req = req.copy()
        enriched_req["priority_score"] = score
        enriched_req["priority_level"] = level
        
        reasons_text = f"{level.capitalize()} priority because:\n- " + "\n- ".join(reasons)
        enriched_req["reasons"] = reasons_text
        
        scored_requests.append(enriched_req)
        
    # Sort descending by score
    scored_requests.sort(key=lambda x: x["priority_score"], reverse=True)
    return scored_requests
