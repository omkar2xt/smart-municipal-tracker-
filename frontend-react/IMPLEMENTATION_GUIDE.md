# GeoSentinel OS Frontend - Implementation Guide

## Project Overview

This is a modern, production-ready React frontend for the GeoSentinel OS field worker tracking system. It's designed to be scalable, maintainable, and easy to extend.

## 📁 Detailed Project Structure

```
frontend-react/
│
├── src/
│   ├── components/                 # Reusable React components
│   │   ├── common.jsx              # Base components (Input, Button, Modal, etc.)
│   │   ├── Cards.jsx               # Specialized card components
│   │   ├── DataTable.jsx           # Table component with pagination
│   │   ├── Navbar.jsx              # Top navigation bar
│   │   ├── Sidebar.jsx             # Side navigation menu
│   │   ├── MainLayout.jsx          # Main page layout wrapper
│   │   ├── ProtectedRoute.jsx      # Authentication guard component
│   │   └── index.js                # Component barrel export
│   │
│   ├── pages/                      # Page components (full screen views)
│   │   ├── LoginPage.jsx           # Login authentication page
│   │   ├── NotFoundPage.jsx        # 404 error page
│   │   ├── worker/                 # Worker role pages
│   │   │   ├── WorkerDashboard.jsx # Main worker dashboard
│   │   │   └── TaskCompletionPage.jsx # Task submission form
│   │   └── admin/                  # Admin role pages
│   │       ├── TalukaAdminDashboard.jsx
│   │       ├── DistrictAdminDashboard.jsx
│   │       └── StateAdminDashboard.jsx
│   │
│   ├── services/                   # External API integration
│   │   └── api.js                  # Axios instance & API endpoints
│   │
│   ├── store/                      # State management (Zustand)
│   │   └── authStore.js            # Authentication & UI state stores
│   │
│   ├── App.jsx                     # Main app component with routing
│   ├── main.jsx                    # React app entry point
│   └── index.css                   # Global styles & Tailwind utilities
│
├── index.html                      # HTML template
├── vite.config.js                  # Vite build configuration
├── tailwind.config.js              # Tailwind CSS customization
├── postcss.config.js               # PostCSS configuration
├── package.json                    # NPM dependencies & scripts
├── .env.example                    # Environment variables template
├── .eslintrc.json                  # ESLint rules
├── .gitignore                      # Git ignore file
└── README.md                       # Project documentation
```

## 🏗️ Architecture

### Component Hierarchy

```
App (Router)
├── LoginPage
└── MainLayout (for authenticated users)
    ├── Navbar
    │   ├── Theme Toggle
    │   └── User Menu
    ├── Sidebar
    │   └── Navigation Items (role-based)
    └── Main Content
        ├── Page Header
        └── Page Content
            ├── Cards
            ├── Tables
            ├── Forms
            └── Modals
```

### State Management Flow

```
Zustand Stores
├── useAuthStore
│   ├── user
│   ├── token
│   ├── role
│   └── isDarkMode
├── useUIStore
│   ├── sidebarOpen
│   ├── notifications
│   └── loading
├── useWorkerStore
│   ├── attendanceStatus
│   ├── currentTask
│   ├── tasks
│   └── location
└── useAdminStore
    ├── workers
    ├── tasks
    ├── attendance
    └── filters
```

### API Service Architecture

```
api.js (Axios Instance)
├── Request Interceptor (Auth token)
├── Response Interceptor (Error handling)
└── API Modules
    ├── authAPI
    ├── workerAPI
    ├── adminAPI
    ├── talukaAdminAPI
    ├── districtAdminAPI
    └── stateAdminAPI
```

## 🚀 How to Extend

### Adding a New Page

1. **Create the page component**
```javascript
// src/pages/NewPage.jsx
import { MainLayout } from '../components/MainLayout'

export const NewPage = () => {
  return (
    <MainLayout title="New Page" subtitle="Description">
      {/* Page content */}
    </MainLayout>
  )
}
```

2. **Add route in App.jsx**
```javascript
<Route
  path="/new-page"
  element={
    <ProtectedRoute requiredRole="worker">
      <NewPage />
    </ProtectedRoute>
  }
/>
```

3. **Add sidebar menu item** (in `Sidebar.jsx`)
```javascript
const roleItems = {
  worker: [
    { label: 'New Page', href: '/new-page', icon: Icon },
  ]
}
```

### Adding a New Component

1. **Create reusable component**
```javascript
// src/components/NewComponent.jsx
export const NewComponent = ({ prop1, prop2, ...props }) => {
  return (
    <div className="component-classes" {...props}>
      {/* Component JSX */}
    </div>
  )
}
```

2. **Export from index.js**
```javascript
// src/components/index.js
export { NewComponent } from './NewComponent'
```

3. **Use in pages**
```javascript
import { NewComponent } from '../components'
```

### Adding a New API Endpoint

1. **Add to API service**
```javascript
// src/services/api.js
export const customAPI = {
  getItems: (params) =>
    axiosInstance.get('/items', { params }),
  
  createItem: (itemData) =>
    axiosInstance.post('/items', itemData),
  
  updateItem: (id, itemData) =>
    axiosInstance.put(`/items/${id}`, itemData),
  
  deleteItem: (id) =>
    axiosInstance.delete(`/items/${id}`),
}
```

