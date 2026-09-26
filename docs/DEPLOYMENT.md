# Deployment guide

The application is prepared for deployment; this development session does not provision or publish infrastructure. Configure the actual university domain, database, private file bucket and scanner before launch.

## Recommended: one HTTPS origin

The root Dockerfile builds React and serves it with the Express API. This keeps browser cookies and downloads on the same origin and avoids third-party-cookie restrictions. A reverse proxy or hosting platform must terminate TLS and forward the original protocol accurately.

1. Create an Atlas cluster, application database user, and network access rules limited to your backend infrastructure. Copy the driver URI into the backend secret manager. Transactions require a replica set, which Atlas provides. See [Atlas access-list documentation](https://www.mongodb.com/docs/atlas/security/ip-access-list/).
2. Create a private S3 bucket. Enable Block Public Access and bucket-owner-enforced object ownership. The application identity needs only PutObject, GetObject and DeleteObject on that bucket’s object path. It requests SSE-S3 encryption; do not grant public ACL permissions. Prefer short-lived workload credentials. See [Amazon S3 security guidance](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html).
3. Provision ClamAV on a private network reachable by the backend. Use `deploy/clamav.Dockerfile` or your managed daemon. Allocate at least 4 GiB RAM, persist signatures at `/var/lib/clamav`, allow signature updates and permit port 3310 only from application services. Set StreamMaxLength and scan limits above MAX_FILE_MB. Do not expose the unauthenticated daemon on the internet. See [official ClamAV container guidance](https://docs.clamav.net/manual/Installing/Docker.html).
4. Deploy the root Dockerfile as a web service. Configure the required environment variables below. The supplied `render.yaml` describes the web service; configure the private scanner separately. Render instructions are available in the [Express deployment guide](https://render.com/docs/deploy-node-express-app).
5. Before opening registration, run `npm run indexes` and `npm run seed` from `/app/backend` in a one-off job using the same deployment environment. Set ADMIN_EMAIL/ADMIN_PASSWORD for that job; remove ADMIN_PASSWORD afterward.
6. Configure your HTTPS domain, redirect HTTP at the edge, and verify `GET /api/health`. Trust only the actual proxy hop count. The application rejects non-HTTPS traffic in production except the internal health endpoint.

Required production environment:

```dotenv
NODE_ENV=production
PORT=5000
TRUST_PROXY=1
CLIENT_ORIGIN=https://acadhub.your-university.example
MONGODB_URI=<Atlas URI from secret manager>
JWT_SECRET=<unique random 48-byte secret>
STORAGE_DRIVER=s3
S3_BUCKET=<private bucket>
S3_REGION=<bucket region>
CLAMAV_HOST=<private scanner hostname>
CLAMAV_PORT=3310
MAX_FILE_MB=10
```

Supply AWS workload credentials or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY in the backend secret manager. Use S3_ENDPOINT only for an S3-compatible provider tested with the application. AWS S3 is the default target; the local S3 contract test does not certify every compatible provider.

The Node process runs as the non-root `node` user in the container. No environment files or development uploads are copied into the image. It refuses startup when critical configuration is absent, starts serving only after MongoDB connects, and closes connections on shutdown. Root Docker health checks use the configured PORT.

For a generic container host:

```sh
docker build -t acadhub .
docker run --env-file /secure/path/acadhub.production.env -p 127.0.0.1:5000:5000 acadhub
```

Put the container behind your TLS reverse proxy; bind public traffic only at that proxy. Pin validated image digests and keep runtime security patches current for reproducible releases. The local Compose file is development-only and deliberately has no public database listener.

## Separate frontend on Vercel

Build the frontend as a Vite project with `frontend` as its root, `npm run build` as the build command, and `dist` as the output directory. Keep `VITE_API_URL=/api`.

Copy `deploy/vercel.example.json` to `frontend/vercel.json`, replace YOUR-API with the deployed backend hostname, and configure the frontend hostname in backend CLIENT_ORIGIN. The API rewrite comes before the SPA fallback. Verify Set-Cookie and multipart uploads through the proxy, including your host’s request-size and timeout limits. Lower MAX_FILE_MB if the hosting tier has a smaller request-body limit.

The browser must use the frontend’s `/api` route so host-bound cookies remain same-origin. Do not point VITE_API_URL directly at an unrelated service domain: that would conflict with SameSite=Lax and the application’s cross-site write policy. Same-site custom subdomains can also work with explicit CORS, but a single origin is simpler to verify. [Vercel documents external rewrites here](https://vercel.com/docs/routing/rewrites).

The example includes response security headers. A Vite build is static output, not a production Node process; Express or the hosting edge must provide routing fallbacks. See [Vite deployment documentation](https://vite.dev/guide/static-deploy.html).

## Database rollout and existing users

Back up the existing database before rollout. The application preserves the students collection and existing bcrypt hashes. Existing accounts without role/status fields are treated as active students by Mongoose defaults. New accounts are pending. Old JWTs are deliberately invalidated because sessions now require a server-side record.

If working with a large existing students collection, normalize legacy email casing and check for duplicates before changing indexes. This project had no pre-existing material/discussion collections, so the new unique file/report indexes introduce no intended data migration. Index creation fails visibly if real data violates a constraint; resolve the conflict instead of dropping records.

Set auto-indexing off in production (the server does this) and execute the explicit index command as a release step. MongoDB-backed rate limits and sessions work across replicas. Multiple application instances must share the same JWT secret, MongoDB database and S3 bucket.

## Launch verification

- The real HTTPS origin loads the app and all deep links after refresh.
- Cookies show Secure, HttpOnly, SameSite=Lax, Path=/ and host-only names.
- A new account remains pending until an administrator approves it.
- Another moderator approves a test upload; a peer can download it; an unauthenticated browser cannot.
- Scan a safe test file and an antivirus test signature in a staging environment; unavailable scanning must reject uploads.
- Verify real S3 upload/read/delete permissions, private bucket access and eventual deletion-job completion.
- Confirm CSRF, disallowed-origin, suspended-account and ownership rejection.
- Run unit/integration/browser tests in CI; monitor health, errors, rate limits and storage cleanup.
- Have the institution approve content/privacy/retention rules and conduct the proposal’s student pilot.

Local tests verify the application and protocols. Real Atlas/S3/ClamAV credentials, TLS/domain configuration, container execution on the target host, backup restoration, load testing on the selected tier, and stakeholder pilot feedback must be verified in staging before public rollout.
