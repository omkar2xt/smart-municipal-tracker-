# GeoSentinel OS Architecture

## Overview
GeoSentinel OS is a modular full-stack platform designed for geospatially aware workforce intelligence and verification.

## Core Layers
- Mobile App (React Native): Field user interface, sensor capture, and secure authentication.
- Backend API (FastAPI): Business logic, validation, orchestration, and integration gateway.
- AI Module (OpenCV/ML): Face verification, activity detection, and image integrity checks.
- Database (PostgreSQL): Durable storage for users, events, geolocation logs, and audit records.
- Dashboard (Web): Administrative and analytical interface for operations and decision-making.

## Data Flow
1. Mobile captures GPS/sensor/photo data.
2. Backend validates, normalizes, and stores core records.
3. Backend calls AI services for advanced verification.
4. Dashboard consumes backend APIs for monitoring and analytics.
