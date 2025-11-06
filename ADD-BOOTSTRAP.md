# Add Bootstrap 5 to Svelte Template

## Objective
Add Bootstrap 5 as the CSS framework to this SvelteKit + Cloudflare Workers template while maintaining the "zero build complexity" philosophy and vanilla CSS for custom styling.

## Why Bootstrap 5?
- **Component library**: Modals, dropdowns, navbars, forms work out of the box
- **Junior-friendly**: Clear documentation, familiar to most developers
- **No jQuery**: Pure JavaScript since v5
- **Accessibility built-in**: ARIA attributes, keyboard navigation included
- **Responsive grid**: Simple and intuitive for layout
- **Utility classes**: Bootstrap 5 includes Tailwind-like utilities (mb-3, d-flex, etc.)
- **Company-wide consistency**: Every app using this template will have the same baseline

## Implementation Steps

### 1. Install Bootstrap
```bash
npm install bootstrap@5
```

### 2. Create Bootstrap Import File
Create `src/lib/styles/bootstrap.css` with the following content:

```css
/* Import Bootstrap core */
@import 'bootstrap/dist/css/bootstrap.min.css';

/* Company-specific Bootstrap customizations */
:root {
  /* Override Bootstrap's primary color with company brand color (example) */
  --bs-primary: #0066cc;
  --bs-primary-rgb: 0, 102, 204;
  
  /* Add other brand color overrides as needed */
  /* --bs-secondary: #6c757d; */
  /* --bs-success: #198754; */
  /* --bs-danger: #dc3545; */
}

/* Add any global Bootstrap component overrides here */
/* Example: Customize all cards to have subtle shadows */
.card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Example: Customize button hover states */
.btn {
  transition: all 0.2s ease-in-out;
}
```

### 3. Create Custom Styles File
Create `src/lib/styles/custom.css` for company-specific vanilla CSS:

```css
/* Custom company styles that complement Bootstrap */
/* Use this file for styles that don't fit Bootstrap's patterns */

/* Example: Custom utility classes */
.company-gradient {
  background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%);
}

.company-shadow {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

/* Example: Custom component styles */
.company-header {
  border-bottom: 3px solid var(--bs-primary);
  padding: 1rem 0;
}

/* Add your custom styles below */
```

### 4. Update Root Layout
Update `src/routes/+layout.svelte` to import Bootstrap and custom styles:

```svelte
<script>
  // Import Bootstrap CSS
  import '$lib/styles/bootstrap.css';
  
  // Import custom company styles
  import '$lib/styles/custom.css';
  
  // Import Bootstrap's JavaScript for interactive components
  import { onMount } from 'svelte';
  
  onMount(async () => {
    // Dynamically import Bootstrap JS (tree-shakeable)
    // Only import what you need - uncomment as needed:
    
    // For dropdowns:
    // await import('bootstrap/js/dist/dropdown');
    
    // For modals:
    // await import('bootstrap/js/dist/modal');
    
    // For tooltips:
    // await import('bootstrap/js/dist/tooltip');
    
    // For popovers:
    // await import('bootstrap/js/dist/popover');
    
    // For collapse (accordions, navbar toggle):
    // await import('bootstrap/js/dist/collapse');
    
    // Or import everything (larger bundle):
    // await import('bootstrap');
  });
</script>

<slot />
```

### 5. Update Home Page with Bootstrap Example
Update `src/routes/+page.svelte` to demonstrate Bootstrap usage:

```svelte
<script>
  let count = 0;
</script>

<div class="container my-5">
  <!-- Hero Section -->
  <div class="row mb-5">
    <div class="col-12 text-center">
      <h1 class="display-4 fw-bold text-primary">Welcome to Your App</h1>
      <p class="lead text-muted">
        Built with SvelteKit, Cloudflare Workers, and Bootstrap 5
      </p>
    </div>
  </div>

  <!-- Demo Card -->
  <div class="row justify-content-center">
    <div class="col-md-6">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Interactive Counter</h5>
          <p class="card-text">Current count: <strong>{count}</strong></p>
          <div class="d-flex gap-2">
            <button 
              class="btn btn-primary" 
              on:click={() => count++}
            >
              Increment
            </button>
            <button 
              class="btn btn-secondary" 
              on:click={() => count = 0}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Features Grid -->
  <div class="row mt-5 g-4">
    <div class="col-md-4">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">🎨 Bootstrap 5</h5>
          <p class="card-text">
            Pre-built components and utilities for rapid development
          </p>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">⚡ SvelteKit</h5>
          <p class="card-text">
            Reactive framework with excellent developer experience
          </p>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">🌍 Cloudflare Workers</h5>
          <p class="card-text">
            Deploy globally with edge computing power
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom component-specific styles go here */
  /* These complement Bootstrap but are specific to this page */
</style>
```

