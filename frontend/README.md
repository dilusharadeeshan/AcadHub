# AcadHub frontend

React, Vite, React Router and a shared responsive stylesheet. Use the repository-root [README](../README.md) for complete setup, test accounts, environment variables and deployment.

```sh
npm ci
npm run dev
npm run build
npm test
npm run lint
```

The frontend expects the API at `/api`. Vite proxies development requests to port 5000. Production should use the Express-hosted build or a same-origin API rewrite.
