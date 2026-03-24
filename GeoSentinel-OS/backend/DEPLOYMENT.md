# GeoSentinel OS Backend - Installation & Deployment Guide

Complete step-by-step guide for installing and deploying the GeoSentinel OS backend.

## 📋 Quick Start (5 minutes)

### Prerequisites
- Python 3.10+ installed
- PostgreSQL installed and running
- Git (optional)

### Step-by-Step Installation

```bash
# 1. Navigate to backend directory
cd GeoSentinel-OS/backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create database
createdb geosentinel_db

# 6. Copy environment template
cp .env.example .env

# 7. Edit .env and set DATABASE_URL
# DATABASE_URL=postgresql://user:password@localhost/geosentinel_db

# 8. Initialize database
python -m database.init_db

# 9. Start development server
uvicorn main:app --reload

# 10. Visit http://localhost:8000/docs
```

## 🔌 Database Setup

### Option 1: Local PostgreSQL

#### Windows
1. Download PostgreSQL 15+ from https://www.postgresql.org/download/windows/
2. Run installer
3. Set password for `postgres` user (remember this!)
4. Complete installation

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

#### Mac (Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

### Create Database & User

```bash
# Connect as postgres user
psql -U postgres

# Create database (in psql terminal)
CREATE DATABASE geosentinel_db;

# Create dedicated user (optional, for security)
CREATE USER geosentinel_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE geosentinel_db TO geosentinel_user;

# Exit psql
\q
```

### Connection String Examples

```
# Minimal (using postgres user)
postgresql://postgres:password@localhost/geosentinel_db

# With dedicated user
postgresql://geosentinel_user:secure_password@localhost/geosentinel_db

# Remote server
postgresql://user:password@prod-db.example.com:5432/geosentinel_db
```

### Option 2: Docker (if using Docker)

```bash
docker run -d \
  --name geosentinel-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=geosentinel_db \
  -p 5432:5432 \
  postgres:15

# Connection string: postgresql://postgres:password@localhost/geosentinel_db
```

## ⚙️ Environment Configuration

### Create .env File

```bash
# Copy template
cp .env.example .env

# Edit with your values (nano or your editor)
nano .env  # Linux/Mac
# Or use Notepad on Windows
```

### Required .env Parameters

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/geosentinel_db

# Security
SECRET_KEY=your-super-secret-key-generate-with-openssl-rand-hex-32
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# CORS (development: "*", production: specific domains)
CORS_ORIGINS=["*"]

# Spoof Detection Thresholds
SPOOF_MAX_SPEED_KMH=120
SPOOF_JUMP_THRESHOLD_M=50000
SPOOF_LOW_ACCELERATION=0.1
SPOOF_HIGH_ACCELERATION=15

# Geofence
GEOFENCE_DEFAULT=pune_taluka

# Environment
ENVIRONMENT=development  # Set to 'production' for deployment
DEBUG=True  # Set to False for production
```

### Generate Secure Secret Key

```bash
# Linux/Mac
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Windows (PowerShell)
$key = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Write-Host $key
```

## 🚀 Running the Server

### Development Mode

```bash
# With auto-reload (file changes restart server)
uvicorn main:app --reload

# With specific port
uvicorn main:app --reload --port 8001

# With verbose output
uvicorn main:app --reload --log-level debug
```

The server will:
- Start on http://localhost:8000
- Auto-reload when files change
- Show logs in terminal
- Create missing database tables
- Seed default test users

### Production Mode

```bash
# Install additional server
pip install gunicorn

# Run with gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Run with specific port
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
```

### Verify Server is Running

```bash
# In another terminal, test health check
curl http://localhost:8000/health

# Visit API documentation
# Browser: http://localhost:8000/docs

# Or test with Python
python -c "
import requests
r = requests.get('http://localhost:8000/health')
print(r.json())
"
```

## 🔐 First Time Setup

### 1. Login with Default Users

The database initialization creates 4 test users:

| Role | Email | Password |
|------|-------|----------|
| State Admin | admin@geosentinel.gov | admin123 |
| District Admin | district@geosentinel.gov | district123 |
| Taluka Admin | taluka@geosentinel.gov | taluka123 |
| Worker | worker@geosentinel.gov | worker123 |

### 2. Test Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@geosentinel.gov",
    "password": "admin123"
  }'

# Response:
# {
#   "access_token": "eyJhbGc...",
#   "token_type": "bearer",
#   "user": { "id": 1, "name": "State Admin", ... }
# }
```

