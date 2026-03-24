# GeoSentinel OS - Frontend Dashboard (React + Tailwind) Complete Guide

## 🌐 Dashboard Overview

Admin-focused React + Tailwind CSS dashboard for monitoring workforce attendance, task management, and generating analytics reports.

**Features:**
- Role-based views (State Admin, District Admin, Taluka Admin)
- Real-time worker location tracking
- Attendance monitoring and reports
- Task creation and assignment
- Spoof detection alerts
- Responsive design (mobile, tablet, desktop)
- Dark + light mode
- Data export (CSV/PDF - optional)

**Tech Stack:**
- React 18.2+
- Vite (build tool)
- Tailwind CSS 3.x
- axios (API client)
- Chart.js or Recharts (optional - analytics)

---

## 📁 Project Structure

```
dashboard/frontend/
├── index.html                          # Entry HTML
├── vite.config.js                     # Vite configuration
├── tailwind.config.js                 # Tailwind setup
├── postcss.config.js
├── package.json                       # Dependencies
│
├── src/
│   ├── main.jsx                       # React root
│   ├── App.jsx                        # Main app component
│   ├── index.css                      # Tailwind imports
│   │
│   ├── pages/                         # Page components
│   │   ├── Dashboard.jsx              # Main dashboard
│   │   ├── WorkerTracking.jsx         # Worker location map
│   │   ├── AttendanceHistory.jsx      # Attendance records
│   │   ├── TaskManagement.jsx         # CRUD tasks
│   │   ├── Reports.jsx                # Analytics & charts
│   │   ├── SpoofDetection.jsx         # Suspicious activities
│   │   ├── UserSettings.jsx           # Profile & settings
│   │   └── NotFound.jsx               # 404 page
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx             # Top navigation
│   │   │   ├── Sidebar.jsx            # Left navigation (desktop)
│   │   │   ├── BottomNav.jsx          # Bottom nav (mobile)
│   │   │   └── Layout.jsx             # Main layout wrapper
│   │   ├── Tables/
│   │   │   ├── WorkersTable.jsx       # Worker list
│   │   │   ├── TasksTable.jsx         # Task list
│   │   │   ├── AttendanceTable.jsx    # Attendance records
│   │   │   └── LocationsTable.jsx     # Location history
│   │   ├── Cards/
│   │   │   ├── StatsCard.jsx          # KPI cards
│   │   │   ├── WorkerCard.jsx         # Worker profile card
│   │   │   └── TaskCard.jsx           # Task summary card
│   │   ├── Charts/
│   │   │   ├── AttendanceChart.jsx    # Line/Bar chart
│   │   │   ├── TaskCompletionChart.jsx # Pie/Doughnut chart
│   │   │   └── HeatmapChart.jsx       # Location heatmap
│   │   ├── Forms/
│   │   │   ├── TaskForm.jsx           # Create/edit task
│   │   │   ├── FilterForm.jsx         # Advanced filters
│   │   │   └── SearchBar.jsx          # Global search
│   │   ├── Modals/
│   │   │   ├── ConfirmDialog.jsx      # Confirmation
│   │   │   ├── WorkerDetailsModal.jsx # Worker profile
│   │   │   └── TaskDetailsModal.jsx   # Task details
│   │   ├── Utils/
│   │   │   ├── LoadingSpinner.jsx     # Loading state
│   │   │   ├── ErrorBoundary.jsx      # Error handling
│   │   │   ├── DarkModeToggle.jsx     # Theme switcher
│   │   │   └── Badge.jsx              # Status badges
│   │   └── Map/
│   │       └── WorkerMap.jsx          # Leaflet map
│   │
│   ├── services/
│   │   ├── api.js                     # API client (axios)
│   │   └── storage.js                 # LocalStorage wrapper
│   │
│   ├── hooks/
│   │   ├── useFetch.js                # Data fetching
│   │   ├── useAuth.js                 # Auth state
│   │   ├── useDarkMode.js             # Dark mode
│   │   └── usePagination.js           # Table pagination
│   │
│   ├── utils/
│   │   ├── constants.js               # API endpoints, roles
│   │   ├── formatters.js              # Date/number formatting
│   │   ├── validators.js              # Form validation
│   │   └── permissions.js             # Role-based access
│   │
│   ├── styles/
│   │   ├── theme.css                  # Color variables
│   │   ├── animations.css             # Keyframe animations
│   │   └── responsive.css             # Media queries
│   │
│   └── context/
│       ├── AuthContext.jsx            # Auth context
│       └── NotificationContext.jsx    # Toast notifications
```

