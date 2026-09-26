# AcadHub implementation audit and plan

Source: sources/Project Proposal.pdf (15 pages, BatchMate proposal, 19 August 2026).

## Baseline audit
- Working foundation: Express 5, MongoDB/Mongoose Student collection, bcrypt registration, JWT HTTP-only login, logout cookie clearing, profile endpoint, React/Vite and Tailwind integration.
- Incomplete: registration validation, cookie security, database startup/error handling, authentication lifecycle, login form labels and feedback.
- Missing: registration UI, account approval, profile editing, roles, protected navigation, all academic resources and uploads, discovery, comments, questions/answers, voting, reports, moderation, subjects, audit logging, tests, seed data, deployment and operational documentation.
- Incorrect: hard-coded API URL/port/CORS and DNS overrides; profile query selects password unnecessarily; logout does not revoke stolen sessions; placeholder account links and remember checkbox; scaffold styling constrains responsiveness.
- Preserve: existing folder structure, Student model/collection, bcrypt hashes, auth endpoint names and user response shape. Existing users without a status remain active; new registrations require administrator approval. Legacy JWT sessions must log in again after upgrade.

## Decisions
- Keep the repository/product name AcadHub. The proposal calls the same application BatchMate.
- Implement the initial release and all its security, usability and moderation requirements. The explicitly future features (chat, messaging, notifications, faculty-specific roles, reputation, native mobile, multiple universities and university integrations) remain out of scope.
- Administrator approval satisfies the proposal's university-email verification OR approval requirement. Students can log in while pending to see their status and maintain their profile.
- Students, moderators and administrators are the access roles. Moderators review content and suspend student accounts; administrators approve accounts and assign privileges.
- Support PDF, PNG, JPEG and plain UTF-8 text files up to a configurable limit (10 MiB default), plus HTTPS academic links. Office documents can be exported to PDF. Validate content and extension; antivirus scanning and private S3 object storage are mandatory in production. Local storage is for development only.
- Plain-text discussions avoid HTML injection; accessible initials replace avatar uploads.
- Same-origin hosting is preferred for cookies. A separately hosted frontend must use a same-origin /api proxy or same-site custom domains with explicit CORS.

## Implementation sequence
1. Config, validation, schemas, authentication, account status and session revocation.
2. Subjects, material CRUD, upload/storage/scanning, discovery, comments and resource usefulness.
3. Question/answer CRUD, accepted answers, votes, reports, moderation and audit trail.
4. Responsive React application, reusable forms/states, role-aware routes and dashboards.
5. Database-backed API tests, important frontend tests, browser journey/responsive checks.
6. Environment examples, seed/migration commands, CI, containers, deployment/runbooks and final requirement matrix.

## Verification approach
Use a disposable real MongoDB process for integration tests, never the configured user database. Exercise authentication, ownership, approval, filters, uploads, comments, voting, reports and moderation. Verify production build and lint, inspect browser layouts at phone/tablet/desktop sizes and run the primary student-to-moderator workflow. Record actual results and any external deployment prerequisites without claiming unperformed verification.
