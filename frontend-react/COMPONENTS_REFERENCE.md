# 🎨 Component Library Reference

Quick reference guide for all available components in GeoSentinel OS Frontend.

## Base Components (from `common.jsx`)

### Card
Responsive card container with shadow and dark mode support.
```javascript
import { Card } from '../components'

<Card className="p-6">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

### Button
Reusable button with multiple variants and sizes.
```javascript
import { Button } from '../components'

// Variants: primary, secondary, danger, success
// Sizes: sm, md, lg
<Button variant="primary" size="md" fullWidth>
  Click Me
</Button>
```

### Input
Text input with validation and error display.
```javascript
import { Input } from '../components'

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
/>
```

### Select
Dropdown with options.
```javascript
import { Select } from '../components'

<Select
  label="Role"
  options={[
    { label: 'Worker', value: 'worker' },
    { label: 'Admin', value: 'admin' }
  ]}
  value={role}
  onChange={(e) => setRole(e.target.value)}
/>
```

### Textarea
Multi-line text input.
```javascript
import { Textarea } from '../components'

<Textarea
  label="Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### StatusBadge
Visual status indicator.
```javascript
import { StatusBadge } from '../components'

// Statuses: completed, pending, in-progress, failed, active, inactive
<StatusBadge status="completed" size="md" />
```

### LoadingSpinner
Loading indicator.
```javascript
import { LoadingSpinner } from '../components'

// Size: sm, md, lg
// fullScreen: show full screen overlay
<LoadingSpinner size="md" />
<LoadingSpinner fullScreen />
```

### Alert
Toast notification.
```javascript
import { Alert } from '../components'

// Types: success, error, warning, info
<Alert
  type="success"
  message="Saved successfully!"
  onClose={() => setAlertOpen(false)}
  autoClose={5000}
/>
```

### Modal
Dialog box.
```javascript
import { Modal } from '../components'

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  actions={
    <>
      <Button onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="danger">Delete</Button>
    </>
  }
>
  <p>Are you sure?</p>
</Modal>
```

### EmptyState
Placeholder for empty content.
```javascript
import { EmptyState } from '../components'
import { Box } from 'lucide-react'

<EmptyState
  icon={Box}
  title="No items"
  description="No data to display"
  action={<Button>Create New</Button>}
/>
```

---

## Card Components (from `Cards.jsx`)

### TaskCard
Display task information.
```javascript
import { TaskCard } from '../components'

<TaskCard
  task={{
    id: 1,
    title: "Install Water Pump",
    description: "Install pump at location XYZ",
    status: "pending",
    dueDate: "2024-03-30",
    location: "Village A",
    assignedTo: "John Doe"
  }}
  onAction={() => handleTaskClick()}
  actionLabel="View Details"
/>
```

### WorkerCard
Display worker information.
```javascript
import { WorkerCard } from '../components'

<WorkerCard
  worker={{
    id: 1,
    name: "John Doe",
    status: "active",
    phone: "9876543210",
    location: "Village A",
    tasksCompleted: 15
  }}
  onAction={() => handleWorkerClick()}
  actionLabel="Assign Task"
/>
```

### StatsCard
Display KPI metrics.
```javascript
import { StatsCard } from '../components'
import { Users } from 'lucide-react'

<StatsCard
  title="Active Workers"
  value={150}
  icon={Users}
  color="primary"
  trend={{ direction: 'up', value: 12 }}
  onClick={() => handleClick()}
/>
```

### AttendanceStatusCard
Show current attendance state.
```javascript
import { AttendanceStatusCard } from '../components'

<AttendanceStatusCard
  checked={isCheckedIn}
  timestamp={checkInTime}
  onAction={() => markAttendance()}
/>
```

### ProgressCard
Display progress with bar.
```javascript
import { ProgressCard } from '../components'

<ProgressCard
  title="Tasks Completed"
  current={18}
  total={25}
  color="primary"
  showPercentage={true}
/>
```

---

## Layout Components

### Navbar
Top navigation bar.
```javascript
import { Navbar } from '../components'

<Navbar
  onMenuClick={() => toggleSidebar()}
  showMenuButton={true}
/>
```

### Sidebar
Side navigation menu.
```javascript
import { Sidebar } from '../components'

<Sidebar
  isOpen={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  isMobileView={isMobile}
/>
```

### MainLayout
Main page layout wrapper.
```javascript
import { MainLayout } from '../components'

<MainLayout
  title="Page Title"
  subtitle="Page description"
  showSidebar={true}
>
  {/* Page content */}
</MainLayout>
```

---

## Data Display Components

### DataTable
Responsive data table with pagination.
```javascript
import { DataTable } from '../components'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={value} />
  }
]

<DataTable
  columns={columns}
  data={workersList}
  loading={false}
  pagination={true}
  pageSize={10}
  onRowClick={(row) => handleRowClick(row)}
/>
```