2. **Use in component**
```javascript
import { customAPI } from '../services/api'

const handleLoad = async () => {
  try {
    const response = await customAPI.getItems()
    setData(response.data)
  } catch (err) {
    setError('Failed to load items')
  }
}
```

### Adding a New State Store

1. **Create in authStore.js**
```javascript
export const useCustomStore = create((set) => ({
  items: [],
  selectedItem: null,
  
  setItems: (items) => set({ items }),
  setSelectedItem: (item) => set({ selectedItem: item }),
}))
```

2. **Use in components**
```javascript
import { useCustomStore } from '../store/authStore'

const { items, selectedItem, setItems } = useCustomStore()
```

## 🎨 Styling Guide

### Using Tailwind CSS

Always use Tailwind utility classes:

```javascript
// ✅ Good
<div className="w-full px-4 py-2 rounded-lg bg-primary-600 text-white">

// ❌ Avoid
<div style={{width: '100%', padding: '8px 16px', backgroundColor: '#2563EB'}}>
```

### Creating Custom Styles

For complex styles, use the `@layer` directive in `index.css`:

```css
@layer components {
  .custom-button {
    @apply px-6 py-3 rounded-lg font-semibold transition-colors;
  }
}
```

### Dark Mode

Always include dark mode classes:

```javascript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

## 📱 Responsive Design Patterns

### Mobile First Approach

```javascript
// Mobile first - base styles apply to mobile
<div className="flex flex-col gap-4 md:gap-6 lg:flex-row">
  {/* Stacked on mobile, horizontal on desktop */}
</div>
```

### Responsive Tables

The `DataTable` component automatically switches between:
- **Mobile**: Card view (stacked)
- **Desktop**: Table view (traditional)

### Responsive Buttons

```javascript
<Button size="sm" /> // Small on mobile
<Button size="lg" /> // Large on desktop
<Button fullWidth /> // Full width on mobile
```

## 🔐 Security Best Practices

1. **Authentication**
   - Always use `ProtectedRoute` for authenticated pages
   - Check role before displaying role-specific content
   - Logout on 401 responses

2. **API Calls**
   - Never expose API keys in client code
   - Use environment variables for API URLs
   - Validate all user inputs

3. **Token Management**
   - Token stored in localStorage (consider sessionStorage for sensitive apps)
   - Token automatically added to all requests via interceptor
   - Token cleared on logout

## 🧪 Testing

### Component Testing
```javascript
// Would use React Testing Library
import { render, screen } from '@testing-library/react'
import { Button } from './common'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button')).toHaveTextContent('Click me')
})
```

### API Testing
```javascript
// Mock API calls in tests
jest.mock('../services/api', () => ({
  authAPI: {
    login: jest.fn(() => Promise.resolve({ data: { token: 'test' } }))
  }
}))
```

## 📦 Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deployment Options

**Vercel (Recommended)**
```bash
npm i -g vercel
vercel
```

**Netlify**
```bash
npm run build
# Deploy dist/ folder
```

**Traditional Server**
```bash
npm run build
# Copy dist/ to server
# Configure web server to serve index.html for all routes
```

## 🔄 Common Workflows

### User Login Flow
1. User enters credentials on LoginPage
2. API call to `/auth/login`
3. Token and user data stored in localStorage
4. Zustand store updated
5. Navigate to role-based dashboard

### Task Completion Flow
1. Worker views tasks in WorkerDashboard
2. Clicks "Complete Task" button
3. Navigate to TaskCompletionPage
4. Upload images
5. Submit form
6. Navigate back to dashboard

### Admin Task Assignment Flow
1. Admin selects worker from list
2. Opens task assignment modal
3. Fills in task details
4. Clicks "Assign Task"
5. API call updates backend
6. Dashboard refreshes with new task

## ⚙️ Configuration

### Environment Variables

```
# .env.local
VITE_API_URL=http://your-api-server.com/api
VITE_APP_NAME=GeoSentinel OS
VITE_ENV=development
VITE_ENABLE_DARK_MODE=true
```

### Tailwind Customization

Edit `tailwind.config.js` to customize:
- Colors
- Spacing
- Typography
- Breakpoints
- Custom components

## 🐛 Debugging

### Browser DevTools
- React Developer Tools extension
- Network tab for API debugging
- Console for errors

### Logging
```javascript
// Add logging for debugging
console.log('User:', user)
console.error('API Error:', error)
```

### Common Issues

**"Cannot find module"**
- Check import paths match file locations
- Verify relative paths are correct

**"API call fails"**
- Ensure backend is running
- Check VITE_API_URL in .env.local
- Verify API endpoint exists

**"Dark mode not working"**
- Clear localStorage
- Check HTML element has 'dark' class
- Verify Tailwind dark mode config

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Axios Documentation](https://axios-http.com)

## 🚀 Performance Optimization

1. **Code Splitting**
   - Already configured in Vite
   - Routes automatically code-split

2. **Image Optimization**
   - Use Tailwind for small icons
   - Compress images before upload

3. **Bundle Size**
   - Tree-shaking enabled
   - Minification in production

## 🤝 Contributing

When adding features:
1. Create new branch
2. Make changes following patterns in this guide
3. Test thoroughly
4. Submit pull request with description

---

**This guide should help you extend and maintain the GeoSentinel OS frontend effectively!**
