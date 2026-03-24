# API Documentation

## Base URL
- Development: http://localhost:8000

## Endpoints
- GET /health: Service health check.
- POST /auth/login: Authentication entry point.
- GET /attendance/: Attendance resources.
- GET /tasks/: Task resources.
- GET /tracking/: Tracking resources.

## Notes
- Use JWT bearer tokens for protected endpoints.
- Add request/response schemas under backend/models for strong contracts.
