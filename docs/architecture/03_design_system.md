# UI/UX Design System Specification

## 1. Design Direction
**Vibe**: Premium, calm, focused, minimal, and modern. Mobile-first but responsive.
**Avoid**: Generic admin dashboards, excessive gradients, overused glassmorphism, heavy animations, visual clutter.

## 2. Theme Tokens (Semantic)

### Light Theme
- **Background**: `#F8FAFC` (Slate 50) - Base app background
- **Surface**: `#FFFFFF` (White) - Cards, modals, elevated areas
- **Primary**: `#111827` (Gray 900) - Primary text, primary buttons, high-emphasis icons
- **Secondary**: `#64748B` (Slate 500) - Secondary text, muted icons, secondary borders
- **Border**: `#E2E8F0` (Slate 200) - Dividers, subtle input borders

### Dark Theme
- **Background**: `#0B0F14` - Deep, calm dark base (non-pure black)
- **Surface**: `#111827` - Base elevated surface
- **Elevated Surface**: `#18212F` - Modals, popovers, dropdowns
- **Primary Text**: `#F8FAFC` - High-emphasis text
- **Secondary Text**: `#94A3B8` - Muted text

## 3. Typography
**Primary Font**: Inter (or Plus Jakarta Sans)

**Scale (Tailwind mappings)**:
- **Display**: `text-4xl font-bold tracking-tight`
- **Page Title**: `text-2xl font-semibold`
- **Section Title**: `text-lg font-medium`
- **Body**: `text-base font-normal leading-relaxed`
- **Caption**: `text-sm font-medium text-secondary`
- **Button**: `text-sm font-medium`
- **Input**: `text-base` (Prevents iOS zoom on focus)

## 4. Motion & Animation
- **Duration**: Subtle (150ms - 250ms).
- **Easing**: Ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Usage**:
  - State changes (e.g., hover states on buttons).
  - Task completion (satisfying but quick strikethrough/fade).
  - Navigation transitions.
  - Focus countdown updates.
  - Confirmation feedback (toast sliding in).
- **Strict Rule**: No decorative animations. Motion must communicate functionality.
