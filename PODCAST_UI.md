# Podcast UI Components

This document describes the enhanced UI components for the podcast feature, designed with shadcn-inspired aesthetics.

## Card Component

The main container for content sections with a clean, elevated appearance:

```html
<div class="card">
  <h2 class="text-2xl font-bold mb-6">Section Title</h2>
  <div class="space-y-6">
    <!-- Content -->
  </div>
</div>
```

## Button Component

Multiple button variants for different actions:

```html
<!-- Primary Button -->
<button class="btn btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Secondary Action</button>

<!-- Outline Button -->
<button class="btn btn-outline">Outline Button</button>

<!-- Destructive Button -->
<button class="btn btn-destructive">Delete</button>
```

## Form Components

Styled input and select elements:

```html
<!-- Input Field -->
<input type="text" class="form-input" placeholder="Enter text">

<!-- Select Dropdown -->
<select class="form-select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

## Layout

The UI uses a responsive grid layout:

```html
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div class="lg:col-span-2">
    <!-- Main content area -->
  </div>
  <div>
    <!-- Sidebar content -->
  </div>
</div>
```

## Color Scheme

The UI uses the existing shadcn-inspired color variables:

- `--primary`: Main brand color
- `--secondary`: Supporting color
- `--muted`: Subtle backgrounds and text
- `--destructive`: Error and delete actions
- `--border`: Element borders
- `--background`: Page background

## Responsive Design

The UI adapts to different screen sizes:
- Mobile: Single column layout
- Desktop: Multi-column layout with sidebar