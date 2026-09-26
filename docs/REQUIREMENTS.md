# Proposal requirement and release checklist

Source: `sources/Project Proposal.pdf`, 15 pages, BatchMate proposal dated 19 August 2026. The document is treated as requirements and context, not as instructions to obtain stakeholder approval, publish infrastructure, or contact people.

## Functional scope

| Proposal requirement | Implementation | Verification |
| --- | --- | --- |
| Registration, login, logout (pp. 3, 8) | Existing Student collection and auth routes retained; registration screen, secure cookies and revocable sessions completed | API registration/auth/logout tests; browser registration and sign-in |
| Profile creation/editing, department/batch/semester (p. 3) | Required registration profile, editable profile and password change | API profile validation; frontend forms; browser profile navigation |
| Student/moderator/admin roles (pp. 3, 8–9) | Current user loaded on each protected request; role middleware and route guards | API ownership/role tests; browser denied moderation |
| University email verification OR administrator approval (p. 3) | Administrator approval selected; pending screen; member review with reasons | API activation/revocation; browser administrator approval |
| Homework, past papers, answers, notes, lab manuals, syllabi, references, academic links (pp. 3–4) | All eight categories, private supported documents and HTTPS links | Resource API, metadata validation and upload tests |
| Resource metadata (p. 4) | Title, description, subject, category, semester, academic year, uploader, timestamps, file type/size, downloads, review status | Model/API assertions and resource screens |
| Content-based upload validation and external storage (pp. 7, 9, 12) | PDF/PNG/JPEG/UTF-8 text, size/extension/content checks, SHA-256 duplicate prevention, ClamAV, private S3 adapter | Invalid/disguised/oversized file tests; scanner protocol/failure tests; S3 HTTP contract test |
| Browse/search/filter/sort (pp. 4, 8) | Title/description/subject-name/code search, category/semester/year filters, newest/downloads/useful sorts | Database-backed discovery tests and browser library |
| View/download approved files (pp. 6, 8) | Authorized streaming, inline preview and attachment download; pending content limited to owner/staff | Private-file API tests and browser file download |
| Resource owner edit/remove (p. 8) | Ownership checks; edits return to review; deletion cascades and durable file cleanup | API CRUD, re-review and deletion tests |
| Resource comments, edit/delete/report (pp. 4, 9) | Paginated discussions, owner editing, owner/staff deletion and report modal | API comment/report tests; browser posting |
| Ask questions with subjects/topics (pp. 5, 9) | Question CRUD, subjects, up to five tags, searchable question list | API and browser creation |
| Answers, useful votes and acceptance (pp. 5, 9) | Answer CRUD, idempotent votes, no self-voting, parent-checked acceptance and solved filter | API voting/acceptance/cascade tests; browser accepted answer |
| Review pending uploads, approve/reject/remove (pp. 5, 8) | Moderation workspace, review reasons, stale-review protection and no self-approval | API review tests; browser approval |
| Report materials/comments/questions/answers (pp. 2, 5, 9) | Target-specific access checks, duplicate open-report constraint, staff queue and resolutions | API and browser reporting |
| Delete inappropriate comments/answers (p. 5) | Staff removal with audit record and referential cleanup | API moderation and accepted-answer cleanup |
| Suspend users, assign/remove moderator role (pp. 5, 9) | Moderator student suspension; admin access management; reasons and session revocation | API role/suspension/self-protection tests |
| Administrator dashboard and action history (p. 9) | Statistics, members, reviews, reports and admin-only audit tab | API audit tests; browser administration |

## Non-functional scope

