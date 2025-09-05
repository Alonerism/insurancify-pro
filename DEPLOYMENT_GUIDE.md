# 🏢 Insurance Master - Complete Deployment Guide

## 📋 Pre-Deployment Checklist

### Prerequisites
- [ ] macOS or Linux system
- [ ] Python 3.12+ installed
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] 2GB+ free disk space

### System Requirements
- **Memory**: 4GB+ RAM recommended
- **Storage**: 2GB+ available space
- **Network**: Internet connection for package installation
- **Ports**: 3000 (frontend), 8000 (backend API)

## 🚀 Complete Deployment Steps

### 1. Repository Setup
```bash
# Clone or verify repository
cd /Users/alonflorentin/Downloads/FreeLance/Insurance-Master-V2/insurancify-pro
pwd  # Should show: /Users/alonflorentin/Downloads/FreeLance/Insurance-Master-V2/insurancify-pro
```

### 2. Backend Setup & Configuration

#### 2.1 Python Environment
```bash
# Verify Python 3.12+ is available
python3 --version  # Should be 3.12+

# Create virtual environment (already exists)
# python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Verify activation
which python  # Should show: .../insurancify-pro/.venv/bin/python
```

#### 2.2 Install Backend Dependencies
```bash
# Install Python packages
pip install --upgrade pip
pip install -r backend/requirements.txt

# Verify critical packages
python -c "import fastapi, sqlalchemy, pdfplumber; print('✅ All packages installed')"
```

#### 2.3 Database Initialization
```bash
# Initialize database with sample data
cd backend
python main.py init

# Verify database
python main.py stats
# Should show: 4 agents, 4 buildings, 6 policies

# Test CLI functionality
python main.py agents
python main.py buildings
```

#### 2.4 Test PDF Processing
```bash
# Run comprehensive tests
pytest tests/ -v

# Run smoke test
python smoke.py
# Should show: "🎉 All tests passed! Backend is working correctly."
```

### 3. Frontend Setup

#### 3.1 Node.js Dependencies
```bash
# Return to project root
cd ..

# Install frontend dependencies
npm install

# Install React Query for API integration
npm install @tanstack/react-query

# Verify installation
npm list @tanstack/react-query
```

#### 3.2 Environment Configuration
```bash
# Create frontend environment file
cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_API_DOCS_URL=http://127.0.0.1:8000/docs
EOF
```

### 4. Service Startup

#### 4.1 Start Backend API Server
```bash
# Terminal 1: Start backend API
cd backend
python main.py serve --port 8000

# Verify backend is running
# Open browser to: http://127.0.0.1:8000/docs
```

#### 4.2 Start Frontend Development Server
```bash
# Terminal 2: Start frontend
cd /Users/alonflorentin/Downloads/FreeLance/Insurance-Master-V2/insurancify-pro
npm run dev

# Application should be available at: http://localhost:5173
```

### 5. System Verification

#### 5.1 Backend Health Check
```bash
# Test in Terminal 3
curl "http://127.0.0.1:8000/health"
# Expected: {"status":"healthy","message":"Insurance Master API is running"}

# Test API endpoints
curl "http://127.0.0.1:8000/api/agents" | jq '.[0]'
curl "http://127.0.0.1:8000/api/system/stats" | jq
```

#### 5.2 Frontend Integration Test
- [ ] Open http://localhost:5173
- [ ] Verify UI loads correctly
- [ ] Check browser console for errors
- [ ] Test navigation between pages

#### 5.3 API Integration Test
```bash
# Test search functionality
curl -X POST "http://127.0.0.1:8000/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "State Farm", "limit": 5}' | jq

# Test file upload (with sample PDF)
cd backend
curl -X POST "http://127.0.0.1:8000/api/upload/pdf" \
  -F "file=@test_files/sample_insurance_policy.pdf" \
  -F "building_id=bld-1"
```

## 📧 Email Configuration (Optional)

Create `backend/.env` file for email alerts:
```bash
cd backend
cat > .env << 'EOF'
# Email Configuration (Optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com

# For Gmail: Use App Password instead of regular password
# Enable 2FA and generate App Password at: https://myaccount.google.com/apppasswords
EOF
```

## 🔧 Troubleshooting Guide

### Common Issues

#### Backend Won't Start
```bash
# Check Python path
which python
echo $PYTHONPATH

# Check dependencies
pip list | grep -E "(fastapi|sqlalchemy|pdfplumber)"

# Check database
ls -la backend/data/
```

#### Frontend Build Errors
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

#### API Connection Issues
```bash
# Check if backend is running
curl http://127.0.0.1:8000/health

# Check CORS settings
curl -H "Origin: http://localhost:5173" http://127.0.0.1:8000/health

# Check firewall
lsof -i :8000
```

#### Database Issues
```bash
# Reset database
cd backend
rm -f data/insurance.db
python main.py init
```

### Logs & Debugging
```bash
# Backend logs
cd backend
python main.py serve 2>&1 | tee api_server.log

# Frontend logs
npm run dev 2>&1 | tee frontend.log

# Check system resources
top -l 1 | head -20
df -h
```

## 🚦 Production Considerations

### Security
- [ ] Change default API ports
- [ ] Add API authentication
- [ ] Enable HTTPS
- [ ] Restrict CORS origins
- [ ] Use environment variables for secrets

### Performance
- [ ] Use PostgreSQL for production database
- [ ] Implement Redis for caching
- [ ] Add API rate limiting
- [ ] Optimize PDF processing for large files

### Scalability
- [ ] Use Gunicorn/uWSGI for production ASGI
- [ ] Implement file storage (AWS S3, etc.)
- [ ] Add monitoring (Prometheus, etc.)
- [ ] Set up backup strategy

### Deployment
```bash
# Production build
npm run build

# Production server (example)
# pip install gunicorn
# gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.src.api_server:app
```

## 📖 Documentation Links

- **API Documentation**: http://127.0.0.1:8000/docs
- **Frontend Integration**: See `FRONTEND_INTEGRATION.md`
- **Code Repository**: Current directory
- **Test Suite**: `backend/tests/`

## 🏁 Final Verification Checklist

### Backend ✅
- [ ] All tests pass: `cd backend && pytest tests/ -v`
- [ ] Smoke test passes: `cd backend && python smoke.py`
- [ ] API server starts: `python main.py serve`
- [ ] Health endpoint responds: `curl http://127.0.0.1:8000/health`
- [ ] Sample data loaded: `python main.py stats`

### Frontend ✅
- [ ] Dependencies installed: `npm list`
- [ ] Dev server starts: `npm run dev`
- [ ] UI loads at: http://localhost:5173
- [ ] No console errors
- [ ] React Query configured

### Integration ✅
- [ ] API endpoints accessible from frontend
- [ ] File upload works
- [ ] Search functionality works
- [ ] Data displays correctly

### Optional Features ✅
- [ ] Email alerts configured (if needed)
- [ ] PDF processing tested with real files
- [ ] Multi-user support (future)

---

**🎉 Your Insurance Master application is now fully deployed and ready for use!**

**Access URLs:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8000
- **API Documentation**: http://127.0.0.1:8000/docs

**Support:** Check `FRONTEND_INTEGRATION.md` for integration details and troubleshooting.
