# AcadHub

A complete MERN academic resource and discussion platform, developed from the existing authentication code and the **BatchMate** project proposal.

Students share reviewed resources, discover material by subject/category/semester/year, comment, ask questions, post and vote on answers, and accept solutions. Moderators review uploads and reports. Administrators approve accounts and manage roles. The interface adapts to phones, tablets and desktops.

## Quick start

Use **Node.js 24 LTS**, npm, and MongoDB Atlas or a local MongoDB replica set. Multi-document transactions are required; standalone MongoDB is not supported.

From the repository root:

```sh
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm run setup
```

Setup generates a secret only when creating a new backend environment file. It preserves an existing `backend/.env`; compare that file with `backend/.env.example` and supply any missing settings. Never commit real environment files.

For a local database, install Docker Desktop/Engine and run:

```sh
docker compose up -d mongo
```

Set `MONGODB_URI=mongodb://127.0.0.1:27017/acadhub?replicaSet=rs0&directConnection=true` in `backend/.env`. Alternatively use your Atlas connection string. Set a unique random `JWT_SECRET` of at least 32 characters and both development origins:

```dotenv
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Set `ADMIN_EMAIL`, `ADMIN_NAME`, and a unique `ADMIN_PASSWORD` of at least 14 characters. Then:

```sh
npm run seed
npm run dev
```

Open **http://localhost:5173**. The API runs on port **5000**, with Vite proxying `/api`. Sign in using the administrator you configured. New student registrations are pending until an administrator activates them in **Moderation → Members**.

Remove `ADMIN_PASSWORD` from the runtime environment after bootstrap. Seeding is additive and does not reset existing accounts or replace their passwords.

## Sample data and test accounts

For development only, set `SEED_DEMO=true` and `DEMO_PASSWORD` to a unique passphrase of at least 10 characters, then run `npm run seed`. This adds six subjects, original learning files, questions, an accepted answer and a comment:

| Account | Role |
| --- | --- |
| student@acadhub.test | Student |
| peer@acadhub.test | Student |
| moderator@acadhub.test | Moderator |
| admin@acadhub.test | Administrator |

All use the `DEMO_PASSWORD` you choose. No live-system default password is shipped. Demo seeding is rejected in production; disable it after use.

A separate, disposable preview is available with `npm run preview:demo` after `npm run build`. It creates its own temporary MongoDB replica set and sample uploads, serves **http://127.0.0.1:5100**, and uses **Browser-test-passphrase-42** for the above test accounts. It ignores the application database and deletes its data on orderly shutdown. This preview is strictly local and ephemeral.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run setup` | Create missing local environment files |
| `npm run dev` | Run frontend and API together |
| `npm run dev --prefix frontend` | Frontend only |
| `npm run dev --prefix backend` | API only |
| `npm run build` | Build the React application |
| `npm start` | Serve API and built frontend from Express |
| `npm run seed` | Add subjects and configured initial/demo accounts |
| `npm run indexes --prefix backend` | Create indexes before production rollout |
| `npm test` | Backend integration/security and frontend regression tests |
| `npm run test:e2e` | Browser workflows, responsive checks and axe accessibility tests |
| `npm run lint` | Frontend lint and backend syntax checks |
| `npm run format` | Format source, tests and configuration |
| `npm run format:check` | Verify formatting |
| `npm run preview:demo` | Start the isolated local demonstration |

For browser testing install Chromium with `npx playwright install chromium`. If an installed Chrome is available, set `PLAYWRIGHT_CHANNEL=chrome` instead. In PowerShell: `$env:PLAYWRIGHT_CHANNEL='chrome'`. CI installs its own browser. First-time integration tests may download a MongoDB binary.

## Environment configuration

Full examples are in `backend/.env.example` and `frontend/.env.example`.

