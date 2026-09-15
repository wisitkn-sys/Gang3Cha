# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a small static web dashboard:

- `index.html` contains the Thai-language DTRS dashboard markup, accessibility labels, controls, and page structure.
- `styles.css`, `app.js`, and `data.js` provide the styling, interaction logic, and initial dataset at the repository root.
- No source, test, asset, or generated-output directories exist yet. Keep future images and other static assets in `assets/` and tests in `tests/` unless the project adopts a different build layout.

## Build, Test, and Development Commands

There is no package manager, build script, or test runner configured. For local preview, serve the repository root with any static HTTP server, for example:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`. A local server is preferred to opening the file directly because the page is designed to load separate CSS and JavaScript resources.

## Coding Style & Naming Conventions

Use two-space indentation for HTML, CSS, and JavaScript, semantic HTML elements, and accessible labels for interactive controls. Follow the existing kebab-case convention for CSS classes and DOM IDs (for example, `.system-grid` and `#refresh-button`). Keep user-facing dashboard text in Thai unless a technical product name or established status label is required. If tooling is added, prefer standard formatters and linters and document their commands here.

## Testing Guidelines

No automated tests or coverage requirements are configured. Before submitting UI changes, manually verify the dashboard in a current browser at desktop and narrow viewport sizes, including navigation buttons, filters, dialog behavior, printing, and keyboard focus. When tests are introduced, place them under `tests/` and use descriptive names such as `dashboard-filters.test.js`.

## Commit & Pull Request Guidelines

Git history is not available in this checkout, so no repository-specific commit convention can be inferred. Use short, imperative messages such as `Add station status filtering`. Pull requests should explain the user-visible change, identify affected files, include verification steps, and attach screenshots or a short recording for visual changes. Link the related issue when one exists.

## Security & Configuration Tips

Do not commit credentials, private operational data, or real incident details. Keep dashboard sample data clearly synthetic unless a secure data source and configuration strategy are added.
