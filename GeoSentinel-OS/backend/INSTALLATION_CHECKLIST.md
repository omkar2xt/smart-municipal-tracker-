# Installation Checklist - GeoSentinel OS Backend

Use this checklist to verify you've completed all setup steps correctly.

## ✅ Pre-Installation

- [ ] Python 3.10+ installed (`python --version`)
- [ ] PostgreSQL 12+ installed and running (`psql --version`)
- [ ] Git installed (optional) (`git --version`)
- [ ] Administrator/sudo access for system packages
- [ ] Text editor or IDE available

---

## ✅ Step 1: Environment Setup (5-10 minutes)

### Navigate to Backend Directory
```bash
cd GeoSentinel-OS/backend
```
- [ ] Confirmed you're in the backend directory
- [ ] Confirmed you see: main.py, requirements.txt, README.md

### Create Virtual Environment
```bash
python -m venv venv
```
- [ ] `venv` directory created
- [ ] No errors during venv creation

### Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```
- [ ] Command prompt now shows `(venv)`
- [ ] You see `(venv)` in your terminal

---

## ✅ Step 2: Dependencies (3-5 minutes)

### Install Requirements
```bash
pip install -r requirements.txt
```
- [ ] No errors during pip install
- [ ] All 17 packages installed successfully
- [ ] Run `pip list` and see: FastAPI, SQLAlchemy, Pydantic, uvicorn, etc.

### Verify Installation
```bash
python -c "import fastapi; print(fastapi.__version__)"
python -c "import sqlalchemy; print(sqlalchemy.__version__)"
python -c "import pydantic; print(pydantic.__version__)"
```
- [ ] FastAPI version: 0.104.1 or higher
- [ ] SQLAlchemy version: 2.0.23 or higher
- [ ] Pydantic version: 2.5.0 or higher

---

## ✅ Step 3: Database Setup (5-10 minutes)

### Create PostgreSQL Database
```bash
createdb geosentinel_db
```
- [ ] Database created without errors
- [ ] Verify: `psql -l` shows `geosentinel_db` in the list

### Optional: Create Dedicated User
```bash
psql -U postgres

# Inside psql:
CREATE USER geosentinel_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE geosentinel_db TO geosentinel_user;
\q
```
- [ ] User created successfully
- [ ] Permissions granted
- [ ] Exited psql with `\q`

### Copy Environment Template
```bash
cp .env.example .env
```
- [ ] `.env` file created
- [ ] File is in backend directory

### Edit .env File
```bash
# Edit .env with your database credentials
# Minimum required:
DATABASE_URL=postgresql://postgres:password@localhost/geosentinel_db
```
- [ ] Opened `.env` file in editor
- [ ] Set DATABASE_URL with your credentials
- [ ] Saved file
- [ ] No syntax errors in `.env`

### Test Database Connection
```bash
python -c "
from database.session import engine
try:
    with engine.connect() as conn:
        print('✓ Database connection successful')
except Exception as e:
    print(f'✗ Connection failed: {e}')
"
```
- [ ] See message: "✓ Database connection successful"
- [ ] If failed, check DATABASE_URL in .env

---

## ✅ Step 4: Initialize Database (2-3 minutes)

### Run Database Initialization
```bash
python -m database.init_db
```
- [ ] Script runs without errors
- [ ] Sees message: "Creating tables..."
- [ ] Sees message: "Seeding default users..."
- [ ] Sees message: "Initialization complete"

### Verify Tables Created
```bash
psql -U postgres -d geosentinel_db -c "\dt"
```
- [ ] See tables: user, attendance, task, location_log, audit_log
- [ ] Each table shows a size (not empty)

### Verify Default Users
```bash
psql -U postgres -d geosentinel_db -c "SELECT id, name, email, role FROM \"user\";"
```
- [ ] See 4 users:
  - admin@geosentinel.gov (state_admin)
  - district@geosentinel.gov (district_admin)
  - taluka@geosentinel.gov (taluka_admin)
  - worker@geosentinel.gov (worker)

---

## ✅ Step 5: Start Server (1-2 minutes)

### Start Development Server
```bash
uvicorn main:app --reload
```
- [ ] Server starts without errors
- [ ] See message: "Uvicorn running on http://127.0.0.1:8000"
- [ ] See message: "Application startup complete"
- [ ] See message: "✓ Database tables created/verified"
- [ ] See message: "✓ GeoSentinel OS backend initialized"

### Verify Server is Running
In another terminal (without closing the server):
```bash
curl http://localhost:8000/health
```
- [ ] See response: `{"status":"ok","service":"GeoSentinel OS API"}`
- [ ] HTTP status is 200 OK

---

## ✅ Step 6: API Testing (2-3 minutes)

### Test Login Endpoint
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@geosentinel.gov","password":"admin123"}'
```
- [ ] See response with `access_token`
- [ ] See response with `user` object
- [ ] See `"token_type": "bearer"`

### Extract Token (for next test)
```bash
# Windows PowerShell
$response = curl http://localhost:8000/auth/login | ConvertFrom-Json
$token = $response.access_token