### 3. Change Default Passwords (Important!)

```bash
# Connect to database
psql -U postgres -d geosentinel_db

# List users
SELECT id, name, email, role FROM "user";

# Update user (via app API only - don't modify password_hash directly)
# Use the /users endpoint with proper authentication
```

## 📦 Dependencies

All dependencies are listed in `requirements.txt`:

```
FastAPI==0.104.1
SQLAlchemy==2.0.23
Pydantic==2.5.0
uvicorn==0.24.0
psycopg2-binary==2.9.9
python-jose==3.3.0
passlib==1.7.4
bcrypt==4.1.2
python-multipart==0.0.6
```

### Install All at Once

```bash
pip install -r requirements.txt
```

### Install Individual Package

```bash
pip install FastAPI==0.104.1
pip install SQLAlchemy==2.0.23
# etc.
```

### Update All Packages

```bash
pip install --upgrade pip
pip install --upgrade -r requirements.txt
```

## 🗂️ Project Structure

```
backend/
├── main.py              # FastAPI app entry point - START HERE
├── requirements.txt     # Python dependencies
├── .env.example         # Configuration template
├── README.md           # Project overview
├── API_REFERENCE.md    # API endpoints guide
├── DEVELOPMENT.md      # Development guide
├── DEPLOYMENT.md       # This file
│
├── config/
│   └── settings.py     # Configuration class
│
├── database/
│   ├── base.py         # SQLAlchemy Base
│   ├── session.py      # Database session management
│   └── init_db.py      # Database initialization & seed  ← RUN THIS
│
├── models/             # Database models (5 tables)
│   ├── user_model.py
│   ├── attendance_model.py
│   ├── task_model.py
│   ├── location_log_model.py
│   ├── audit_log_model.py
│   └── enums.py
│
├── schemas/            # Request/response validation
│   └── schemas.py      # 20+ Pydantic models
│
├── services/           # Business logic
│   ├── geofence_service.py      # Geofence validation
│   ├── spoof_service.py         # Spoof detection
│   ├── audit_service.py         # Audit logging
│   └── auth_service.py          # JWT & password utilities
│
├── routes/             # API endpoints (15 total)
│   ├── auth.py         # POST /auth/login
│   ├── attendance.py   # Attendance endpoints
│   ├── tasks.py        # Task management
│   ├── tracking.py     # Location logging
│   ├── users.py        # User endpoints
│   └── admin.py        # Admin reporting
│
└── utils/              # Helper functions
    ├── security.py     # Password hashing, JWT
    └── helpers.py      # Distance, geometry utilities
```

## 🧪 Testing

### API Documentation

Visit http://localhost:8000/docs to test all endpoints interactively.

### Test with cURL

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"worker@geosentinel.gov","password":"worker123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Mark attendance
curl -X POST http://localhost:8000/attendance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 18.5204, "longitude": 73.8567, "accuracy": 10}'
```

### Test with Python

```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/auth/login",
    json={"email": "worker@geosentinel.gov", "password": "worker123"}
)
token = response.json()["access_token"]

# Mark attendance
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
response = requests.post(
    "http://localhost:8000/attendance",
    json={"latitude": 18.5204, "longitude": 73.8567, "accuracy": 10},
    headers=headers
)
print(response.json())
```

## ☁️ Production Deployment

### Pre-Deployment Checklist

```
✓ Change all default passwords
✓ Generate new SECRET_KEY (use openssl)
✓ Set ENVIRONMENT=production in .env
✓ Set DEBUG=False in .env
✓ Change CORS_ORIGINS to specific domain(s)
✓ Set up HTTPS/SSL certificate
✓ Configure firewall rules
✓ Set up database backups
✓ Configure logging/monitoring
✓ Test all endpoints thoroughly
✓ Set up error monitoring (e.g., Sentry)
```

### Environment Variables for Production

```bash
# .env.production
DATABASE_URL=postgresql://geosentinel_user:SECURE_PASSWORD@prod-db.example.com:5432/geosentinel_db
SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
CORS_ORIGINS=["https://dashboard.example.com", "https://api.example.com"]
ENVIRONMENT=production
DEBUG=False
```

### Deploy to Linux Server

```bash
# 1. SSH into production server
ssh user@prod-server.example.com

