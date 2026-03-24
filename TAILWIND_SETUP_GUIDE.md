# Complete Tailwind CSS + React Vite Setup Guide

## Table of Contents
1. [Project Creation](#project-creation)
2. [Tailwind Installation](#tailwind-installation)
3. [Configuration](#configuration)
4. [CSS Setup](#css-setup)
5. [Basic Layout](#basic-layout)
6. [Reusable Components](#reusable-components)
7. [Dark Mode Support](#dark-mode-support)
8. [Example Pages](#example-pages)

---

## Project Creation

### Step 1: Create Vite Project
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### Step 2: Verify Project Structure
```
frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   └── App.css
├── index.html
├── package.json
├── vite.config.js
└── ...
```

---

## Tailwind Installation

### Step 1: Install Tailwind and Dependencies
```bash
npm install -D tailwindcss postcss autoprefixer
```

### Step 2: Initialize Tailwind Config
```bash
npx tailwindcss init -p
```

This creates two files:
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration

---

## Configuration

### Update tailwind.config.js

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c2d6b',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
```

### postcss.config.js (auto-generated)
```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## CSS Setup

### Update src/index.css

Replace entire file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
@layer base {
  html {
    @apply scroll-smooth;
  }

  body {
    @apply bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors;
  }
}

/* Custom component classes */
@layer components {
  .btn-base {
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
  }

  .input-base {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white;
  }

  .card-base {
    @apply bg-white rounded-lg shadow-md dark:bg-gray-800 p-6;
  }

  .container-center {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}

/* Animations */
@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
```

### Clean up App.css

Replace `src/App.css` with:

```css
/* App-specific styles if needed */
/* Most styling will be done with Tailwind classes */
```

---

## Basic Layout

### Responsive Container Component

Create `src/components/Container.jsx`:

```jsx
export default function Container({ children, className = '' }) {
  return (
    <div className={`container-center ${className}`}>
      {children}
    </div>
  );
}
```

### Responsive Grid Component

Create `src/components/Grid.jsx`:

```jsx
export default function Grid({ children, cols = 1, className = '' }) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[cols] || 'grid-cols-1';

  return (
    <div className={`grid ${colsClass} gap-6 ${className}`}>
      {children}
    </div>
  );
}
```

### Example Usage in App.jsx

```jsx
import Container from './components/Container';
import Grid from './components/Grid';

export default function App() {
  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold mb-8">Welcome to Tailwind</h1>
      
      <Grid cols={3}>
        <div className="card-base">
          <h3 className="text-lg font-semibold mb-2">Card 1</h3>
          <p className="text-gray-600 dark:text-gray-300">Content here</p>
        </div>
        <div className="card-base">
          <h3 className="text-lg font-semibold mb-2">Card 2</h3>
          <p className="text-gray-600 dark:text-gray-300">Content here</p>
        </div>
        <div className="card-base">
          <h3 className="text-lg font-semibold mb-2">Card 3</h3>
          <p className="text-gray-600 dark:text-gray-300">Content here</p>
        </div>
      </Grid>
    </Container>
  );
}
```

---

## Reusable Components

### 1. Button Component

Create `src/components/Button.jsx`:

```jsx
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'btn-base font-semibold transition-all duration-200';

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white disabled:opacity-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 disabled:opacity-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 2. Card Component

Create `src/components/Card.jsx`:

```jsx
export default function Card({
  children,
  title,
  subtitle,
  footer,
  className = '',
  hoverable = false,
}) {
  return (
    <div
      className={`card-base ${
        hoverable ? 'hover:shadow-lg cursor-pointer transition-shadow' : ''
      } ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className={title ? 'mb-4' : ''}>
        {children}
      </div>

      {footer && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
}
```

### 3. Input Component

Create `src/components/Input.jsx`:

```jsx
export default function Input({
  label,
  error,
  type = 'text',
  placeholder,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className={`input-base ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
```

### 4. Badge Component

Create `src/components/Badge.jsx`:

```jsx
export default function Badge({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) {
  const variants = {
    gray: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
    primary: 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100',
    success: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
    warning: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
    error: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`${variants[variant]} ${sizes[size]} rounded-full font-medium inline-block ${className}`}
    >
      {children}
    </span>
  );
}
```

### 5. Alert Component

Create `src/components/Alert.jsx`:

```jsx
export default function Alert({
  children,
  type = 'info',
  onClose,
  className = '',
}) {
  const types = {
    info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    success: 'bg-green-50 border-l-4 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-100',
    warning: 'bg-amber-50 border-l-4 border-amber-500 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    error: 'bg-red-50 border-l-4 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  return (
    <div className={`p-4 rounded ${types[type]} ${className}`}>
      <div className="flex justify-between items-start">
        <div>{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-lg font-bold opacity-70 hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Dark Mode Support

### 1. Dark Mode Toggle Component

Create `src/components/DarkModeToggle.jsx`:

```jsx
import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved preference or system preference
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved ? saved === 'dark' : prefersDark;

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDark;
    setIsDark(newValue);

    if (newValue) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-yellow-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.293 1.707a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2 2.828a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
```

### 2. Update tailwind.config.js for Dark Mode

```javascript
darkMode: 'class',  // Add this in config
```

### 3. Using Dark Mode in Components

```jsx
// Example: Any component with dark mode support
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* Content */}
</div>
```

---

## Example Pages

### Login Page

Create `src/pages/LoginPage.jsx`:

```jsx
import { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Alert from '../components/Alert';
import Container from '../components/Container';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (!email.includes('@')) {
        setError('Please enter a valid email');
        return;
      }

      console.log('Login successful', { email, password });
      // Redirect or handle login
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <Container>
        <div className="max-w-md w-full">
          <Card title="Welcome Back" subtitle="Sign in to your account">
            {error && (
              <Alert type="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </span>
                </label>
                <a
                  href="#forgot"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <a
                  href="#signup"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                >
                  Sign up
                </a>
              </p>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
```

### Dashboard Layout

Create `src/pages/DashboardPage.jsx`:

```jsx
import { useState } from 'react';
import Container from '../components/Container';
import Grid from '../components/Grid';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import DarkModeToggle from '../components/DarkModeToggle';

export default function DashboardPage() {
  const [stats] = useState([
    { label: 'Total Users', value: '2,543', trend: '+12.5%' },
    { label: 'Revenue', value: '$45,230', trend: '+8.2%' },
    { label: 'Orders', value: '12,420', trend: '+23.1%' },
    { label: 'Conversion', value: '3.24%', trend: '-2.4%' },
  ]);

  const [tasks] = useState([
    { id: 1, title: 'Redesign homepage', status: 'In Progress', priority: 'high' },
    { id: 2, title: 'Fix auth bug', status: 'Completed', priority: 'medium' },
    { id: 3, title: 'Update docs', status: 'Todo', priority: 'low' },
  ]);

  const statusColors = {
    'In Progress': 'warning',
    'Completed': 'success',
    'Todo': 'gray',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <Container className="py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, Admin
              </p>
            </div>
            <DarkModeToggle />
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-10">
        {/* Stats Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Overview
          </h2>
          <Grid cols={4}>
            {stats.map((stat) => (
              <Card key={stat.label} hoverable>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {stat.trend}
                </p>
              </Card>
            ))}
          </Grid>
        </div>

        {/* Tasks Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Tasks
            </h2>
            <Button variant="primary" size="sm">
              View All
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {task.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={statusColors[task.status]}>
                          {task.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          variant={
                            task.priority === 'high'
                              ? 'error'
                              : task.priority === 'medium'
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {task.priority}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Action Cards */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <Grid cols={3}>
            <Card title="Create User" subtitle="Add a new team member">
              <Button variant="outline" className="w-full mt-4">
                Create
              </Button>
            </Card>
            <Card title="Generate Report" subtitle="Export analytics data">
              <Button variant="outline" className="w-full mt-4">
                Export
              </Button>
            </Card>
            <Card title="Settings" subtitle="Manage preferences">
              <Button variant="outline" className="w-full mt-4">
                Configure
              </Button>
            </Card>
          </Grid>
        </div>
      </Container>
    </div>
  );
}
```

### Update App.jsx

```jsx
import { useState } from 'react';
import DarkModeToggle from './components/DarkModeToggle';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {isLoggedIn ? (
        <DashboardPage />
      ) : (
        <LoginPage />
      )}
    </div>
  );
}
```

---

## Running Your Project

### Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## Project Structure Summary

```
frontend/
├── src/
│   ├── components/
│   │   ├── Alert.jsx
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Container.jsx
│   │   ├── DarkModeToggle.jsx
│   │   ├── Grid.jsx
│   │   └── Input.jsx
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   └── LoginPage.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

---

## Key Takeaways

### Tailwind Best Practices
- ✅ Use `@layer` to organize custom styles
- ✅ Extract reusable component classes to avoid duplication
- ✅ Use CSS variables for dynamic theming
- ✅ Embrace mobile-first responsive design with `sm:`, `md:`, `lg:` prefixes
- ✅ Leverage dark mode with `dark:` prefix

### Component Design
- ✅ Make components flexible with `variant` and `size` props
- ✅ Always provide `className` prop for additional customization
- ✅ Use `...props` to forward remaining attributes
- ✅ Provide sensible defaults

### Dark Mode
- ✅ Use localStorage to persist user preference
- ✅ Respect system preference as fallback
- ✅ Apply dark mode to every interactive element
- ✅ Test both light and dark modes thoroughly

### Performance
- ✅ Tailwind handles CSS optimization via PurgeCSS
- ✅ No unused CSS in production builds
- ✅ Minimal CSS output when properly configured

---

## Useful Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/) - Unstyled components
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) - VS Code extension
- [Tailwind CSS Plugins](https://tailwindcss.com/docs/plugins)
