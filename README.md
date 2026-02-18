# AZDES UI Toolbox

Multi-page React app for UI agent support tools (base period, payable estimates, call handling helpers, wrap-up guidance, and quick references).

## Local development

1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. Build for production:
   - `npm run build`
4. Preview production build:
   - `npm run preview`

## GitHub Pages hosting

This repo includes an automated workflow at [deploy-pages.yml](.github/workflows/deploy-pages.yml) that deploys the app to GitHub Pages on each push to `main`.

### One-time GitHub setup

1. Push this project to a GitHub repository.
2. In GitHub, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Ensure your default branch is `main` (or update workflow branch if different).

### Deployment flow

- Push to `main`.
- GitHub Action builds the app and publishes `dist` to Pages.
- Deployment URL appears in the workflow run summary.

## Notes

- App routing uses `HashRouter` to work reliably on static hosting.
- Vite base is set to `./` in [vite.config.js](vite.config.js) for portable Pages builds.