### 6. Create Example Components
Create `src/lib/components/ExampleModal.svelte` to show Bootstrap modal usage:

```svelte
<script>
  export let modalId = 'exampleModal';
  export let title = 'Modal Title';
</script>

<!-- Bootstrap Modal -->
<div class="modal fade" id={modalId} tabindex="-1" aria-labelledby="{modalId}Label" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="{modalId}Label">{title}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
```

Create `src/lib/components/ExampleNavbar.svelte`:

```svelte
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
  <div class="container-fluid">
    <a class="navbar-brand" href="/">Your App</a>
    <button 
      class="navbar-toggler" 
      type="button" 
      data-bs-toggle="collapse" 
      data-bs-target="#navbarNav"
      aria-controls="navbarNav" 
      aria-expanded="false" 
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="/">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/about">About</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/api/hello">API</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
```

### 7. Update README.md
Add a Bootstrap section to the README:

```markdown
### CSS Framework

This template uses **Bootstrap 5** for:
- Pre-built components (modals, forms, cards, navbars)
- Responsive grid system
- Utility classes for rapid styling
- Accessibility features built-in

**Custom styling:**
- `src/lib/styles/bootstrap.css` - Bootstrap imports and theme customizations
- `src/lib/styles/custom.css` - Company-specific vanilla CSS
- Component-level `<style>` blocks - Component-specific styles

**Bootstrap Documentation:** https://getbootstrap.com/docs/5.3/

**Common Bootstrap Classes:**
- Layout: `container`, `row`, `col-*`, `d-flex`, `justify-content-*`
- Spacing: `m-*`, `p-*`, `mt-*`, `mb-*`, `mx-*`, `my-*` (0-5 scale)
- Typography: `text-center`, `text-primary`, `fw-bold`, `lead`
- Components: `btn`, `card`, `navbar`, `modal`, `alert`
```

### 8. Create Bootstrap Cheatsheet
Create `BOOTSTRAP-GUIDE.md` in the repo root:

```markdown
# Bootstrap 5 Quick Reference

## Layout & Grid

### Container
\`\`\`html
<div class="container">Fixed-width container</div>
<div class="container-fluid">Full-width container</div>
\`\`\`

### Grid System
\`\`\`html
<div class="row">
  <div class="col-md-6">Half width on medium+ screens</div>
  <div class="col-md-6">Half width on medium+ screens</div>
</div>
\`\`\`

Breakpoints: `sm` (576px), `md` (768px), `lg` (992px), `xl` (1200px), `xxl` (1400px)

## Spacing Utilities

Format: `{property}{sides}-{size}` or `{property}{sides}-{breakpoint}-{size}`

- **Properties:** `m` (margin), `p` (padding)
- **Sides:** `t` (top), `b` (bottom), `l` (left), `r` (right), `x` (left+right), `y` (top+bottom), blank (all)
- **Sizes:** `0`, `1` (.25rem), `2` (.5rem), `3` (1rem), `4` (1.5rem), `5` (3rem), `auto`

Examples:
- `mt-3` - margin-top: 1rem
- `px-4` - padding-left and padding-right: 1.5rem
- `mb-0` - margin-bottom: 0
- `my-5` - margin-top and margin-bottom: 3rem

## Common Components

### Buttons
\`\`\`html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-outline-primary">Outline</button>
<button class="btn btn-lg">Large</button>
<button class="btn btn-sm">Small</button>
\`\`\`

### Cards
\`\`\`html
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Card Title</h5>
    <p class="card-text">Card content goes here.</p>
    <a href="#" class="btn btn-primary">Button</a>
  </div>
</div>
\`\`\`

### Forms
\`\`\`html
<form>
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input type="email" class="form-control" id="email">
  </div>
  <div class="mb-3">
    <label for="password" class="form-label">Password</label>
    <input type="password" class="form-control" id="password">
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
\`\`\`

### Alerts
\`\`\`html
<div class="alert alert-success" role="alert">
  Success message!
</div>
<div class="alert alert-danger" role="alert">
  Error message!
</div>
\`\`\`

## Flexbox Utilities

\`\`\`html
<div class="d-flex justify-content-between align-items-center">
  <div>Left</div>
  <div>Right</div>
</div>
\`\`\`

- `d-flex` - display: flex
- `flex-row` / `flex-column` - direction
- `justify-content-start|center|end|between|around` - horizontal alignment
- `align-items-start|center|end` - vertical alignment
- `gap-1` through `gap-5` - spacing between flex items

## Text Utilities

\`\`\`html
<p class="text-center">Centered text</p>
<p class="text-primary">Primary color</p>
<p class="fw-bold">Bold text</p>
<p class="fst-italic">Italic text</p>
<p class="text-uppercase">Uppercase text</p>
\`\`\`

## Display Utilities

\`\`\`html
<div class="d-none">Hidden</div>
<div class="d-block">Block</div>
<div class="d-inline">Inline</div>
<div class="d-md-none">Hidden on medium+ screens</div>
\`\`\`

## Colors

**Text colors:** `text-primary`, `text-secondary`, `text-success`, `text-danger`, `text-warning`, `text-info`, `text-light`, `text-dark`, `text-muted`

**Background colors:** `bg-primary`, `bg-secondary`, `bg-success`, `bg-danger`, `bg-warning`, `bg-info`, `bg-light`, `bg-dark`

## Tips for Svelte + Bootstrap

### 1. Use Bootstrap classes directly in Svelte
\`\`\`svelte
<button class="btn btn-primary" on:click={handleClick}>
  Click me
</button>
\`\`\`

### 2. Dynamic classes with Svelte
\`\`\`svelte
<div class="alert" class:alert-success={success} class:alert-danger={!success}>
  {message}
</div>
\`\`\`

### 3. Import Bootstrap JS only when needed
\`\`\`svelte
<script>
  import { onMount } from 'svelte';
  
  onMount(async () => {
    // Only import modal functionality if you use modals
    await import('bootstrap/js/dist/modal');
  });
</script>
\`\`\`

### 4. Combine with custom CSS
\`\`\`svelte
<div class="card company-shadow">
  <!-- company-shadow is a custom class in custom.css -->
  <div class="card-body">
    <!-- Bootstrap handles the card structure -->
    <!-- Custom CSS adds your company styling -->
  </div>
</div>
\`\`\`

## Full Documentation

https://getbootstrap.com/docs/5.3/
```