---

## 🚀 Installation & Setup

### Prerequisites
```
- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:8000
```

### Step-by-Step Setup

```bash
# 1. Navigate to dashboard directory
cd dashboard/frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=GeoSentinel OS Dashboard
VITE_MAP_PROVIDER=leaflet
VITE_ENABLE_ANALYTICS=true
EOF

# 4. Start development server
npm run dev

# 5. Open browser
# Dashboard available at http://localhost:5173
```

---

## 🔐 Authentication & Role Management

### Role Hierarchy

```javascript
const ROLES = {
  ADMIN: 'ADMIN',                    // State level
  DISTRICT_ADMIN: 'DISTRICT_ADMIN',  // District level
  TALUKA_ADMIN: 'TALUKA_ADMIN',      // Taluka level
  WORKER: 'WORKER',                  // Field worker
};

const PERMISSIONS = {
  // State Admin - full access
  view_all_workers: ['ADMIN'],
  view_state_analytics: ['ADMIN'],
  view_spoof_alerts: ['ADMIN'],
  
  // District Admin - district level
  view_district_workers: ['ADMIN', 'DISTRICT_ADMIN'],
  manage_district_tasks: ['ADMIN', 'DISTRICT_ADMIN'],
  view_district_reports: ['ADMIN', 'DISTRICT_ADMIN'],
  
  // Taluka Admin - taluka level
  view_taluka_workers: ['ADMIN', 'DISTRICT_ADMIN', 'TALUKA_ADMIN'],
  create_tasks: ['ADMIN', 'DISTRICT_ADMIN', 'TALUKA_ADMIN'],
  view_taluka_reports: ['ADMIN', 'DISTRICT_ADMIN', 'TALUKA_ADMIN'],
  
  // All authenticated users
  view_own_profile: ['ADMIN', 'DISTRICT_ADMIN', 'TALUKA_ADMIN', 'WORKER'],
};
```

### Protected Routes

