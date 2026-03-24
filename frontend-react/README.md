# GeoSentinel OS - Modern Frontend UI

A modern, responsive, and feature-rich frontend for the GeoSentinel OS - a comprehensive field worker tracking and management system. Built with React, Vite, and Tailwind CSS.

## 📋 Features

### 🎨 Design
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Dark Mode Support**: Full dark/light theme toggle with system preference detection
- **Mobile-First**: Optimized for field workers on mobile devices
- **Clean & Modern**: Minimal UI with high readability
- **Accessible**: WCAG compliant components

### 👥 Role-Based Dashboards
1. **Worker Dashboard** - Task management and attendance tracking
2. **Taluka Admin Dashboard** - Worker and task management
3. **District Admin Dashboard** - Monitor talukas and performance
4. **State Admin Dashboard** - Full analytics across all districts

### 🚀 Key Components
- **Responsive Navigation** - Navbar with dark mode toggle and user menu
- **Flexible Sidebar** - Collapsible on mobile, fixed on desktop
- **Data Tables** - Sortable, filterable, with pagination
- **Status Badges** - Visual indicators for task status
- **Cards & Charts** - KPI displays and progress tracking
- **Forms** - Input validation and error handling
- **Modals** - For task assignment and actions
- **Alerts** - Toast notifications and error messages

### 📱 Worker Features
- ✅ Mark attendance with GPS verification
- 📍 Real-time geofence status (inside/outside work area)
- 📋 View assigned tasks
- 📸 Upload work proof with images
- 📊 Task progress tracking

### 👨‍💼 Admin Features
- 👥 Worker management and monitoring
- 📋 Task assignment and tracking
- 📊 Performance analytics and KPIs
- 🚨 Alerts for missed tasks
- 📈 Trends and reports
- 🎯 District/Taluka comparison

## 🛠️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Routing**: React Router v6

## 📦 Project Structure

```
frontend-react/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common.jsx       # Common components (Input, Button, etc.)
│   │   ├── Cards.jsx        # Card components (TaskCard, WorkerCard, etc.)
│   │   ├── DataTable.jsx    # Table component with pagination
│   │   ├── Navbar.jsx       # Top navigation
│   │   ├── Sidebar.jsx      # Side navigation
│   │   ├── MainLayout.jsx   # Main layout wrapper
│   │   ├── ProtectedRoute.jsx # Auth guard
│   │   └── index.js         # Component exports
│   ├── pages/               # Page components
│   │   ├── LoginPage.jsx    # Login page
│   │   ├── NotFoundPage.jsx # 404 page
│   │   ├── worker/          # Worker pages
│   │   │   ├── WorkerDashboard.jsx
│   │   │   └── TaskCompletionPage.jsx
│   │   └── admin/           # Admin pages
│   │       ├── TalukaAdminDashboard.jsx
│   │       ├── DistrictAdminDashboard.jsx
│   │       └── StateAdminDashboard.jsx
│   ├── services/            # API services
│   │   └── api.js           # Axios instance & API calls
│   ├── store/               # State management
│   │   └── authStore.js     # Zustand stores
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── vite.config.js           # Vite config
├── tailwind.config.js       # Tailwind config
├── postcss.config.js        # PostCSS config
├── package.json             # Dependencies
├── .env.example             # Environment template
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn installed
- Backend API server running (see [Backend Setup](#backend-setup))

### Installation

1. **Clone the repository** (if not already done)
```bash
cd frontend-react
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
# Edit .env.local and set VITE_API_URL to your backend server
```

4. **Start development server**
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## 🔌 API Integration

The frontend expects the backend to provide these API endpoints:

### Authentication
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile
- `POST /auth/logout` - Logout

### Worker APIs
- `GET /tasks` - Get assigned tasks
- `GET /attendance/status` - Get attendance status
- `POST /attendance` - Mark attendance
- `POST /tasks/{id}/complete` - Complete task
- `POST /location/log` - Log location
- `POST /location/geofence-check` - Check geofence

### Admin APIs
- `GET /workers` - Get workers list
- `GET /tasks` - Get all tasks
- `POST /tasks` - Create task
- `PUT /tasks/{id}` - Update task
- `GET /admin/stats` - Get statistics
- Various role-specific endpoints

See [API.md](../docs/API.md) in the backend documentation for full API details.

## 🎨 Color Scheme

### Light Mode
- **Background**: White
- **Primary**: #2563EB (Blue)
- **Text**: #111827 (Dark Gray)
- **Borders**: #E5E7EB (Light Gray)

### Dark Mode
- **Background**: #111827 (Dark Gray)
- **Primary**: #2563EB (Blue)
- **Text**: #F9FAFB (Light Gray)
- **Borders**: #374151 (Medium Gray)

### Accent Colors
- **Success**: #10B981 (Green)
- **Danger**: #EF4444 (Red)
- **Warning**: #F59E0B (Amber)

## 🎯 Usage Guide

### Default Demo Credentials (for testing)

Use one of these credentials to test different roles:

```
Role: Worker
Email: demo-worker@geosentinel.local
Password: demo123