| Variable | Purpose |
| --- | --- |
| NODE_ENV | development, test, or production |
| PORT | API port; default 5000 |
| MONGODB_URI | MongoDB replica set / Atlas URI |
| JWT_SECRET | Unique random signing secret, 32+ characters |
| CLIENT_ORIGIN | Comma-separated exact trusted origins; HTTPS in production |
| TRUST_PROXY | Number of trusted reverse-proxy hops; normally 0 locally, 1 on Render |
| STORAGE_DRIVER | local for development, s3 in production |
| UPLOAD_DIR | Local private upload directory, default backend/var/uploads |
| MAX_FILE_MB | Upload limit, default 10 MiB, maximum 25 MiB |
| S3_BUCKET / S3_REGION | Private object storage bucket and region |
| S3_ENDPOINT | Optional S3-compatible HTTPS endpoint |
| AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY | S3 credentials, or use a workload role |
| CLAMAV_HOST / CLAMAV_PORT | Private antivirus daemon; port defaults to 3310 |
| ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD | Initial administrator seed |
| SEED_DEMO / DEMO_PASSWORD | Development-only sample data |
| VITE_API_URL | Keep `/api` with the same-origin deployment/proxy |

Production refuses to start without private S3 configuration and a configured antivirus host. The application uses HTTPS-only, HTTP-only, host-bound cookies in production; serve it behind a TLS-terminating proxy.

## Security and behavior

- Passwords use bcrypt at cost 12. JWT cookies reference revocable MongoDB sessions; passwords and storage keys are never returned by public serializers.
- Every private API request checks current account status and role. Logout, password changes and access changes revoke sessions.
- Writes require a random double-submit CSRF token, an approved origin when supplied, and compatible Fetch Metadata. The frontend obtains its token through `GET /api/auth/csrf`.
- Helmet, explicit credentialed CORS, bounded request bodies, strict Zod schemas, MongoDB operator rejection and shared MongoDB rate limits protect API requests.
- Files: PDF, PNG, JPEG and UTF-8 text; extension/content matching, size validation, duplicate detection and antivirus scanning. Office documents should be exported to PDF. Uploaded files stay private and are streamed through authorized endpoints.
- Students edit/delete only their own contributions. Staff may remove content; another moderator must review a moderator’s own uploads. Rejected resources include review notes; edits return resources to pending.
- Useful votes are idempotent and forbid self-voting. Question owners can accept only an answer belonging to that question.
- Resource/file deletion is recorded with a persistent cleanup job so storage failures can retry. Administrative actions are recorded with actor, target and reason.
- Display text is plain text, with no user HTML rendering. Initials replace avatar uploads.
- Email/password self-service recovery was not specified in the proposal. The broken recovery link was replaced with administrator guidance. Operators can use `npm run user:password --prefix backend` with `ADMIN_EMAIL`, `ACCOUNT_EMAIL`, and `ACCOUNT_NEW_PASSWORD` after verifying identity; this revokes sessions and records an audit entry.

## Project structure

```text
backend/src/
  config/         environment and cookie configuration
  controllers/    authentication, resources, discussions, administration
  middleware/     authentication, roles, CSRF, rate limiting, input protection
  models/         existing Student collection and related academic models
  routes/         REST API routing and validation
  services/       storage, scanning, voting, cleanup, seed data
  utils/          validated queries and safe errors
backend/tests/    disposable MongoDB integration/security tests
frontend/src/
  components/     navigation, forms, states, dialogs, discussion controls
  context/        session and notification providers
  hooks/          API fetching, authentication and responsive navigation
  pages/          student, account and moderation views
  lib/            API client and formatting
e2e/              browser workflows, layout and accessibility tests
docs/             audit, API reference, requirement checklist, deployment
```

## Existing implementation compatibility

The `Student` model and its `students` collection, bcrypt hashes, backend/frontend folders and existing auth routes are preserved. Accounts without a stored status remain active via the schema default; newly registered accounts explicitly receive pending status. Existing JWT sessions require a fresh login after upgrade. No user database was cleared or seeded during implementation verification.

The seed command backfills missing legacy profile, role and status fields without altering existing values. You can also run `npm run migrate --prefix backend` separately.

See [the initial audit](docs/IMPLEMENTATION.md), [REST API reference](docs/API.md), [deployment guide](docs/DEPLOYMENT.md), [operating guide](docs/OPERATIONS.md), and [requirement checklist](docs/REQUIREMENTS.md).