# 2. Clone repository
git clone https://github.com/yourorg/GeoSentinel-OS.git
cd GeoSentinel-OS/backend

# 3. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file with production settings
nano .env  # Copy production variables above

# 6. Initialize database
python -m database.init_db

# 7. Start server with Gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# 8. (Recommended) Use systemd service to keep process running
# Create /etc/systemd/system/geosentinel-api.service
# See systemd service section below
```

### Systemd Service (Linux)

Create `/etc/systemd/system/geosentinel-api.service`:

```ini
[Unit]
Description=GeoSentinel OS API
After=network.target

[Service]
Type=notify
User=geosentinel
WorkingDirectory=/var/www/GeoSentinel-OS/backend
Environment="PATH=/var/www/GeoSentinel-OS/backend/venv/bin"
EnvironmentFile=/var/www/GeoSentinel-OS/backend/.env
ExecStart=/var/www/GeoSentinel-OS/backend/venv/bin/gunicorn main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile - \
    --error-logfile -

[Install]
WantedBy=multi-user.target
```

### Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/geosentinel`:

```nginx
upstream geosentinel_api {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://geosentinel_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

## 📊 Monitoring & Logging

### Check Server Status

```bash
# Health check
curl https://api.example.com/health

# Check systemd service
systemctl status geosentinel-api

# View logs
journalctl -u geosentinel-api -f
```

### Database Monitoring

```bash
# Connect to production database
psql -h prod-db.example.com -U geosentinel_user -d geosentinel_db

# Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check for slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 10;
```

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn main:app --port 8001
```

### Database Connection Issues

```bash
# Test connection
python -c "from database.session import engine; engine.connect()"

# Check DATABASE_URL
echo $DATABASE_URL

# Verify PostgreSQL is running
pg_isready -h localhost
```

### Token/JWT Errors

```bash
# Check SECRET_KEY is set
echo $SECRET_KEY

# Verify token format (Bearer <token>)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/users/me
```

### Import Errors

```bash
# Reinstall packages
pip install --force-reinstall -r requirements.txt

# Check Python version
python --version  # Should be 3.10+
```

## 📈 Performance Tuning

### Database Connection Pooling

Edit `database/session.py`:

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=20,           # Max connections
    max_overflow=40,        # Overflow connections
    pool_pre_ping=True,     # Test connections before use
    pool_recycle=3600       # Recycle connections every hour
)
```

### Gunicorn Workers

```bash
# Formula: (2 × CPU cores) + 1
# For 4-core server: 9 workers

gunicorn main:app --workers 9 --worker-class uvicorn.workers.UvicornWorker
```

### Database Indexing

Key indexes already created on:
- `user.email` (UNIQUE)
- `user.role`
- `attendance.user_id`, `timestamp`
- `location_log.user_id`, `timestamp`, `spoof_detection_flag`
- `audit_log.user_id`, `action`, `created_at`

## 📝 Backup & Recovery

### Backup Database

```bash
# Create backup
pg_dump -h localhost -U geosentinel_user geosentinel_db > backup.sql

# Backup with compression
pg_dump -h localhost -U geosentinel_user geosentinel_db | gzip > backup.sql.gz

# Restore from backup
psql -h localhost -U geosentinel_user geosentinel_db < backup.sql
gunzip -c backup.sql.gz | psql -h localhost -U geosentinel_user geosentinel_db
```

### Automated Nightly Backups

Create `/usr/local/bin/backup-geosentinel.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/geosentinel"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U geosentinel_user geosentinel_db | \
  gzip > $BACKUP_DIR/geosentinel_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "geosentinel_*.sql.gz" -mtime +7 -delete
```

Add to crontab:

```bash
# Run at 2 AM daily
0 2 * * * /usr/local/bin/backup-geosentinel.sh
```

---

## 📞 Support & Documentation

- **API Docs**: http://localhost:8000/docs (Swagger)
- **API Reference**: See API_REFERENCE.md
- **Development Guide**: See DEVELOPMENT.md
- **Project README**: See README.md

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Compatible with**: Python 3.10+, PostgreSQL 12+
