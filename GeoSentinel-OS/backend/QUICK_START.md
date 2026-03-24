# ⚡ Quick Start - 5 Minutes

Get GeoSentinel OS backend running in 5 minutes. Detailed guides available in other documentation files.

## 1. Activate Virtual Environment (30 seconds)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

## 2. Install Dependencies (2 minutes)

```bash
pip install -r requirements.txt
```

## 3. Set Up Database (2 minutes)

```bash
# Create database
createdb geosentinel_db

# Copy environment file
cp .env.example .env

# Edit .env and set DATABASE_URL
# DATABASE_URL=postgresql://postgres:password@localhost/geosentinel_db
```

## 4. Initialize Database (30 seconds)

```bash
python -m database.init_db
```

## 5. Start Server (30 seconds)

```bash
uvicorn main:app --reload
```

## ✅ Done!

- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Test Login**:
  ```bash
  curl -X POST http://localhost:8000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"worker@geosentinel.gov","password":"worker123"}'
  ```

## 📚 Lost? Read:

- **Setup Issues**: INSTALLATION_CHECKLIST.md
- **API Endpoints**: API_REFERENCE.md
- **Full Context**: README.md
- **Development**: DEVELOPMENT.md
- **Production**: DEPLOYMENT.md

---

**Default Users**:
- admin@geosentinel.gov / admin123
- district@geosentinel.gov / district123
- taluka@geosentinel.gov / taluka123
- worker@geosentinel.gov / worker123

**Next**: Visit http://localhost:8000/docs and test an endpoint!
