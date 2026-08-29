# RailOptima AI

**An AI-Powered Automatic Block Planning Engine to Maximize Asset Availability for Train Operations.**

> **IMPORTANT NOTICE:** This is a functional prototype built for demonstration purposes (e.g., SIH 2026). All data within this application (train movements, maintenance blocks, priorities) is **100% simulated**. It does not connect to, nor does it represent, actual real-time Indian Railways systems or data.

## 🏗️ Architecture

RailOptima AI employs a clean, decoupled client-server architecture:
- **Frontend (Client)**: A robust Single Page Application built with Next.js 15, React 19, and Tailwind CSS. It serves purely as the visualization and interaction layer (Dashboard & SIH Demo Wizard).
- **Backend (Server)**: A high-performance Python FastAPI server. It contains the deterministic AI rule engines, constraint optimizers, and mathematical heuristic logic.

## 🚀 Setup & Execution (Local)

You need two terminals to run the prototype locally.

### 1. Start the Backend (FastAPI)
```powershell
cd backend
.\venv\Scripts\activate
# Create .env file with FRONTEND_ORIGIN=http://localhost:3000
uvicorn main:app --reload
```
*The backend runs on `http://127.0.0.1:8000`*

### 2. Start the Frontend (Next.js)
```powershell
cd frontend
# Create .env.local with NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```
*The frontend runs on `http://localhost:3000`*

## 🌐 Production Deployment

### Environment Configuration
The system relies on the following environment variables. Do **not** commit these to version control.

**Backend (`backend/.env`)**:
- `RAIL_DATA_MODE`: `simulation` (default) or `live`
- `RAIL_LIVE_API_KEY`: API key for live train data (if mode is live)
- `RAIL_LIVE_API_URL`: URL for live train data endpoint (if mode is live)
- `FRONTEND_ORIGIN`: Comma-separated allowed CORS origins (e.g., `https://railoptima.vercel.app,http://localhost:3000`)
- `PORT`: Port to run the server on (default: `8000`)

**Frontend (`frontend/.env.local`)**:
- `NEXT_PUBLIC_API_URL`: The URL of your deployed FastAPI backend (e.g., `https://api.railoptima.com`)

### Deploying the Backend (FastAPI)
Run the backend in production using `uvicorn` without the `--reload` flag. Ensure the `$PORT` environment variable is bound correctly.
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Deploying the Frontend (Vercel)
The Next.js frontend is optimized for deployment on Vercel. Connect your repository, set the `NEXT_PUBLIC_API_URL` environment variable in the Vercel dashboard, and deploy.

## 🔌 API Endpoints

The backend exposes several modular REST APIs:
- `GET /api/health` - Returns the API status and current data mode.
- `GET /api/simulation` - Returns the deterministic mock data (trains, raw maintenance requests, track sections).
- `GET /api/conflicts` - Scans the uncoordinated mock data in $O(N^2)$ time to detect unsafe block overlaps.
- `GET /api/maintenance/priorities` - Passes the raw requests through the Rule Engine to generate mathematically explainable Priority Scores.
- `POST /api/planning/weekly` - Runs the AI Constraint Heuristic to schedule tasks into feasible windows across a 7-day horizon.
- `POST /api/planning/monthly` - Runs the optimizer across a 30-day horizon.
- `POST /api/emergency/replan` - Injects an immutable Emergency Block into the schedule and calculates the cascading re-allocation actions.

## 📊 Data Model

The application tracks three primary assets:
1. **Trains**: Immutable entities that occupy track sections. (Fields: `train_id`, `train_type`, `section`, `planned_start`, `planned_end`).
2. **Maintenance Requests**: Requests submitted by Engineering, S&T, or Traction departments. (Fields: `request_id`, `duration`, `severity`, `safety_critical`, `overdue_days`).
3. **Sections**: Physical track infrastructure (e.g., `SEC_1`).

## 🧠 Optimization Logic

The core AI engine does not use a black-box LLM or opaque ML model. It uses a **Deterministic Greedy Constraint Solver**:
1. **Priority Sorting**: Every maintenance request is scored linearly (Safety = +50, Defect Severity = High/Med/Low, Overdue = +5/day). Requests are sorted descending by score.
2. **Timeline Flattening**: Train occupancy data is flattened into a continuous timeline array representing unavailable windows.
3. **Feasibility Search**: For each maintenance request, the algorithm scans the section's timeline for the earliest contiguous block of free time that strictly satisfies the requested `duration`, mathematically checking for overlaps.
4. **Immutability**: Once a block is scheduled, it is added to the occupancy array. Subsequent lower-priority blocks must avoid it.

## 🎓 Demo Instructions (SIH Presentation)

1. Open the deployed frontend URL (or `http://localhost:3000`).
2. Navigate to the **SIH Demo Mode** tab in the top navigation bar.
3. Use the **Next Step** button to walk through the 8-stage guided wizard.
4. The wizard will progressively load simulated trains, inject uncoordinated maintenance, mathematically prove overlaps, run the AI optimizer, inject a dynamic emergency, trace the cascading impact, and display final Analytics.
5. Hit **Reset Demo** to clear the state and run the pitch again.

## ⚠️ Limitations

- **Simulated Scale**: The mock dataset contains ~60 trains and ~24 maintenance requests. At massive scale (thousands of requests), the $O(N^2)$ overlap detector would need refactoring into Interval Trees or R-Trees.
- **Train Immutability**: The current constraint solver only shifts maintenance blocks. It assumes Train Timetables (COA data) are perfectly rigid. It does not attempt to delay or re-route passenger trains.