### FilterBar
Filter controls.
```javascript
import { FilterBar } from '../components'

const filters = {
  status: 'all',
  searchTerm: '',
  dateRange: 'week'
}

<FilterBar
  filters={filters}
  onFilterChange={(key, value) => setFilters({[key]: value})}
  onReset={() => setFilters(initialFilters)}
/>
```

---

## Layout Patterns

### Two Column Layout
```javascript
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card>Left Column</Card>
  <Card>Right Column</Card>
</div>
```

### Three Column Layout
```javascript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>Column 1</Card>
  <Card>Column 2</Card>
  <Card>Column 3</Card>
</div>
```

### Responsive Grid
```javascript
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

---

## Icon Usage

Using Lucide React icons:

```javascript
import {
  Users,
  CheckSquare,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  Camera,
  Menu,
  LogOut,
  Moon,
  Sun,
  Eye,
  EyeOff
} from 'lucide-react'

// In component
<Users size={24} className="text-primary-600" />
```

---

## Common Patterns

### Loading State
```javascript
{loading ? (
  <LoadingSpinner fullScreen />
) : (
  <YourContent />
)}
```

### Error Handling
```javascript
{error && (
  <Alert
    type="error"
    message={error}
    onClose={() => setError('')}
  />
)}
```

### Form Submission
```javascript
<form onSubmit={handleSubmit} className="space-y-4">
  <Input label="Field" required />
  <Button type="submit" loading={submitting} fullWidth>
    Submit
  </Button>
</form>
```

### Modal Dialog
```javascript
{showModal && (
  <Modal
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    title="Confirm"
    actions={
      <>
        <Button onClick={() => setShowModal(false)}>Cancel</Button>
        <Button variant="danger" onClick={handleConfirm}>
          Delete
        </Button>
      </>
    }
  >
    <p>Are you sure?</p>
  </Modal>
)}
```

---

## Tailwind Utilities Used

### Spacing
- `p-4` - Padding
- `m-2` - Margin
- `gap-4` - Gap between flex/grid items
- `space-y-4` - Vertical spacing for children

### Layout
- `flex` - Flexbox
- `grid` - Grid layout
- `w-full` - Full width
- `h-screen` - Full height
- `hidden` / `block` - Display

### Responsive
- `sm:`, `md:`, `lg:` - Breakpoint prefixes
- `flex-col md:flex-row` - Column on mobile, row on tablet+
- `hidden md:block` - Hide on mobile, show on tablet+

### Colors
- `bg-primary-600` - Primary background
- `text-white` - White text
- `border-gray-200` - Border color
- `hover:bg-gray-100` - Hover state

### Dark Mode
- `dark:bg-gray-800` - Dark mode background
- `dark:text-white` - Dark mode text
- `dark:border-gray-700` - Dark mode border

---

## Using Lucide Icons

Complete list of icons used:

```javascript
Camera, MapPin, Clock, Navigation,
CheckCircle, AlertCircle, Users, CheckSquare,
BarChart3, TrendingUp, AlertTriangle, Menu,
LogOut, Moon, Sun, Eye, EyeOff, ChevronLeft,
ChevronRight, ChevronsLeft, ChevronsRight, X,
Upload, ChevronsRight
```

---

## Best Practices

1. **Always use MainLayout for pages**
   ```javascript
   <MainLayout title="Title" subtitle="Subtitle">
     {/* Content */}
   </MainLayout>
   ```

2. **Use Tailwind for styling**
   ```javascript
   // ✅ Good
   <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
   
   // ❌ Avoid
   <div style={{backgroundColor: '#fff', padding: '16px'}}>
   ```

3. **Include dark mode classes**
   ```javascript
   <p className="text-gray-900 dark:text-white">
   ```

4. **Use responsive classes**
   ```javascript
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

5. **Handle loading and error states**
   ```javascript
   {loading && <LoadingSpinner />}
   {error && <Alert type="error" message={error} />}
   ```

---

## Component Sizing Reference

### Button Sizes
- `size="sm"` - Small (for secondary actions)
- `size="md"` - Medium (default)
- `size="lg"` - Large (for primary actions, mobile)

### Badge Sizes
- `size="sm"` - Extra small
- `size="md"` - Small
- `size="lg"` - Medium

### Spinner Sizes
- `size="sm"` - Small (8x8)
- `size="md"` - Medium (32x32)
- `size="lg"` - Large (48x48)

### Icon Sizes
- `size={16}` - Small
- `size={20}` - Regular
- `size={24}` - Medium
- `size={32}` - Large
- `size={48}` - Extra large

---

This reference should help you quickly find and use the right component for any UI need!
