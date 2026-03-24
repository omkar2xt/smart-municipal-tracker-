# 🚀 Quick Start Guide

Get the GeoSentinel OS frontend running in 5 minutes!

## Prerequisites Check ✓

- ✅ Node.js 16+ installed (`node --version`)
- ✅ npm or yarn installed (`npm --version`)
- ✅ Backend API server ready (see API_URL below)
- ✅ Text editor or IDE (VS Code recommended)

## Installation (5 minutes)

### Step 1: Navigate to Frontend Directory
```bash
cd frontend-react
```

### Step 2: Install Dependencies
```bash
npm install
```
This installs all required packages (React, Tailwind, Axios, etc.)

### Step 3: Configure API Connection
```bash
# Copy example env file
cp .env.example .env.local

# Edit and set your API URL
# If backend is on localhost:5000/api, it's already correct
```

### Step 4: Start Development Server
```bash
npm run dev
```

✅ **App opens at** `http://localhost:3000`

## 🎯 Test Login

### Demo Accounts
Use these to test different roles:

| Role | Email | Password |
|------|-------|----------|
| Worker | demo-worker@geosentinel.local | demo123 |
| Taluka Admin | demo-taluka@geosentinel.local | demo123 |
| District Admin | demo-district@geosentinel.local | demo123 |
| State Admin | demo-state@geosentinel.local | demo123 |

Or use **demo buttons** on login page for quick access.

## 📱 Test on Mobile

### Using Mobile Device
```bash
# Get your computer's IP (e.g., 192.168.1.100)
# Visit from phone: http://192.168.1.100:3000
```

### Using Chrome DevTools
1. Open app in Chrome: `http://localhost:3000`
2. Press `F12` or right-click → Inspect
3. Click mobile icon (top left of DevTools)
4. Select device: iPhone, iPad, or Android

## 🎨 Enable Dark Mode

Click the **moon/sun icon** in the top-right navbar to toggle dark mode.

## 📋 Project Structure

```
frontend-react/
├── src/
│   ├── components/      ← Reusable UI components
│   ├── pages/           ← Full page views
│   ├── services/        ← API integration
│   ├── store/           ← State management
│   └── App.jsx          ← Main app
├── public/              ← Static assets
├── index.html           ← HTML template
└── package.json         ← Dependencies
```

## 🔗 Key Pages

Once logged in, you can access:

### Worker Role
- Dashboard: `/worker/dashboard`
- Tasks: `/worker/tasks`
- Attendance: `/worker/attendance`
- Location: `/worker/location`

### Taluka Admin
- Dashboard: `/taluka/dashboard`
- Workers: `/taluka/workers`
- Tasks: `/taluka/tasks`

### District Admin
- Dashboard: `/district/dashboard`
- Performance: `/district/performance`

### State Admin
- Dashboard: `/state/dashboard`
- Analytics: `/state/analytics`

## 🛠️ Common Commands

```bash
# Start development server (with auto-reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Check for code issues
npm run lint
```

## 🔧 Troubleshooting

### Port 3000 Already in Use?
```bash
# Use different port
npm run dev -- --port 3001
```

### Can't Connect to API?
1. Ensure backend is running on `http://localhost:5000`
2. Check `.env.local` has correct `VITE_API_URL`
3. Restart dev server: `Ctrl+C`, then `npm run dev`

### Blank Page / Errors?
1. Open browser console: `F12` → Console tab
2. Check for red errors
3. Clear localStorage: Right-click → Inspect → Console → type: `localStorage.clear()`
4. Refresh page

### All Styles "Broken"?
- Verify Tailwind is working: check colors/spacing
- Restart dev server if styles seem missing
- Check `.env` file exists

## 📊 Feature Overview

### Worker Features ✅
- ✓ GPS-based attendance marking
- ✓ Real-time geofence status
- ✓ View assigned tasks
- ✓ Upload work proof with images
- ✓ Task status tracking

### Admin Features ✅
- ✓ Worker management dashboard
- ✓ Task assignment interface
- ✓ Attendance tracking
- ✓ Performance analytics
- ✓ Alert system
- ✓ Multi-level dashboards

### Design Features ✅
- ✓ Dark/light mode
- ✓ Fully responsive (mobile-first)
- ✓ Real-time status updates
- ✓ Error handling & validation
- ✓ Loading states

## 📚 Documentation

- **README.md** - Full documentation
- **IMPLEMENTATION_GUIDE.md** - How to extend the app
- **.env.example** - Environment variables
- See also: Backend API docs

## 🚀 Next Steps

1. **Explore the UI**
   - Login with demo accounts
   - Click around different pages
   - Try dark mode

2. **Connect Backend**
   - Ensure your API is running
   - Update `VITE_API_URL` in `.env.local`
   - Test API calls in browser console

3. **Customize**
   - Edit colors in `tailwind.config.js`
   - Modify components in `src/components/`
   - Add new pages in `src/pages/`

4. **Deploy**
   - Run `npm run build`
   - Deploy `dist/` folder to hosting

## 🤔 Need Help?

- Check browser console for errors (`F12`)
- Review README.md for detailed docs
- Check backend API is running properly
- Verify environment variables are set

## 🎉 Success Checklist

- [ ] Dependencies installed (`npm install` complete)
- [ ] Dev server running (`npm run dev` works)
- [ ] App opens at `http://localhost:3000`
- [ ] Can login with demo credentials
- [ ] Dark mode toggle works
- [ ] Responsive on mobile (check with DevTools)

---

**Congratulations! Your frontend is ready! 🎊**

Now connect it with your backend API and start managing field workers!