```javascript
// App.jsx
import { Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workers" element={<WorkerTracking />} />
        <Route path="/tasks" element={<TaskManagement />} />
        <Route path="/attendance" element={<AttendanceHistory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/alerts" element={<SpoofDetection />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

---

## 📱 Core Pages

### 1. Dashboard (Main View)

**Purpose:** Overview of system metrics and quick actions

**Components:**
- Stats cards (Total workers, attendance today, pending tasks, alerts)
- Recent activities feed
- Quick action buttons
- At-a-glance charts

**Code Structure:**

```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import useFetch from '../hooks/useFetch';
import StatsCard from '../components/Cards/StatsCard';
import Layout from '../components/Layout/Layout';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading } = useFetch('/admin/stats');
  const { data: activities, loading: activitiesLoading } = 
    useFetch('/admin/recent-activities');

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Workers"
          value={stats?.total_workers || 0}
          trend="+5.2%"
          icon="users"
        />
        <StatsCard
          title="Present Today"
          value={stats?.present_today || 0}
          trend={stats?.attendance_rate || '0%'}
          icon="check-circle"
        />
        <StatsCard
          title="Tasks Pending"
          value={stats?.pending_tasks || 0}
          trend={stats?.overdue || 0}
          icon="task-list"
        />
        <StatsCard
          title="Spoof Alerts"
          value={stats?.spoof_alerts || 0}
          trend="⚠️"
          icon="alert-triangle"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {activities?.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between pb-3
                           border-b border-gray-200 dark:border-gray-700"
              >
                <div>
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-gray-500">
                    {formatTime(activity.timestamp)}
                  </p>
                </div>
                <Badge variant={activity.type} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button href="/tasks" variant="primary">
              Create Task
            </Button>
            <Button href="/workers" variant="secondary">
              View Workers
            </Button>
            <Button href="/attendance" variant="secondary">
              Attendance Report
            </Button>
            <Button href="/alerts" variant="warning">
              View Alerts
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

---

### 2. Worker Tracking

**Purpose:** Monitor all workers' current locations

**Features:**
- Map view (Leaflet or Google Maps)
- Worker list with status
- Real-time location updates
- Geofence visualization
- Filter by status/taluka

**Code Structure:**

```javascript
import React, { useState, useEffect } from 'react';
import useFetch from '../hooks/useFetch';
import WorkerMap from '../components/Map/WorkerMap';
import WorkersTable from '../components/Tables/WorkersTable';

export default function WorkerTracking() {
  const [mapView, setMapView] = useState(true);
  const { data: workers, refetch } = useFetch('/tracking/workers');

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Worker Tracking</h1>
        <button
          onClick={() => setMapView(!mapView)}
          className="px-4 py-2 bg-primary-600 text-white rounded"
        >
          {mapView ? '📋 List View' : '🗺️ Map View'}
        </button>
      </div>

      {mapView ? (
        <WorkerMap workers={workers} />
      ) : (
        <WorkersTable workers={workers} />
      )}
    </div>
  );
}
```

**WorkerMap Component:**

```javascript
import React from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

export default function WorkerMap({ workers = [] }) {
  // Default center (can be customized)
  const center = [19.0760, 72.8777]; // Mumbai Maharanagar

  return (
    <div className="h-96 rounded-lg shadow overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {workers?.map((worker) => (
          <React.Fragment key={worker.id}>
            {/* Worker Marker */}
            <Marker
              position={[worker.last_location.latitude, 
                        worker.last_location.longitude]}
              icon={getWorkerIcon(worker.status)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{worker.full_name}</p>
                  <p>Status: {worker.status}</p>
                  <p>Accuracy: {worker.last_location.accuracy}m</p>
                </div>
              </Popup>
            </Marker>

            {/* Geofence Circle */}
            <Circle
              center={[worker.geofence.center_lat, 
                      worker.geofence.center_lon]}
              radius={worker.geofence.radius}
              pathOptions={{
                color: 'blue',
                fillColor: 'lightblue',
                fillOpacity: 0.1,
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}

function getWorkerIcon(status) {
  const colors = {
    active: '#10b981',      // Green
    inactive: '#ef4444',    // Red
    on_break: '#f59e0b',    // Yellow
  };
  
  return L.circleMarker(
    { radius: 8, color: colors[status] || '#0ea5e9' }
  );
}
```

---

### 3. Attendance History

**Purpose:** View and analyze attendance records

**Features:**
- Table of attendance records with filters
- Date range picker
- Export to CSV
- Anomaly highlighting (spoof flags)

**Code Structure:**

```javascript
import React, { useState } from 'react';
import useFetch from '../hooks/useFetch';
import AttendanceTable from '../components/Tables/AttendanceTable';
import FilterForm from '../components/Forms/FilterForm';

export default function AttendanceHistory() {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    workerId: null,
    status: 'all',
  });

  const { data: attendance, loading, refetch } = useFetch(
    '/attendance/history',
    {
      params: {
        start_date: filters.startDate.toISOString().split('T')[0],
        end_date: filters.endDate.toISOString().split('T')[0],
        worker_id: filters.workerId,
      },
    }
  );

  const handleExportCSV = () => {
    const headers = ['Date', 'Worker', 'Time', 'Location', 'Status'];
    const rows = attendance.map((a) => [
      a.date,
      a.worker_name,
      a.time,
      `${a.latitude}, ${a.longitude}`,
      a.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `attendance_${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Attendance Records</h1>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          📥 Export CSV
        </button>
      </div>

      <FilterForm filters={filters} onChange={setFilters} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AttendanceTable
          records={attendance}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}
```

---

### 4. Task Management

**Purpose:** Create and manage worker tasks

**Features:**
- Create new tasks with due dates
- Assign to workers
- Track completion status
- Update task status
- Delete tasks

**Code Structure:**

```javascript
import React, { useState } from 'react';
import useFetch from '../hooks/useFetch';
import TaskForm from '../components/Forms/TaskForm';
import TasksTable from '../components/Tables/TasksTable';

export default function TaskManagement() {
  const [showForm, setShowForm] = useState(false);
  const { data: tasks, loading, refetch } = useFetch('/tasks');

  const handleCreateTask = async (taskData) => {
    try {
      await apiClient.post('/tasks', taskData);
      setShowForm(false);
      refetch();
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await apiClient.put(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      refetch();
      toast.success('Task updated');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded"
        >
          ✚ Create Task
        </button>
      </div>

      {showForm && (
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <TasksTable
          tasks={tasks}
          onStatusChange={handleUpdateStatus}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}
```

---

### 5. Spoof Detection Alerts

**Purpose:** Monitor suspicious activities

**Features:**
- List of flagged attendance records
- Severity levels (low, medium, high)
- Investigation tools
- Mark as resolved/false alarm

**Code Structure:**

```javascript
import React, { useState } from 'react';
import useFetch from '../hooks/useFetch';

export default function SpoofDetection() {
  const { data: alerts, refetch } = useFetch('/admin/spoof-detections');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const severityColor = {
    low: 'bg-yellow-100 text-yellow-800',
    medium: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800',
  };

  const flagDescriptions = {
    gps_jump: 'Sudden GPS location change',
    speed_anomaly: 'Speed exceeds realistic limits',
    sensor_mismatch: 'GPS movement without acceleration',
    time_anomaly: 'Timestamp inconsistency',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">⚠️ Spoof Detection Alerts</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Worker
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Time
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {alerts?.map((alert) => (
              <tr
                key={alert.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{alert.worker_name}</p>
                    <p className="text-sm text-gray-500">
                      {alert.worker_id}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {alert.flags.map((flag) => (
                      <p key={flag}>{flagDescriptions[flag]}</p>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium 
                               ${severityColor[alert.severity]}`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {formatTime(alert.created_at)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Review →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
}
```

---

## 🎨 UI Components

### StatsCard

```javascript
export default function StatsCard({
  title,
  value,
  trend,
  icon,
  color = 'blue',
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className={`text-sm mt-2 ${
            trend?.includes('-') ? 'text-red-600' : 'text-green-600'
          }`}>
            {trend}
          </p>
        </div>
        <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900 
                       rounded-lg flex items-center justify-center`}>
          {/* Icon here */}
        </div>
      </div>
    </div>
  );
}
```

### Badge Component

```javascript
export default function Badge({ variant = 'gray', children }) {
  const variants = {
    gray: 'bg-gray-100 text-gray-900 dark:bg-gray-700',
    green: 'bg-green-100 text-green-900 dark:bg-green-700',
    red: 'bg-red-100 text-red-900 dark:bg-red-700',
    yellow: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-700',
    blue: 'bg-blue-100 text-blue-900 dark:bg-blue-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium 
                      ${variants[variant]}`}>
      {children}
    </span>
  );
}
```

---

## 🔄 Custom Hooks

### useFetch Hook

```javascript
import { useState, useEffect } from 'react';
import apiClient from '../services/api';

export default function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(url, options);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [url]);

  return { data, loading, error, refetch: fetch };
}
```

### useAuth Hook

```javascript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
```

---

## 🛠️ API Integration

### api.js - Axios Configuration

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// Auto-inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🎯 Role-Based Views

### Dashboard View by Role

**State Admin:**
```
- Total workers across state
- Attendance rate by district
- Task completion rate
- Spoof detection alerts
- State-wide analytics
```

**District Admin:**
```
- Workers in district
- District attendance summary
- Taluka-level performance
- District alerts
- District reports
```

**Taluka Admin:**
```
- Workers in taluka
- Task assignment interface
- Taluka attendance
- Worker-level details
- Task completion tracking
```

---

## 📊 Dark Mode Implementation

### theme.css

```css
:root {
  /* Light mode */
  --color-bg: #ffffff;
  --color-text: #111827;
  --color-border: #e5e7eb;
  --color-hover: #f3f4f6;
}

html[data-theme='dark'] {
  /* Dark mode */
  --color-bg: #111827;
  --color-text: #f3f4f6;
  --color-border: #374151;
  --color-hover: #1f2937;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  transition: background-color 0.3s ease;
}
```

### DarkModeToggle Component

```javascript
import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
```

---

## 🚀 Production Build

```bash
# Build optimized bundle
npm run build

# Preview build locally
npm run preview

# Deploy to Vercel
npm install -g vercel
vercel

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy
```

---

**Dashboard is fully responsive, dark-mode ready, and production-optimized!**