| Requirement | Implementation / evidence | Status |
| --- | --- | --- |
| Hashed passwords and HTTP-only auth cookies | bcrypt cost 12; no browser token storage; production Secure + host-bound cookies | Implemented and tested |
| HTTPS in production | Enforced in app except internal health; trusted proxy configuration; HSTS/Helmet | Configuration and HTTP rejection tests pass; target TLS must be provisioned |
| Backend authorization and ownership | Active status, current roles, owner/staff checks on every protected operation | API security tests pass |
| Input and upload safety | Strict Zod schemas, operator rejection, bounded bodies, MIME/content checks, scanner rejection | API and scanner tests pass |
| Rate limiting | Shared MongoDB windows for API/auth/upload/contribution writes | Atomic shared-store and HTTP 429 tests pass |
| Secret/privacy protection | Environment files ignored; safe serializers and errors; private storage references never returned | API assertions, code inspection, dependency audits |
| Fast common pages | Lazy page modules, small production assets, paginated reads, indexed filters/sorts, streaming files | Build and local browser journeys pass; production load targets require staging measurement |
| Images/avatars optimized | Initials and lightweight SVG/CSS art; no unbounded remote avatar requests | Visual/browser inspection |
| Database relationships and consistency | ObjectId references, unique indexes, transactions for related changes, accepted-answer cleanup, serialized admin changes | Integration and concurrency tests pass |
| Responsive phone/tablet/desktop UI | Responsive sidebar, forms, cards, grids and scrollable moderation tables | Browser checks at 390, 768 and 1440 px; screenshots inspected |
| Accessible forms and navigation | Labels, descriptions, focus outlines, skip link, dialog focus, keyboard-controlled mobile navigation, reduced motion | Core screens pass axe WCAG 2 A/AA and 2.1 AA checks; manual visual review |
| Loading/error/empty/success/denied feedback | Reusable states, field errors, confirmations, notifications, protected routes | Frontend regression and browser tests |
| Growth to more subjects/batches/departments | Subject directory and profile fields, indexed collections, shared sessions/rate limits, external storage | Implemented design; cross-university tenancy is future scope |
| Clean maintainable structure | Controllers/routes/models/services; reusable React components/hooks; shared styles; formatting/lint scripts | Lint, syntax and formatting checks |
| Setup, seed, tests and deployment | Environment examples, additive seed/migration, API/runbook docs, Docker/Compose/Render/Vercel examples, CI | Files supplied; real hosting not deployed in this session |
| Content/copyright/privacy governance (pp. 12–14) | Public community guidelines, consent, reporting/removal, moderation history, retention guidance | Implemented; institutional policy sign-off remains external |

## Deliberate implementation decisions

- **AcadHub** remains the repository/product name; BatchMate is the proposal’s name for the same application.
- Administrator approval is used instead of email verification. A changed account’s session is revoked; the pending screen redirects to sign in when approval changes access.
- Native fetch provides credentialed API requests; Vitest, Node’s test runner, Supertest and Playwright provide automated testing. These replace the proposal’s suggested Axios/Jest choices without changing functional requirements.
- Files support PDF, PNG, JPEG and UTF-8 text. Export office documents to PDF. Replacing a file is done by creating a new resource; metadata and link edits remain supported.
- Local uploads and optional scanner bypass are development-only. Production requires S3 and a configured scanner and refuses an insecure setup.
- Email recovery was not an initial proposal requirement. Administrative recovery is implemented as a trusted operator command with session revocation and auditing.
- Literal substring search matches the initial batch-sized scope. Full search-engine integration is explicitly future scope.
- Seeding/migration preserves existing users, passwords and content, and fills only absent legacy profile/role/status fields.

## Explicitly future features — not claimed as delivered

The proposal lists these for later versions (pp. 5–6, 8): notifications/email alerts, realtime chat, direct messages, distinct faculty roles, a native mobile application, reputation/badges, recommendations, advanced search, multi-university tenancy and university-system integration. Payments are also excluded by initial scope. The application does not create placeholder links for these features.

## Release verification record

- Backend: **29 passing tests** using a disposable real MongoDB replica set. Includes S3 protocol testing against a local HTTP fixture and ClamAV protocol testing against a local TCP fixture.
- Frontend: **12 passing tests**, including accessible form behavior, login/registration errors, disabled submission, CSRF requests and pagination.
- Browser: **5 passing tests**, covering the student/resource/discussion/approval journey, pending access, responsive layout, accessibility, administrator activation, subject CRUD, reports and audit history.
- Production frontend build passes with lazy-loaded routes; lint, backend syntax and formatting checks pass.
- Root, backend and frontend npm audits report **0 known vulnerabilities** at verification time.
- Browser verification uses installed Chrome because the bundled Chromium download encountered CDN connection failures.
- The configured local environment passes validation. Existing environment values and the user’s configured database were not modified during verification.
- No production database, bucket, scanner, hosting account or domain was provisioned. Docker execution and live-provider integration remain staging checks.

## External launch criteria

The proposal also asks for university/pilot approval, student testing, positive stakeholder feedback and a deployed beta (pp. 11–14). These are real-world acceptance activities. They cannot be truthfully replaced by synthetic tests.

Before public launch, complete the deployment guide’s real Atlas/S3/ClamAV/TLS smoke test, run load and restore tests on the selected infrastructure, establish an institution-approved retention/moderation policy, and collect pilot feedback. None of those external outcomes is marked complete here.
