# Aperture AIoT Control Center

**Enterprise Multi-Tenant B2B AI + IoT Hardware Monitoring & Execution System**  
*First Reference Use-Case: Automotive Assembly Tool Monitoring*

---

## 1. System Overview

**Aperture AIoT Control Center** is a production-grade, enterprise B2B platform designed to supervise, diagnose, and deterministically govern industrial hardware and motor-driven assembly tools using edge telemetry, machine learning, and hardware controllers.

The system is strictly separated into two architectural layers:
1. **Layer A — Enterprise B2B SaaS Management Layer:** Multi-tenant hierarchy (Global Platform Super Admin, Company Admins, Sub-Admins, recursive Organization Units, Sites, Departments, Projects, Stations, Assets, Devices, Controllers, RBAC, Fine-Grained Permissions, Audit Logs, and Reporting).
2. **Layer B — Local-First AI + IoT Execution Layer:** Hardware-isolated edge execution pipeline:
   `BLE Sensor/Controller API` → `BLE Adapter` → `Normalized Telemetry` → `Window Buffer` → `Feature Extraction` → `ML Inference` → `Deterministic Decision Policy` → `Local Controller Interface` → `Actual RPM Feedback` → `Event Store` → `WebSocket` → `Live Operator Dashboard`.

---

## 2. Core Safety & Execution Invariants

1. **Hardware Safety Limits Outside ML:** Machine learning predicts operational disturbance classes (`NORMAL`, `MILD_DISTURBANCE`, `STRONG_DISTURBANCE`). ML *never* directly commands physical actuators.
2. **Deterministic Decision Policy:** The policy engine evaluates confidence, window persistence, freshness, and machine state to issue safety-bounded commands.
3. **Latched Faults & Explicit Operator Reset:** Following a severe disturbance or hardware fault (`LATCHED_STOP`), automatic restarting is mathematically and programmatically prohibited. An authenticated operator must review the root cause and dispatch an explicit reset command.
4. **Physical Verification via Measured RPM:** Commanded RPM is never assumed to be achieved; the local motor controller validates deceleration or stopping via tachometer feedback before marking commands `COMPLETE`.
5. **Private Hardware Execution Boundary:** Actuator controls operate behind local interfaces and are never exposed as unauthenticated public endpoints. Dashboard or browser timers are never the safety watchdog.
6. **Strict Multi-Tenant Isolation:** All database entities and API routes enforce tenant boundaries via ContextVar middleware and database predicates (`company_id`). Company A users can never access Company B telemetry, models, or assets.

---

## 3. Technology Stack

- **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.0 (ORM), Alembic, Pydantic v2, Scikit-learn (RandomForestClassifier), NumPy, Bcrypt, PyJWT, WebSockets, asyncio, pytest.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas-based real-time vibration charts.
- **Database:** PostgreSQL (production) / SQLite (development & local edge gateway), Redis (optional pub/sub cache).
- **Orchestration:** Docker, Docker Compose, Nginx.

---

## 4. Default Seeded Credentials

When seeded via `python -m app.seed`, the following accounts and hierarchies are created:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Global Super Admin** | `admin@aperture.io` | `AdminPass123!` | Global Platform (`*`) |
| **Company Administrator** | `admin@aperture-auto.com` | `CompanyPass123!` | `Aperture Automotive Ltd` |

### Initial Reference Company Hierarchy
- **Company:** `Aperture Automotive Ltd` (Code: `APERTURE-AUTO`)
  - **Division:** Powertrain Manufacturing
    - **Department:** Final Assembly & Fastening
  - **Site:** Detroit Facility (Code: `DET-01`)
    - **Station:** Station 01 - Engine Fastening (Code: `STN-01`)
      - **Asset:** Nutrunner Motor A (Type: `MOTOR_TOOL`, Serial: `NR-MTR-001`)
        - **BLE Sensor:** `ble_vibe_node_01` (Type: `VIBRATION_SENSOR`, MAC: `C4:7F:51:22:A1:01`)
        - **Motor Controller:** `ctrl_motor_A` (Type: `MOTOR_DRIVE_PLC`, Modbus/CAN: `CAN_NODE_04`)

---

## 5. Local Setup & Quickstart

### Prerequisites
- Python 3.12+
- Node.js 20+ and npm
- Git

### Step 1: Clone and Configure Backend
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run initial database seed
python -m app.seed

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will be available at:
- REST API: `http://localhost:8000/api/v1/`
- Interactive OpenAPI Docs: `http://localhost:8000/api/docs`
- ReDoc Docs: `http://localhost:8000/api/redoc`
- Live WebSocket: `ws://localhost:8000/ws/live`

### Step 2: Configure and Start Frontend
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
The React enterprise web interface will be accessible at:
- `http://localhost:5173`

---

## 6. Docker Compose Deployment

To run the complete production stack (PostgreSQL 16, Redis 7, Python FastAPI backend, and Nginx React frontend):

```bash
docker-compose up --build
```
Services exposed:
- **Frontend Dashboard:** `http://localhost:3000`
- **Backend API & Docs:** `http://localhost:8000/api/docs`
- **PostgreSQL:** `localhost:5432`
- **Redis:** `localhost:6379`

---

## 7. Testing Suite

The codebase features comprehensive unit, API, integration, and fault-injection test coverage:

```bash
# Run all tests from workspace root
pytest tests -v
```

### Test Coverage Highlights:
- `tests/test_unit.py`: Fine-grained RBAC permission matrix, tenant isolation rules, vibration feature extraction (RMS, Crest factor, Kurtosis), deterministic policy engine, and latched stop state machine.
- `tests/test_api.py`: JWT authentication, company registration wizard, device enrollment, and controlled motor speed command issuance.
- `tests/test_integration.py`: Complete pipeline trace: `BLE Telemetry` → `Window Buffer` → `ML Inference` → `Decision Policy` → `Command Service` → `Controller RPM Feedback` → `Event Store`.
- `tests/test_fault_injection.py`: Hardware fault injections:
  - BLE Sensor disconnect & stale telemetry rejection (>3s timeout → `DATA_FAULT`).
  - Emergency manual stop triggering immediate motor cut and latching.
  - Expired command rejection & idempotency protection.

---

## 8. Enterprise UI Design System

In compliance with strict industrial standards, the interface utilizes a **clean, light-mode enterprise B2B aesthetic**:
- **Backgrounds:** `#FFFFFF` (Primary Surface), `#F8FAFC` (Secondary Neutral).
- **Borders & Dividers:** Thin `#E5E7EB`.
- **Typography:** Inter / System UI charcoal text (`#111827`, `#6B7280`).
- **Accent & Status Colors:** Professional Blue (`#2563EB`), Emerald Green (Operational/Healthy), Amber (Warning/Inspection), Crimson (Fault/Latched Stop).
- **Progressive Disclosure:** High-level operational metrics on Dashboards, root-cause details on Asset detail views, and full execution traces on Event Logs.
