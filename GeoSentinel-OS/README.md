# GeoSentinel OS

GeoSentinel OS is a role-based municipal operations platform for workforce attendance, task execution tracking, spoof-aware location monitoring, and governance reporting from worker level to state level.

## Live URLs

- Frontend: https://frontend-mu-green-25.vercel.app
- Backend API: https://backend-delta-seven-36.vercel.app

## What It Solves

- Workforce accountability with GPS-backed attendance and task traceability.
- Proof-based execution with before/after image uploads.
- Multi-level governance with role-scoped dashboards and decisions.
- Auditability through structured logs and tracked operational actions.

## Core Features

- Authentication with role-based access control.
- Worker face verification and task proof upload flows.
- Taluka, Sub-Admin, and State Admin analytics panels.
- Spoof detection signals and location monitoring.
- CSV/PDF reporting for operational and compliance workflows.
- API fallback logic and resilient frontend request handling.

## Architecture

```text
GeoSentinel-OS/
├── backend/           # FastAPI API, SQLAlchemy models, role routes, services
├── dashboard/         # React + Vite web dashboard
├── mobile_app/        # React Native worker app
├── ai_module/         # Detection/verification modules
├── docs/              # Architecture and API documentation
└── uploads/           # Media and proof artifacts
```

## Role Model

- State Admin: statewide command, policy decisions, oversight analytics.
- District Admin: district planning, allocations, and governance controls.
- Taluka Admin: local operations, worker coordination, field monitoring.
- Worker: attendance, execution, verification, and on-ground proof submission.

## Data Flow

- Downward directives: State -> District -> Taluka -> Worker.
- Upward evidence and reporting: Worker -> Taluka -> District -> State.
- Scope isolation: each role sees and acts only within assigned jurisdiction.

## Quick Start

1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

2. Frontend

```bash
cd dashboard/frontend
npm install
npm run dev
```

3. Environment Setup

- Backend template: backend/.env.example
- Frontend dev env: dashboard/frontend/.env.development
- Frontend prod template: dashboard/frontend/.env.production.example

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- Frontend: React, Vite, Axios, Leaflet
- Mobile: React Native
- Database: PostgreSQL (production-ready), SQLite for local/simple setups
- Deployment: Vercel (frontend and backend deployments currently configured)

## Documentation

- Complete guide: COMPLETE_SYSTEM_GUIDE.md
- Backend docs index: backend/DOCUMENTATION_INDEX.md
- API documentation: docs/api_docs.md

## License

Licensed under the terms in the LICENSE file.
