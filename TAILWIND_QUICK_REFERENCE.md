# Tailwind CSS Quick Reference Guide

## Installation Commands

```bash
# Create new Vite project
npm create vite@latest frontend -- --template react

# Enter directory
cd frontend

# Install dependencies
npm install

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind config
npx tailwindcss init -p

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Essential Tailwind Classes

### Layout & Spacing
```html
<!-- Container -->
<div class="container mx-auto px-4"></div>

<!-- Padding & Margin -->
<div class="p-4 m-4">Padding & Margin</div>
<div class="px-4 py-2">Horizontal padding, vertical padding</div>

<!-- Flexbox -->
<div class="flex items-center justify-between">Flex Container</div>
<div class="flex gap-4">Flex with gap</div>

<!-- Grid -->
<div class="grid grid-cols-3 gap-6">Grid with 3 columns</div>
<div class="grid md:grid-cols-2 lg:grid-cols-4">Responsive grid</div>
```

### Typography
```html
<!-- Font Sizes -->
<h1 class="text-4xl">Heading 1</h1>
<h2 class="text-3xl">Heading 2</h2>
<h3 class="text-2xl">Heading 3</h3>
<p class="text-base">Paragraph</p>
<small class="text-sm">Small text</small>

<!-- Font Weights -->
<p class="font-light">Light (300)</p>
<p class="font-normal">Normal (400)</p>
<p class="font-semibold">Semibold (600)</p>
<p class="font-bold">Bold (700)</p>

<!-- Text Colors -->
<p class="text-gray-900 dark:text-white">Dark mode support</p>
<p class="text-primary-600">Primary color</p>
<p class="text-red-600">Danger color</p>
```

### Colors
```html
<!-- Background Colors -->
<div class="bg-white dark:bg-gray-900"></div>
<div class="bg-primary-600">Primary background</div>
<div class="bg-gray-100">Light gray background</div>

<!-- Text Colors -->
<p class="text-gray-900">Dark text</p>
<p class="text-gray-600">Medium text</p>
<p class="text-gray-400">Light text</p>

<!-- Border Colors -->
<div class="border-2 border-gray-300 dark:border-gray-700"></div>
```

### Borders & Shadows
```html
<!-- Borders -->
<div class="border border-gray-300">Simple border</div>
<div class="border-b-2 border-primary-600">Bottom border</div>
<div class="rounded-lg">Rounded corners</div>
<div class="rounded-full">Circle (for avatars)</div>

<!-- Shadows -->
<div class="shadow">Small shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg hover:shadow-xl">Hover effect</div>
```

### Responsive Design
```html
<!-- Mobile-first approach -->
<div class="col-span-1 md:col-span-2 lg:col-span-3">
  Responsive columns
</div>

<!-- Breakpoints -->
<!-- sm: 640px | md: 768px | lg: 1024px | xl: 1280px | 2xl: 1536px -->

<!-- Display -->
<div class="hidden md:block">Hidden on mobile, visible on tablet+</div>
<div class="block md:flex">Block on mobile, flex on tablet+</div>
```

### Common Patterns

#### Button
```html
<button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
  Click me
</button>
```

#### Card
```html
<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h3 class="text-lg font-bold mb-2">Card Title</h3>
  <p class="text-gray-600 dark:text-gray-400">Card content</p>
</div>
```

#### Input
```html
<input 
  type="text" 
  placeholder="Enter text..."
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
/>
```

#### Badge
```html
<span class="px-3 py-1 bg-primary-100 text-primary-900 rounded-full text-sm font-medium">
  Badge
</span>
```

#### Alert
```html
<div class="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800">
  <p>This is an alert message</p>
</div>
```

---

## Responsive Prefixes (Mobile-First)

```html
<!-- Prefix: sm: md: lg: xl: 2xl: -->

<!-- Example: Text size increases on larger screens -->
<p class="text-sm md:text-base lg:text-lg xl:text-xl">
  Responsive text
</p>

<!-- Example: Grid layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- 1 column on mobile, 2 on tablet, 4 on desktop -->
</div>
```

---

## Dark Mode

### Enable Dark Mode
In `tailwind.config.js`:
```javascript
darkMode: 'class'
```

### Use Dark Mode
```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  This element changes in dark mode
</div>
```

### Toggle Function
```javascript
// Add class to document
document.documentElement.classList.add('dark');

// Remove class
document.documentElement.classList.remove('dark');

// Check if dark mode is enabled
const isDark = document.documentElement.classList.contains('dark');
```

---

## Hover & State Variants

```html
<!-- Hover -->
<button class="bg-primary-600 hover:bg-primary-700">Hover</button>

<!-- Focus -->
<input class="focus:ring-2 focus:ring-primary-500" />

<!-- Active -->
<button class="active:scale-95">Click me</button>

<!-- Disabled -->
<button class="disabled:opacity-50 disabled:cursor-not-allowed">Disabled</button>

<!-- Group Hover -->
<div class="group hover:bg-gray-100">
  <p class="group-hover:text-primary-600">This changes on parent hover</p>
</div>
```

---

## Custom CSS with @layer

```css
@layer utilities {
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors;
  }
}

/* Then use: <button class="btn-primary">Click</button> */
```

---

## Tailwind Config Customization

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors
      colors: {
        primary: '#0284c7',
        secondary: '#64748b',
      },
      // Custom spacing
      spacing: {
        '128': '32rem',
      },
      // Custom border radius
      borderRadius: {
        'xl': '0.75rem',
      },
      // Custom fonts
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
```

---

## Performance Tips

1. **Purge CSS**: Tailwind automatically removes unused CSS in production
2. **Development**: Use `npm run dev` for hot-reload (larger file size is OK)
3. **Production**: Run `npm run build` for optimized CSS output
4. **Content Paths**: Ensure `content` in config.js includes all template files

---

## Component Library Integration

Popular Tailwind UI components:
- [Headless UI](https://headlessui.com/) - Unstyled, accessible components
- [Tailwind UI](https://tailwindui.com/) - Pre-built component templates
- [DaisyUI](https://daisyui.com/) - Component library for Tailwind
- [Shadcn/ui](https://ui.shadcn.com/) - Copy-paste component library

---

## Common Issues & Solutions

### Issue: Classes not applying
```javascript
// ❌ Wrong - dynamic class names not detected
<div class={`text-${size}-4`}></div>

// ✅ Correct - use explicit classes
<div class={size === 'lg' ? 'text-lg' : 'text-sm'}></div>
```

### Issue: Dark mode not working
```javascript
// Make sure tailwind.config.js has:
darkMode: 'class'

// And HTML element has 'dark' class:
document.documentElement.classList.add('dark')
```

### Issue: CSS not updating
```bash
# Restart dev server
npm run dev

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

---

## Useful VS Code Extensions

1. **Tailwind CSS IntelliSense** - bradlc.vscode-tailwindcss
2. **Tailwind CSS Highlight** - ellreka.tailwindcss-highlight
3. **PostCSS Language Support** - csstools.postcss

---

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind CSS IntelliSense](https://tailwindcss.com/docs/editor-setup)
- [Tailwind UI Components](https://tailwindui.com/)
- [Chroma Colors](https://chroma.js.org/) - Color scale generator
- [Tailwind CSS Twitter](https://twitter.com/tailwindcss)