## Testing Steps

After implementation, verify the following:

1. **Development server starts without errors:**
   ```bash
   npm run dev
   ```

2. **Bootstrap styles are loaded:**
   - Visit http://localhost:5173
   - Verify the page uses Bootstrap's default typography and spacing
   - Check that Bootstrap components render correctly

3. **Custom styles work:**
   - Verify company brand colors are applied
   - Check that custom utility classes work

4. **Build succeeds:**
   ```bash
   npm run build
   ```

5. **Bundle size is reasonable:**
   - Check that Bootstrap isn't adding excessive bloat
   - Should be ~20-30kb gzipped for Bootstrap CSS

6. **Interactive components work (if using Bootstrap JS):**
   - Test modals, dropdowns, or other JS-dependent components
   - Verify they work correctly with Svelte's reactivity

## Documentation Updates Needed

Update the following files to reflect Bootstrap integration:

1. ✅ `README.md` - Add CSS Framework section
2. ✅ `BOOTSTRAP-GUIDE.md` - Create quick reference guide
3. `CLAUDE.md` - Mention Bootstrap in the tech stack
4. Update any existing documentation that mentions "vanilla CSS only"

## Notes for Junior Developers

- **Start with Bootstrap classes first** - Use `btn`, `card`, `container`, etc.
- **Add custom CSS only when needed** - Don't fight Bootstrap, extend it
- **Check Bootstrap docs** - https://getbootstrap.com/docs/5.3/ has excellent examples
- **Use the inspector** - Browser dev tools show which Bootstrap classes are applied
- **Keep it simple** - Bootstrap handles 80% of styling needs

## Migration Strategy for Existing Apps

If you have existing apps using this template:

1. Install Bootstrap: `npm install bootstrap@5`
2. Create the styles folder structure
3. Import Bootstrap in your root layout
4. Gradually migrate components to use Bootstrap classes
5. Keep existing vanilla CSS until components are migrated
6. Test thoroughly before removing old CSS

## Success Criteria

- ✅ Bootstrap 5 installed and imported correctly
- ✅ Example components demonstrate Bootstrap usage
- ✅ Custom styles complement Bootstrap without conflicts
- ✅ Documentation updated with Bootstrap guidance
- ✅ Junior developers can easily find and use Bootstrap classes
- ✅ No build errors or warnings
- ✅ Consistent styling across all apps using this template
