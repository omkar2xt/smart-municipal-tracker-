# GeoSentinel OS

Clean, modular, role-based full-stack architecture for smart municipal operations and governance deployment.

## Project Structure

```text
GeoSentinel-OS/
│
├── mobile_app/
│   ├── screens/
│   │   ├── WorkerDashboard.js
│   │   ├── TaskScreen.js
│   │   └── AttendanceScreen.js
│   ├── services/
│   │   ├── gpsService.js
│   │   ├── sensorService.js
│   │   ├── authService.js
│   │   └── apiService.js
│   └── App.js
│
├── backend/
│   ├── main.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── attendance.py
│   │   ├── tasks.py
│   │   ├── tracking.py
│   │   └── admin.py
│   │
│   ├── services/
│   │   ├── gps_validation.py
│   │   ├── spoof_detection.py
│   │   ├── face_verification.py
│   │   └── image_analysis.py
│   │
│   ├── roles/
│   │   ├── state_admin.py
│   │   ├── district_admin.py
│   │   ├── taluka_admin.py
│   │   └── worker.py
│   │
│   ├── models/
│   │   ├── user_model.py
│   │   ├── task_model.py
│   │   └── attendance_model.py
│   │
│   ├── database/
│   └── config/
│
├── ai_module/
│   ├── face_model/
│   ├── spoof_detection/
│   └── image_verification/
│
├── dashboard/
│   ├── state_admin/
│   ├── district_admin/
│   ├── taluka_admin/
│   └── shared_components/
│
├── docs/
│   ├── architecture.md
│   └── api_docs.md
│
└── README.md
```

## Role-Based Governance Model

- State Admin: statewide control, policy decisions, district-level oversight.
- District Admin: district-level planning, task assignment to taluka level, compliance checks.
- Taluka Admin: local operational coordination, worker task dispatch, verification review.
- Field Worker: mobile-first execution role for attendance, task completion, and evidence submission.

## Access and Data Flow

- RBAC control: each admin level has scoped access and cannot exceed assigned jurisdiction.
- Upward flow: field data and reports move from worker to taluka, district, and then state level.
- Downward flow: commands, tasks, and directives move from state to district to taluka to workers.
- Traceability: role-aware models and routes support accountable governance workflows.

## Why This Scales

- Role boundaries are explicit in `backend/roles` and dashboard role modules.
- Backend is split into routes, services, and models for maintainability.
- AI modules stay isolated and replaceable without disrupting API contracts.
- Mobile and dashboard evolve independently while sharing a central API.
