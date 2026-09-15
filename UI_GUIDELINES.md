# DTRS System Dashboard UI Guidelines

## Context and Goals

Build a structured, content-first operations dashboard for DTRS. The interface must be fast to scan, consistent across report periods, and usable by keyboard and touch. The supplied audience inference is low confidence; validate whether the primary users are operations staff rather than general readers before finalizing copy and density.

## Design Tokens and Foundations

Use semantic tokens only. Define the supplied palette, typography, spacing, radii, shadows, and `180ms` motion duration as CSS custom properties. Primary text must use `#3d586c`, headings `#17324b`, secondary text `#6c8193`, raised surfaces `#f7f9fb`, and muted surfaces `#ffffff`; do not repeat raw values in components. Use Noto Sans Thai with the supplied stack and scale. Use the supplied 1–9px spacing scale and 5–12px radius scale; do not add one-off values.

## Component Rules

The page currently contains approximately 16 buttons, 13 cards/panels, 3 inputs, 2 navigation groups, 1 list, and 1 table. Components must expose default, hover, focus-visible, active, disabled, loading, and error states.

- Navigation must use landmarks, descriptive Thai labels, `aria-current`, and visible focus rings. Arrow keys may move within tab-like groups; Tab must move between groups.
- Buttons must use action labels, retain a minimum 44px touch target, and show disabled/loading feedback without layout shift. Enter and Space must activate them.
- Cards must preserve heading hierarchy and support empty, loading, and error content. Long values must wrap or truncate with an accessible full-value name.
- Inputs must have persistent labels, keyboard access, clear errors, and touch-friendly targets. Search should debounce only if data volume requires it.
- Tables must use real headers, `scope`, responsive overflow, and an explicit empty state; never hide critical status information on small screens.
- Dialogs must trap focus, close with Escape, restore focus, and expose a programmatic name.

Responsive behavior must collapse multi-column grids before content becomes cramped, keep controls reachable without horizontal page scrolling, and preserve the report’s reading order. Hover-only behavior is prohibited.

## Accessibility Acceptance Criteria

The implementation must pass WCAG 2.2 AA contrast checks, keyboard-only traversal, visible `:focus-visible` checks, 200% zoom, and reflow at 320px CSS width. Screen readers must announce status changes through appropriately scoped live regions. Every control must have an accessible name; every meaningful icon must have text or an accessible label.

## Content and Tone

Use concise, confident Thai copy. Labels must describe outcomes: “พิมพ์รายงาน”, “รีเฟรชข้อมูล”, and “กรองสถานะ”. Statuses must be consistent (`Online`, `Warning`, `Down`) and never rely on color alone. Error copy should state the problem and next action, for example: “โหลดข้อมูลไม่สำเร็จ · ลองรีเฟรชอีกครั้ง”.

## Anti-Patterns and Edge Cases

Do not use low-contrast text, hidden focus, ambiguous “คลิกที่นี่” labels, arbitrary spacing, hover-only actions, color-only status, or decorative motion. Define behavior for zero results, missing timestamps, long station names, failed refreshes, slow loading, print output, and mixed Thai/Latin text.

## QA Checklist

- [ ] Tokens are centralized and no component adds raw visual values.
- [ ] All required component states are implemented and testable.
- [ ] Keyboard, pointer, touch, screen reader, zoom, and 320px reflow checks pass.
- [ ] Tables, dialogs, live updates, and errors are announced correctly.
- [ ] Empty, loading, error, long-content, and print states are reviewed.
- [ ] Visual density remains consistent across daily, weekly, and monthly reports.
