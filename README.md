# Smart Municipal Tracker (GeoSentinel OS)

GPS-based attendance and municipal work tracking platform with role-based governance, real-time monitoring, geo-validation, spoof checks, and proof-based task verification.

## Live Deployment

- Frontend (Vercel): https://frontend-mu-green-25.vercel.app
- Frontend backup URL: https://frontend-ogqr9c9lc-omkar2xts-projects.vercel.app
- Backend: deploy-ready, but cloud deployment requires a billing-enabled GCP project for Cloud Run.

## Core Features

- Role-based governance model: State Admin, District Admin, Taluka Admin, and Worker.
- Mobile-assisted worker operations: attendance, task execution, before/after proof uploads.
- Face verification and spoof detection support.
- Real-time location tracking and monitoring.
- District/taluka/state analytics dashboards with CSV/PDF reporting.
- Audit-friendly workflows for approvals, reassignments, and escalation actions.

## Project Structure

```text
GeoSentinel-OS/
├── backend/        # FastAPI backend, RBAC routes, models, services
├── dashboard/      # React + Vite web dashboard
├── mobile_app/     # React Native mobile worker app
├── ai_module/      # AI modules for verification and detection
├── docs/           # Architecture and API docs
└── uploads/        # Stored task proof/media files
```

## Technology Stack

- Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- Frontend: React, Vite, Leaflet
- Mobile: React Native
- Database: SQLite (development), production-ready for managed DB via `DATABASE_URL`
- Deployment: Docker + Cloud Run (backend), Vercel (frontend)

## Quick Start

1. Clone this repository.
2. Open the backend folder and set up environment variables from `GeoSentinel-OS/backend/.env.example`.
3. Start backend:

```bash
cd GeoSentinel-OS/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

4. Start dashboard frontend:

```bash
cd GeoSentinel-OS/dashboard/frontend
npm install
npm run dev
```

## Documentation

- Main system guide: `GeoSentinel-OS/COMPLETE_SYSTEM_GUIDE.md`
- Backend docs index: `GeoSentinel-OS/backend/DOCUMENTATION_INDEX.md`
- API docs: `GeoSentinel-OS/docs/api_docs.md`

## License

This project is licensed under the terms in the `LICENSE` file.
