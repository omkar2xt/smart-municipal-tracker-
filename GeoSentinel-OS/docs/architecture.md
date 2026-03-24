# GeoSentinel OS Architecture

## Overview
GeoSentinel OS is a modular full-stack platform designed for geospatially aware workforce intelligence and verification.

## Core Layers
- Mobile App (React Native): Field user interface, sensor capture, and secure authentication.
- Backend API (FastAPI): Business logic, validation, orchestration, and integration gateway.
- AI Module (OpenCV/ML): Face verification, activity detection, and image integrity checks.
- Database (PostgreSQL): Durable storage for users, events, geolocation logs, and audit records.
- Dashboard (Web): Administrative and analytical interface for operations and decision-making.

## Security Architecture
- Transport security: enforce HTTPS/TLS 1.2+ for all Mobile App and Dashboard calls to Backend API; use mutual TLS for service-to-service traffic where AI Module or internal APIs are deployed separately.
- Encryption at rest: encrypt PostgreSQL and object/file storage using managed keys; rotate encryption keys regularly and restrict key access to service identities only.
- Authentication: Mobile App and Dashboard use OAuth2/OIDC-based login and short-lived bearer tokens; Backend API validates token issuer, audience, expiry, and signature at request time.
- Device trust: require device integrity checks (for example, attestation signals) and reject high-risk sessions for biometric/location submissions.
- Authorization model: enforce RBAC and least privilege for state, district, taluka, worker, and service accounts; scope admin actions by jurisdiction.
- API protection controls: implement strict input validation, output encoding, schema validation, rate limiting, and abuse detection at FastAPI routes.
- AI model security: sign model artifacts, verify signatures on load, and expose model-serving endpoints only behind authenticated internal access.
- Audit integrity: store immutable audit logs for login, role changes, biometric verification events, and task actions with retention and alerting policies.

## Privacy and Compliance
- Consent workflow: capture explicit biometric and location consent in Mobile App onboarding and before first attendance submission; persist consent timestamps and policy versions via Backend API.
- Purpose limitation: process only required biometric/location fields in AI Module and Backend API for attendance/task verification, with no secondary use without renewed consent.
- Data minimization: Mobile App submits minimal required metadata; Backend API rejects unnecessary fields and strips extraneous payload attributes.
- Retention/deletion policy: define retention windows for attendance, location traces, and biometric templates in PostgreSQL; implement scheduled deletion/anonymization jobs and legal-hold exceptions.
- User rights handling: expose Backend API endpoints for access, correction, deletion, and opt-out where legally permitted; surface requests and status in Dashboard workflows.
- Compliance alignment: map controls to GDPR, CCPA, and BIPA obligations, including notice-at-collection, lawful basis, and biometric-specific disclosures.
- Audit and oversight: require Privacy Impact Assessment (PIA) before production rollout and annually thereafter; record privacy/security admin actions in tamper-evident audit trails.
- Dashboard safeguards: restrict personally identifiable and biometric views by role, mask sensitive fields by default, and log every privileged data export/report action.

## Data Flow
1. Mobile captures GPS/sensor/photo data.
2. Backend validates, normalizes, and stores core records.
3. Backend calls AI services for advanced verification.
4. Dashboard consumes backend APIs for monitoring and analytics.
