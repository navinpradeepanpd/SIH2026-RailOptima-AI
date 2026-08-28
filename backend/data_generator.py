import json
import random
from datetime import datetime, timedelta
import os

def generate_data():
    random.seed(42) # Deterministic seed

    # Base time for simulation
    base_time = datetime(2026, 9, 1, 0, 0, 0)
    
    # 1. Sections and Stations
    stations = ["NDLS (New Delhi)", "CNB (Kanpur)", "PRYJ (Prayagraj)", "DDU (Pt. Deen Dayal Upadhyaya)", "PNBE (Patna)", "HWH (Howrah)"]
    sections = []
    for i in range(len(stations) - 1):
        sections.append({
            "section_id": f"SEC_{i+1}",
            "name": f"{stations[i]} to {stations[i+1]}",
            "distance_km": random.randint(150, 450)
        })

    # 2. Train Movements (50+ trains)
    train_types = [
        {"type": "Vande Bharat Express", "priority": 1, "speed_kmh": 130},
        {"type": "Rajdhani Express", "priority": 2, "speed_kmh": 120},
        {"type": "Superfast Express", "priority": 3, "speed_kmh": 90},
        {"type": "Passenger", "priority": 4, "speed_kmh": 60},
        {"type": "Freight", "priority": 5, "speed_kmh": 50},
        {"type": "Dedicated Freight", "priority": 4, "speed_kmh": 75}
    ]

    trains = []
    for i in range(1, 61): # 60 trains
        t_type = random.choice(train_types)
        section = random.choice(sections)
        
        # Calculate duration based on section distance and speed
        duration_hours = section["distance_km"] / t_type["speed_kmh"]
        
        # Random start time within a 7-day window
        start_offset = timedelta(hours=random.uniform(0, 7 * 24))
        planned_start = base_time + start_offset
        planned_end = planned_start + timedelta(hours=duration_hours)
        
        # Determine origin and destination from section name
        parts = section["name"].split(" to ")
        origin = parts[0] if random.choice([True, False]) else parts[1]
        destination = parts[1] if origin == parts[0] else parts[0]
        
        trains.append({
            "train_id": f"TRN_{10000 + i}",
            "train_type": t_type["type"],
            "origin": origin,
            "destination": destination,
            "section": section["section_id"],
            "planned_start": planned_start.isoformat(),
            "planned_end": planned_end.isoformat(),
            "priority": t_type["priority"],
            "speed": t_type["speed_kmh"]
        })

    # 3. Maintenance Requests (Engineering, S&T, Traction)
    departments = [
        {"dept": "Engineering (TMS)", "assets": ["Track replacement", "Bridge inspection", "Ballast cleaning"]},
        {"dept": "S&T (SMMS)", "assets": ["Signal failure repair", "Point machine maintenance", "Track circuit testing"]},
        {"dept": "Traction (TDMS)", "assets": ["OHE wire adjustment", "Pantograph alignment", "Power substation maintenance"]}
    ]
    
    maintenance = []
    for i in range(1, 25): # 24 maintenance blocks
        dept_info = random.choice(departments)
        section = random.choice(sections)
        
        # Start time within 7 day window
        start_offset = timedelta(hours=random.uniform(0, 7 * 24))
        start_time = base_time + start_offset
        duration_hours = random.choice([2, 4, 6, 8])
        end_time = start_time + timedelta(hours=duration_hours)
        
        severity = random.choice(["Low", "Medium", "High", "Critical"])
        urgency = random.choice(["Routine", "Urgent", "Emergency"])
        safety_critical = True if severity in ["High", "Critical"] else False
        
        maintenance.append({
            "request_id": f"MNT_{5000 + i}",
            "department": dept_info["dept"],
            "asset_type": random.choice(dept_info["assets"]),
            "section": section["section_id"],
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration": duration_hours * 60, # in minutes
            "severity": severity,
            "urgency": urgency,
            "safety_critical": safety_critical,
            "overdue_days": random.randint(0, 5),
            "status": "Pending"
        })
        
    # Write to files
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    with open(os.path.join(data_dir, 'sections.json'), 'w') as f:
        json.dump(sections, f, indent=4)
        
    with open(os.path.join(data_dir, 'trains.json'), 'w') as f:
        json.dump(trains, f, indent=4)
        
    with open(os.path.join(data_dir, 'maintenance.json'), 'w') as f:
        json.dump(maintenance, f, indent=4)

    print(f"Generated {len(sections)} sections, {len(trains)} trains, and {len(maintenance)} maintenance requests.")

if __name__ == "__main__":
    generate_data()