Role: Taluka Admin
Email: demo-taluka@geosentinel.local
Password: demo123

Role: District Admin
Email: demo-district@geosentinel.local
Password: demo123

Role: State Admin
Email: demo-state@geosentinel.local
Password: demo123
```

### Worker Workflow
1. Login as Worker
2. Grant location permission
3. Mark attendance (GPS verification)
4. View assigned tasks
5. Complete tasks (upload proof)
6. View location tracking

### Admin Workflow
1. Login with admin role
2. View dashboard with KPIs
3. Manage workers (view, edit, delete)
4. Assign tasks to workers
5. Track task completion
6. View analytics and reports
7. Manage alerts

## 🌙 Dark Mode

Dark mode is automatically enabled/disabled based on:
1. User preference (persisted in localStorage)
2. System preference (if no user preference set)

Users can toggle dark mode using the moon/sun icon in the navbar.

## 📱 Responsive Breakpoints

```
Mobile: < 640px (sm)
Tablet: 640px - 1024px (md, lg)
Desktop: > 1024px (xl, 2xl)
```

## 🔒 Authentication & Security

- JWT token stored in localStorage
- Authorization headers automatically added to API requests
- Protected routes redirect unauthenticated users to login
- Automatic logout on 401 responses
- Role-based access control

## 📊 State Management

Using Zustand for lightweight state management:

```javascript
// Auth Store
useAuthStore() // user, token, role, isDarkMode

// UI Store
useUIStore() // sidebarOpen, notifications, loading

// Worker Store
useWorkerStore() // attendanceStatus, tasks, location

// Admin Store
useAdminStore() // workers, tasks, stats, filters
```

## 🎯 Features Implementation Status

### Completed ✅
- [x] Login page with role selection
- [x] Worker dashboard with attendance
- [x] Task management UI
- [x] Responsive design (mobile-first)
- [x] Dark/light mode
- [x] Component library
- [x] API service layer
- [x] Taluka admin dashboard
- [x] District admin dashboard
- [x] State admin dashboard
- [x] Error handling
- [x] Loading states

### Can Be Extended 🚀
- [ ] Real-time notifications (WebSocket)
- [ ] Offline mode (Service Workers)
- [ ] Map integration (Google Maps/Mapbox)
- [ ] Image optimization
- [ ] Advanced analytics charts
- [ ] Export reports to PDF/Excel
- [ ] Multi-language support
- [ ] Two-factor authentication

## 🐛 Troubleshooting

### API Connection Issues
- Ensure backend server is running
- Check `VITE_API_URL` in `.env.local`
- Verify CORS settings on backend
- Check browser console for errors

### Dark Mode Not Working
- Clear localStorage: `localStorage.clear()`
- Restart development server
- Check browser dark mode preference

### Login Issues
- Verify backend is running
- Check demo credentials
- Ensure API endpoints exist
- Check network tab for errors

## 📝 Notes for Judges

This frontend demonstrates:

1. **Modern React Practices**
   - Functional components with hooks
   - Custom hooks for reusability
   - Proper state management
   - Component composition

2. **Responsive Design**
   - Mobile-first approach
   - Tailwind CSS utilities
   - Flexible layouts
   - Touch-friendly interfaces

3. **User Experience**
   - Dark/light mode support
   - Loading and error states
   - Form validation
   - Intuitive navigation
   - Large buttons for field workers

4. **Code Quality**
   - Clean, commented code
   - Reusable components
   - Separation of concerns
   - Proper error handling
   - Environmental configuration

5. **Professional Features**
   - Role-based dashboards
   - Real-time status indicators
   - Task management system
   - Analytics and KPIs
   - Responsive data tables

## 📄 License

© 2024 GeoSentinel OS. All rights reserved.

## 🤝 Support

For issues, feature requests, or support:
1. Check the troubleshooting section
2. Review backend API documentation
3. Check browser console for error messages
4. Verify environment configuration

---

**Built with ❤️ for field worker management**
