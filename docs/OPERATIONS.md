# Operating AcadHub

## Account and content review

Administrators activate accounts in Moderation → Members after checking batch membership. Moderator privileges are assigned only by administrators. Moderators can suspend students; administrators restore access or change roles. A user cannot alter their own access. Each change records a reason and revokes the affected account’s sessions.

Use Resource reviews to open the actual material and file before approving. Check subject, copyright permission, privacy, accuracy and duplication. Rejection should explain the corrections needed. Authors can edit and resubmit. A reviewer cannot approve their own upload.

For reports, inspect the linked content, remove it if necessary, and record a clear resolution. Dismissal also requires a reason. Removed targets remain represented in reports and audit history for accountability. Account email corrections, exports or deletion requests require an authorized database operator following the institution’s privacy policy; they are not public API operations.

## Password recovery

The release uses administrative recovery, not an unauthenticated reset endpoint. Verify identity through the institution’s existing process. In a trusted backend environment, set ADMIN_EMAIL to an active administrator, ACCOUNT_EMAIL to the account, and ACCOUNT_NEW_PASSWORD to a strong temporary passphrase. Run:

```sh
npm run user:password --prefix backend
```

The command hashes the replacement, revokes all sessions and records an audit action. Deliver the passphrase through a secure institutional channel and ask the user to change it immediately. Remove the temporary environment variable afterward. Never place passwords directly in shell command history, logs, tickets or source files.

## Monitoring and response

- Monitor /api/health. A disconnected database returns 503; the server logs only safe error types and request IDs.
- Correlate client requestId values with structured API error logs. Do not log request cookies, authorization headers, passwords or connection strings.
- Monitor database latency, indexes, disk space and Atlas alerts, plus API response times and 4xx/5xx rates.
- Review open reports, pending uploads, pending members and suspicious authentication rates.
- Watch the fileremovals collection. Deletion jobs retry every minute, 25 per pass. Repeated attempts indicate missing bucket permissions or unavailable storage. Removing a database resource denies future downloads immediately; its private object may remain until cleanup succeeds.
- Check ClamAV signature freshness and memory. Scanner failures reject uploads rather than accepting unscanned files.
- Track material file sizes and storage cost through moderation statistics and your bucket metrics. Downloads stream from storage rather than exposing object URLs.

## Retention and backups

Approve a retention policy with the university before launch. Sessions and rate-limit records expire automatically via TTL indexes. Academic contributions remain until their author or a moderator removes them. Reports and audit records are retained for review. Do not silently prune academic or moderation data.

Use managed MongoDB backups, private bucket versioning with an appropriate noncurrent-version retention period, and periodic restore drills. Restoring metadata without the corresponding private objects can leave files unavailable. Store backups encrypted with limited operator access.

A storage reconciliation job may compare object keys to material.file.key and fileremovals.key before cleaning true orphans from interrupted uploads; review the proposed deletion set first. Do not apply a blanket age-based bucket deletion policy to active course material.

## Routine maintenance

Run npm audits and test changes before upgrading dependencies. Use Node.js 24 LTS. Refresh container images and scanner definitions. Rotate deployment secrets through the hosting secret manager; rotating JWT_SECRET intentionally signs out all users.

Keep TRUST_PROXY aligned with the real proxy topology. Do not use blanket trust for arbitrary forwarded headers. Rate limits are per IP and stored in MongoDB; tune them deliberately for shared university networks.

Scaling starts with indexes, monitoring and measured load tests. Resource and discussion lists are paginated, route modules load lazily, and files live in external storage. Literal substring search is appropriate for the initial batch-sized release; if the database becomes large, evaluate Atlas Search with equivalent authorization and filtering semantics.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Startup fails | Required variables, 32+ character non-placeholder secret, Atlas access rules, production storage/scanner configuration |
| Transaction errors | Use Atlas or a MongoDB replica set; standalone MongoDB is unsupported |
| Sign-in succeeds but session disappears | Same-origin /api proxy, HTTPS, exact CLIENT_ORIGIN, cookie settings, browser domain |
| Security check expired | Refresh; ensure cookies and X-CSRF-Token survive your proxy |
| Upload is rejected | File extension/content match, UTF-8 encoding, byte limit, category/link selection, duplicate hash, scanner health |
| File unavailable | S3 key permissions, object presence and storage availability; inspect safe request ID |
| Resource vanishes after edit | It returned to pending moderation as designed |
| API returns 429 | Wait for the window; inspect legitimate shared-IP traffic and configured proxy trust |
| API returns HTML | /api proxy must precede the SPA catch-all |
| Preview port in use | Stop the existing disposable preview or use it intentionally; do not connect tests to production |

See REQUIREMENTS.md for the release verification record and DEPLOYMENT.md for target-host prerequisites.