# Linux/Mac bash
token=$(curl -s http://localhost:8000/auth/login | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
```
- [ ] Token extracted (long string starting with "ey")

### Test Authenticated Endpoint
```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
- [ ] See current user details
- [ ] Status is 200 OK
- [ ] User is admin or worker

### Test Attendance Endpoint
```bash
curl -X POST http://localhost:8000/attendance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 18.5204,
    "longitude": 73.8567,
    "accuracy": 10
  }'
```
- [ ] See attendance record created
- [ ] See `"id"` in response
- [ ] See `"latitude"` and `"longitude"` match your input
- [ ] See `"geofence_validated": true` or false
- [ ] See `"spoof_check"` value ("safe", "warning", or "danger")

---

## ✅ Step 7: API Documentation (1 minute)

### Visit Swagger UI
Open in browser: `http://localhost:8000/docs`
- [ ] Page loads successfully
- [ ] See "GeoSentinel OS API" title
- [ ] See list of endpoints (auth, attendance, tasks, tracking, users, admin)
- [ ] Can expand each endpoint

### Try Endpoints in Swagger
- [ ] Click "Try it out" on `/auth/login`
- [ ] Fill in: email, password
- [ ] Click "Execute"
- [ ] See 200 response with token

---

## ✅ Step 8: Verify Complete Implementation

### Check All Required Files Exist
```bash
ls -la
```
- [ ] See: main.py
- [ ] See: requirements.txt
- [ ] See: .env

### Check All Directories Exist
```bash
ls -la
```
- [ ] config/ directory exists
- [ ] database/ directory exists
- [ ] models/ directory exists
- [ ] schemas/ directory exists
- [ ] services/ directory exists
- [ ] routes/ directory exists
- [ ] utils/ directory exists

### Verify Key Files
```bash
# Check config
ls -la config/

# Check models
ls -la models/

# Check routes
ls -la routes/
```
- [ ] config/settings.py exists
- [ ] models/ contains: user_model.py, attendance_model.py, task_model.py, location_log_model.py, audit_log_model.py, enums.py
- [ ] routes/ contains: auth.py, attendance.py, tasks.py, tracking.py, users.py, admin.py

---

## ✅ Step 9: Documentation

### Read Documentation Files
- [ ] Read README.md (project overview)
- [ ] Read API_REFERENCE.md (endpoint details)
- [ ] Read DEVELOPMENT.md (development guide)
- [ ] Read DEPLOYMENT.md (production deployment)

---

## ✅ Step 10: Production Checklist (if deploying)

For production deployment, complete these additional steps:

### Security Hardening
- [ ] Changed all default user passwords
- [ ] Generated new SECRET_KEY: `openssl rand -hex 32`
- [ ] Set ENVIRONMENT=production in .env
- [ ] Set DEBUG=False in .env
- [ ] Restricted CORS_ORIGINS to specific domains

### Deployment Preparation
- [ ] Backed up development database
- [ ] Tested all endpoints thoroughly
- [ ] Set up production database
- [ ] Set up HTTPS/SSL certificates
- [ ] Configured firewall rules
- [ ] Set up monitoring/logging

### Server Setup
- [ ] Production server accessible
- [ ] PostgreSQL running on production server
- [ ] Python 3.10+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] .env configured for production

---

## 🎯 What's Next?

### For Developers
1. Read DEVELOPMENT.md for code patterns
2. Explore routes/ directory to understand endpoints
3. Modify services/ to add custom logic
4. Run `pytest` to verify tests pass

### For Testers
1. Use API_REFERENCE.md to test endpoints
2. Use Swagger UI at /docs for interactive testing
3. Test with different user roles
4. Verify geofence and spoof detection

### For DevOps/Deployment
1. Read DEPLOYMENT.md completely
2. Set up production database
3. Configure Nginx reverse proxy
4. Set up systemd service
5. Configure automated backups
6. Test failover and recovery

---

## 🆘 Troubleshooting

### Issue: "Database connection refused"
**Solution:** 
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env
- Verify database exists: `psql -l`

### Issue: "ModuleNotFoundError"
**Solution:**
- Verify venv is activated (see `(venv)` in terminal)
- Reinstall packages: `pip install -r requirements.txt`

### Issue: "Port 8000 already in use"
**Solution:**
- Use different port: `uvicorn main:app --reload --port 8001`
- Or kill existing process: `lsof -ti:8000 | xargs kill -9`

### Issue: Token/JWT errors
**Solution:**
- Verify token in Authorization header: `Bearer <token>`
- Check SECRET_KEY is set in .env
- Verify token hasn't expired (24 hour default)

### Issue: "403 Forbidden" on endpoints
**Solution:**
- Login with correct user role (admin for admin endpoints)
- Check user role: `SELECT role FROM "user" WHERE email='...';`
- Use: admin@geosentinel.gov for admin endpoints

---

## ✨ Success Indicators

✅ You've successfully set up GeoSentinel OS if you can:

1. **Run the server**: `uvicorn main:app --reload` starts without errors
2. **Access health check**: `curl http://localhost:8000/health` returns OK
3. **Login as user**: POST `/auth/login` returns JWT token
4. **Mark attendance**: POST `/attendance` with GPS coordinates works
5. **List tasks**: GET `/tasks` shows assigned tasks
6. **View API docs**: Open `http://localhost:8000/docs` in browser
7. **Database working**: Can query tables in psql

If all 7 work, **you're ready to develop and deploy!**

---

## 📞 Getting Help

| Problem | Where to Look |
|---------|---------------|
| API endpoint details | API_REFERENCE.md |
| Development patterns | DEVELOPMENT.md |
| Production deployment | DEPLOYMENT.md |
| Database issues | DEVELOPMENT.md → "Troubleshooting" |
| Code structure | Project README.md |
| Running tests | DEVELOPMENT.md → "Testing" |

---

**Checklist Version**: 1.0  
**Last Updated**: 2024  
**Estimated Time**: 20-30 minutes for complete setup
