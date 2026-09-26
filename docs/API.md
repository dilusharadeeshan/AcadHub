# REST API

Base path: `/api`. JSON request/response bodies, except multipart uploads and streamed files. Error responses contain `message`, optional `errors` keyed by field, and a safe `requestId`. Paginated lists return `{items, pagination:{page,limit,total,pages}}`; detail responses return `{item}`.

## Authentication

1. GET `/auth/csrf` with credentials included. Keep the returned `csrfToken` in memory.
2. Send that value as `X-CSRF-Token` on POST/PATCH/PUT/DELETE requests, including login, registration and logout. Include cookies on every request.
3. Production uses host-bound Secure HTTP-only cookies over HTTPS. Browser sessions use a 1-day JWT lifetime; selecting remember extends the lifetime and cookie to 7 days.
4. Protected content requires an active account. Pending accounts may only read/update their own profile and change passwords or sign out.

| Method | Endpoint | Access / behavior |
| --- | --- | --- |
| GET | /health | Database readiness; no sensitive configuration |
| GET | /auth/csrf | Establish CSRF cookie and token |
| POST | /auth/register | name, email, password, department, batch, semester, agreeToPolicy=true; creates pending student |
| POST | /auth/login | email, password, optional remember boolean |
| POST | /auth/logout | Revoke current session, clear cookie |
| GET | /auth/profile | Current authenticated user, including own email |
| PATCH | /auth/profile | Full editable profile: name, department, batch, semester, bio |
| PUT | /auth/password | currentPassword, password; revokes all sessions |

## Academic resources

| Method | Endpoint | Access / behavior |
| --- | --- | --- |
| GET | /meta | Categories, allowed extensions, upload byte limit |
| GET | /dashboard | Counts, recent approved resources and recent questions |
| GET | /subjects | Subject directory |
| POST | /subjects | Staff; name, code, department, semester, description |
| PATCH | /subjects/:id | Staff; full subject fields |
| DELETE | /subjects/:id | Admin; refuses deletion while referenced |
| GET | /materials | Approved library; owners can use mine=true; staff can select pending/rejected |
| POST | /materials | Multipart fields + file, or fields + HTTPS link; creates pending material |
| GET | /materials/:id | Approved content or owner/staff access to pending/rejected content |
| PATCH | /materials/:id | Owner only; full metadata; returns material to pending review |
| DELETE | /materials/:id | Owner/staff; removes related comments/votes and queues file cleanup |
| GET | /materials/:id/file | Authorized attachment; increments download count after streaming |
| GET | /materials/:id/file?view=true | Authorized inline preview; no count increment |
| POST | /materials/:id/open | Return academic link and increment access count |
| PUT | /materials/:id/vote | useful boolean; idempotent and reversible; no self-voting |

Material fields: `title` (4–160), `description` (10–5000), `subject` (ObjectId), `category`, `semester` (1–12), `academicYear` (2026 or 2026/2027), and `link` (empty for files). Exactly one file or link is required. Links use the Academic links category; files use another category. File edits preserve the original file; upload a new resource to replace it.

Filters: `search`, `subject`, `category`, `semester`, `academicYear`, `mine=true`, `status`. Sorts: `newest`, `downloads`, `useful`. Pagination: `page` starts at 1, `limit` defaults to 12 and is capped at 48. Search matches literal substrings in title/description and matching subject names/codes.

## Discussions and reporting

| Method | Endpoint | Access / behavior |
| --- | --- | --- |
| GET / POST | /materials/:id/comments | Paginated comments; POST body; comments require approved material |
| PATCH / DELETE | /comments/:id | Owner edits; owner/staff deletes |
| GET / POST | /questions | Paginated search / create question |
| GET / PATCH / DELETE | /questions/:id | Read; owner edits; owner/staff deletes with answers/votes |
| GET / POST | /questions/:id/answers | Paginated answers ordered by useful votes / add body |
| PATCH / DELETE | /answers/:id | Owner edits; owner/staff deletes; clears accepted reference |
| PUT | /answers/:id/vote | useful boolean; no self-vote |
| PUT | /questions/:id/accepted-answer | Question owner; answerId or null; validates parent question |
| POST | /reports | targetType, targetId, reason, details; one open report per user/target |

Question fields: `title` (8–180), `body` (15–10000), `subject`, `tags` (up to 5 strings, 2–30 chars each). Comments/answers use `body` (2–5000). Questions support `search`, `subject`, `mine=true`, `status=solved|unanswered`, and pagination.

Report target types: material, comment, question, answer. Reasons: Inaccurate, Copyright, Inappropriate, Duplicate, Spam, Other. Details must contain 10–2000 characters. Reporters must be able to access the content.

## Moderation

| Method | Endpoint | Access / behavior |
| --- | --- | --- |
| GET | /admin/stats | Staff; pending resources, reports, users, storage and downloads |
| PATCH | /admin/materials/:id | Staff, excluding uploader; status approved/rejected, reason, optional expectedUpdatedAt |
| GET | /admin/users | Staff; search, role/status filters, pagination |
| PATCH | /admin/users/:id | Admin changes role/status; moderator can only suspend students; reason required |
| GET | /admin/reports | Staff; status and pagination; includes link to reported content |
| PATCH | /admin/reports/:id | Staff; resolved/dismissed status and resolution |
| GET | /admin/audit | Admin only; paginated actions with actor, target and details |

A rejected resource needs a reason. The UI submits `expectedUpdatedAt` to prevent applying a review to content edited since it was opened. Staff cannot change their own access. Administrative changes serialize through a database guard so concurrent changes cannot remove the last active administrator.

Role: student, moderator, admin. Account status: pending, active, suspended. Access changes revoke that user’s existing sessions. Report resolution records a decision; staff inspect and remove offending content separately before resolving it.

## Rate limits and validation

MongoDB-backed windows apply across API processes: 600 API requests per 15 minutes per IP; 20 authentication attempts per 15 minutes; 15 uploads per hour; 100 contribution writes per 15 minutes. Configure proxy trust correctly so limits use the client IP. A shared campus connection may need a deliberately reviewed limit adjustment.

Unknown fields, MongoDB operators, invalid IDs, malformed JSON, disallowed origins, excessive nesting, oversized bodies and invalid files are rejected. Common responses: 400 validation, 401 session required, 403 permission/CSRF, 404 absent/private content, 409 conflict, 413 oversized upload, 429 rate limit, 503 database/storage/scanner unavailable.
