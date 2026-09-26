# AcadHub UI theme

The UI follows the supplied dark AcadHub references, using the second reference's atmospheric gradient backdrop for authentication.

## Shared styling

- `frontend/src/index.css` defines the shared design tokens in its first `:root` block and styles the workspace, cards, tables, forms, dialogs, notices, and responsive navigation.
- `frontend/src/styles/auth.css` provides the centered authentication card and responsive gradient backdrop, using the same shared tokens.
- Keep new pages inside the shared Layout and reuse components from `frontend/src/components/UI.jsx`.
- Use CSS tokens instead of introducing an independent page palette or hard-coded light surfaces.

| Token | Purpose |
| --- | --- |
| `--canvas` | Deep navy page background |
| `--surface` / `--surface-raised` | Cards, dialogs, navigation, and inset surfaces |
| `--input` | Recessed dark form controls |
| `--text` / `--muted` | Primary and secondary text |
| `--primary` / `--accent-soft` | Lavender links, selected navigation, and tags |
| `--gradient` | Indigo-to-purple primary actions |
| `--border` / `--focus` | Subtle separators and visible keyboard focus |
| `--success` / `--warning` / `--danger` | Semantic state text, paired with corresponding `-bg` tokens |

Use rounded controls and cards, restrained glow, clear typographic hierarchy, and the graduation-cap identity. Preserve semantic green, amber, and red only for status feedback, with text labels/icons so color is not the only signal.

## Interaction and accessibility

Authentication retains email-based sign-in, approval-based registration, password visibility controls, and persistent-session choice. “Lost password?” reveals the existing administrator-assisted recovery process. The screenshot's registration-number example does not add a new identifier to the authentication API.

Keep strong text contrast, associated labels, visible focus, accessible dialogs, mobile navigation focus management, reduced-motion support, and responsive layouts. Mobile authentication inputs use 16px text to avoid iOS focus zoom.

Run `npm run build`, `npm run lint`, `npm test --prefix frontend`, and `npm run test:e2e` after significant UI changes. Browser tests cover the working flows, 390/768/1440px layouts, and WCAG A/AA checks. Visual inspection is still required alongside automated checks.
