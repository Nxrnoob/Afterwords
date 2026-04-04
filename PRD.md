⬡

**AFTERWORD**

*Product Requirements Document*

*A private time capsule with a dead man\'s switch*

Version 1.0 • March 2026 • FOSS / Self-hostable

5 Phases • MVP to Scale

**1. Executive Summary**

Afterword is a free, open-source, self-hostable private vault with a
dead man\'s switch. Users store encrypted notes, files, and credentials
--- addressed to specific people --- and configure a check-in schedule.
If they stop checking in, their vault is delivered automatically after a
grace period.

+-----------------------------------------------------------------------+
| **Core Promise**                                                      |
|                                                                       |
| Your private files and messages stay completely locked. They reach    |
| the right person only if you\'re truly gone --- automatically,        |
| securely, without any company holding your data.                      |
+-----------------------------------------------------------------------+

Afterword is not a legal will platform. It is a personal data relay ---
the digital equivalent of a sealed envelope kept with a trusted friend.
It does not require lawyers, notaries, or blockchain. It requires only
that you trust the encryption math, and optionally, yourself running the
server.

  ---------------------- ------------------------------------------------
  **Attribute**          **Value**

  Product name           Afterword

  License                AGPL-3.0 (fully open source)

  Hosting                Cloud-hosted (free tier) + Docker self-host

  Core mechanic          Dead man\'s switch --- check-in or vault
                         releases

  Target user            Any adult who has things that matter to specific
                         people

  Revenue model          None for base. Optional: hosted storage tiers
                         later.

  Platform               Web app (PWA) --- mobile-first
  ---------------------- ------------------------------------------------

**2. Problem Statement**

People accumulate digital lives --- accounts, files, passwords, personal
messages --- with no plan for what happens to them. When someone dies
unexpectedly or becomes incapacitated:

-   Families spend months trying to access accounts and files

-   Important credentials, documents, and instructions are lost forever

-   Personal messages that were meant to be shared never reach anyone

-   Business continuity collapses for freelancers and solopreneurs

Existing solutions fail normal people:

  ------------------ -------------------------- --------------------------
  **Solution**       **What it does**           **Why it fails**

  Google Inactive    Handles Google data only   Vendor lock-in, not
  Account Manager                               private, limited

  Bitwarden          Password sharing on death  Passwords only, no files,
  Emergency Access                              no messages

  Deadman.io /       Sends emails on timer      No vault, no encryption,
  similar                                       mostly dead projects

  Paper will +       Legal document             Not digital, families
  safety deposit                                still can\'t access
                                                accounts

  Telling a family   Human relay                Privacy loss, trust
  member                                        burden, no verification
  ------------------ -------------------------- --------------------------

+-----------------------------------------------------------------------+
| **The Gap**                                                           |
|                                                                       |
| No free, open-source tool combines: encrypted personal vault +        |
| automatic delivery + dead man\'s switch + self-hostable + actually    |
| pleasant to use.                                                      |
+-----------------------------------------------------------------------+

**3. Product Vision & Principles**

**3.1 Vision**

A world where anyone --- regardless of technical skill or wealth --- can
ensure their private files, messages, and important information reach
the right people at the right time, without trusting any corporation
with their most personal data.

**3.2 Design Principles**

-   **Everything encrypted. Server sees only ciphertext. Even we can\'t
    read your vault.** Privacy by default

-   **One tap. Under 3 seconds. Should feel like nothing.** Stupidly
    simple check-in

-   **Not \'prepare for death.\' Frame as \'organize what matters.\'**
    No morbid framing

-   **Export everything, anytime, in open formats. Self-host with one
    command.** Zero lock-in

-   **We are not a legal service. We store and deliver. That\'s it.**
    Honest scope

-   **A missed trigger is catastrophic. Reliability is feature #1.**
    Reliability over features

**4. Target Users**

Afterword is for any adult with a digital life. Primary personas:

**The Regular Person (Primary)**

Age 25--50. Has family, some savings, important accounts. Has never
thought about this but immediately gets it when explained. Needs the UX
to be as simple as a notes app.

**The Privacy-Conscious User**

Already uses Signal, Bitwarden, maybe runs Pi-hole. Will self-host.
Deeply cares that the server never sees plaintext. Will read the source
code. Will become an advocate.

**The Solopreneur / Freelancer**

Their business is them. Has client lists, credentials, access to shared
tools. Needs their partner or co-founder to pick things up immediately
if they\'re gone. Willing to pay for reliability.

**The Web3 / Crypto Native**

Holds self-custody assets (seed phrases, wallets). Cannot rely on standard
legal channels for inheritance. Needs a mathematically proven, trustless
system to pass on assets and sensitive data without centralized failure points.

**5. Tech Stack**

Selected specifically for AI-assisted (vibe-coded) development --- large
community, excellent LLM familiarity, minimal configuration, strong
ecosystem.

  ------------------ -------------------------- --------------------------
  **Layer**          **Technology**             **Why**

  Frontend           Next.js 14 (App Router)    React-based, SSR, PWA
                                                support, massive AI
                                                familiarity

  Styling            Tailwind CSS + shadcn/ui   Utility-first, AI codes it
                                                fluently, consistent
                                                components

  Backend            Next.js API Routes         Same repo, no context
                                                switching, AI handles full
                                                stack easily

  Database           PostgreSQL via Prisma ORM  Type-safe, excellent AI
                                                generation, self-hostable

  Auth               NextAuth.js (Auth.js v5)   FOSS, flexible, Next.js
                                                native, well-documented

  Encryption         TweetNaCl.js (libsodium    Client-side, audited,
                     port)                      simple API, AI knows it
                                                well

  File Storage       Supabase Storage (default) S3-compatible, free tier,
                     / MinIO (self-host)        single API for both

  Email              Resend (default) /         Modern API, great DX,
                     Nodemailer (self-host)     self-hostable fallback

  SMS (optional)     Twilio (graceful --- falls Industry standard, skip if
                     back to email)             not needed in MVP

  Scheduling / Jobs  Inngest                    Dead man\'s switch cron
                                                --- reliable, visual
                                                dashboard

  Deployment         Vercel (default) / Docker  Zero-config deploy +
                     Compose (self-host)        one-command self-host

  Monorepo           Single Next.js app         Simple, AI handles it, no
                                                microservice overhead yet
  ------------------ -------------------------- --------------------------

+-----------------------------------------------------------------------+
| **Why not \[X\]?**                                                    |
|                                                                       |
| No Rust, no Go, no microservices, no Kubernetes --- not because       |
| they\'re bad, but because AI tools write Next.js + Prisma + Tailwind  |
| better than almost anything else. Optimize for build speed and        |
| correctness first.                                                    |
+-----------------------------------------------------------------------+

**6. Feature List**

**6.1 Core Features (Build These)**

  -------------------- -------------------------- --------------------------
  **Feature**          **Description**            **Phase**

  User auth            Email + password +         1
                       optional 2FA (TOTP)        

  Vault creation       Each user has one          1
                       encrypted vault            

  Notes                Rich text notes addressed  1
                       to a recipient email       

  File uploads         Attach files to vault      1
                       (images, PDFs, any format) 

  Credentials          Key-value pairs (account   1
                       name → password/note)      

  Fixed-date release   Set a specific date for    1
                       vault release              

  Check-in system      Configurable interval,     1
                       email link to confirm      

  Grace period         Multi-stage warning before 1
                       release                    

  Trusted contact      One person notified when   1
                       grace period starts        

  Vault export         Download all data as ZIP   1
                       (JSON + files) anytime     

  Recipient            Email sent to each         1
  notification         recipient on release       

  Recipient access     Simple, clean page for     2
  page                 recipients to view their   
                       items                      

  Mobile PWA           Installable, push          2
                       notifications for check-in 

  Voice memos          Record audio messages      2
                       (personal and emotional)   

  Multiple recipients  Each item addressed to a   2
                       different person           

  Activity             Logging into app counts as 2
  auto-check-in        checking in                

  Scheduled future     \'Open on my 50th          3
  release              birthday\' style notes     

  Self-host Docker     One-command deploy with    3
  image                compose file               

  Passphrase           Ultra-sensitive items      4
  vault-within-vault   behind second key          

  SMS check-in         Reply YES to SMS to check  4
                       in                         

  Web3 Vault Mode      Optional: Encrypt via Lit  4
  (Trustless)          Protocol and store on IPFS 
                       for true decentralization  
  -------------------- -------------------------- --------------------------

**6.2 Intentionally Excluded**

-   **We are not a legal service. Don\'t pretend.** Legal will templates

-   **Email link delivery is simpler and more reliable.** Beneficiary
    accounts / portal

-   **Adds friction to check-in flow. Not worth it.** Biometric login

-   **Confusing to end users. Internal log is enough.** Version history
    on notes

-   **This is a private product. Keep it private.** Social features /
    sharing

**7. Phases Overview**

  ------------------ -------------------------- --------------------------
  **Phase**          **Name**                   **Goal**

  Phase 1            The Working Core           One complete loop: vault →
                                                check-in → grace → release

  Phase 2            The Real Product           Mobile PWA, recipient
                                                experience, multiple
                                                recipients, voice

  Phase 2.5          Product Polish & UI/UX     Secret Key security model,
                                                animations, bento grids,
                                                drag-and-drop, onboarding

  Phase 3            The Open Platform          Self-hosting, Docker,
                                                advanced release options,
                                                audit log

  Phase 4            Hardening                  Security audit, E2E tests,
                                                performance, SMS,
                                                passphrase vault

  Phase 5            Growth & Community         Public launch, FOSS
                                                community, optional hosted
                                                tier
  ------------------ -------------------------- --------------------------

**8. Phase 1 --- The Working Core**

+-----------------------------------------------------------------------+
| **Phase 1 Goal**                                                      |
|                                                                       |
| Build one complete, working loop end-to-end. A user creates a vault,  |
| adds a note, sets a check-in interval, misses a check-in, goes        |
| through grace period, and a recipient gets access. Everything else    |
| can wait.                                                             |
+-----------------------------------------------------------------------+

**8.1 Scope**

-   User registration and login (email + password)

-   One vault per user, AES-256 encrypted at rest

-   Three vault item types: Note, File, Credential

-   Each item addressed to one recipient email

-   Check-in system: configurable interval (30/60/90 days)

-   Grace period: two warning emails, then release

-   Trusted contact: one person who gets a heads-up when grace starts

-   Release: email to each recipient with a time-limited access link

-   Vault export: download everything as ZIP at any time

-   Responsive web UI (works on mobile browser without PWA features)

**8.2 User Flows**

**Registration & Onboarding**

1\. User lands on homepage → clicks \'Create Your Vault\'

2\. Email + password registration → email verification link sent

3\. Verified → onboarding wizard (3 steps max):

-   Step 1: Set your check-in interval (30 / 60 / 90 days)

-   Step 2: Add one trusted contact email

-   Step 3: \'Add your first item\' --- nudge to create a note

4\. Dashboard --- vault is active

**Adding Vault Items**

From dashboard → \'Add Item\' → choose type:

-   Note: Title + rich text body + recipient email

-   File: Upload file + description + recipient email

-   Credential: Label + value (encrypted) + recipient email

All items encrypted client-side before upload. Server stores ciphertext
only.

**Check-in Flow**

At interval (e.g., every 30 days):

-   Email sent: \'Your vault is active. Tap to check in.\' --- one link,
    one click.

-   Clicking the link updates last_checkin timestamp. Done.

-   User can also check in from dashboard at any time.

**Grace Period Flow**

If check-in not received by deadline:

-   Day 0: Warning email #1 --- \'We haven\'t heard from you. Tap here
    to check in.\'

-   Day 7: Warning email #2 --- urgent tone --- \'Your vault will
    release in 7 days unless you check in.\'

-   Day 7: Trusted contact notified --- \'Afterword has not heard from
    \[name\] in \[X\] days.\'

-   Day 14: If no check-in --- release process begins.

-   At any point --- one click to check in stops everything immediately.

**Release Flow**

System decrypts vault items and:

-   Sends each recipient an email with a link to their specific items
    only

-   Link is valid for 30 days, then expires

-   Recipient sees a simple, clean read-only page with their items

-   Files are downloadable for 30 days

-   Vault is marked \'Released\' --- no further check-ins processed

**8.3 Data Models**

  ------------------------ ----------------------------------------------
  **Table / Model**        **Key Fields**

  User                     id, email, password_hash, email_verified,
                           created_at, last_checkin_at

  VaultSettings            user_id, checkin_interval_days,
                           grace_period_days, trusted_contact_email,
                           release_type (date/inactivity), release_date?

  VaultItem                id, user_id, item_type (note/file/credential),
                           title, encrypted_content, recipient_email,
                           created_at

  File                     id, vault_item_id, storage_key, file_name,
                           file_size, mime_type

  CheckinEvent             id, user_id, checked_in_at, method
                           (email_link/dashboard/auto)

  GracePeriod              id, user_id, started_at, warning_1_sent_at,
                           warning_2_sent_at, resolved (boolean),
                           resolved_at

  ReleaseToken             id, vault_item_id, recipient_email, token
                           (uuid), expires_at, accessed_at?
  ------------------------ ----------------------------------------------

**8.4 Encryption Model**

+-----------------------------------------------------------------------+
| **Encryption Approach --- Phase 1**                                   |
|                                                                       |
| Server-side encryption using AES-256-GCM with a key derived from the  |
| user\'s password via PBKDF2. The key is never stored --- only the     |
| encrypted data and salt. Phase 2 upgrades to full client-side         |
| encryption. This is a practical tradeoff to keep Phase 1 buildable    |
| quickly while maintaining strong data protection.                     |
+-----------------------------------------------------------------------+

-   Password → PBKDF2 (100,000 iterations, SHA-256) → Encryption Key

-   Each vault item encrypted individually with a unique IV

-   Key derived fresh on login, used in memory, never persisted

-   Files encrypted with the same derived key before storage

-   Phase 2 migration: move to full client-side (TweetNaCl/WebCrypto) with key wrapping in browser

-   **Phase 2.5 (Secret Key Model)**: To prevent unauthorized decryption if a password is stolen, derive the Master Key using **Password + a Random 128-bit Secret Key**. The Secret Key is generated locally on signup, never sent to the server, and must be entered when logging into a new device.

-   Phase 4 expansion: Introduce **Web3 Mode**. Users can opt to encrypt
    items using decentralized access control (e.g., Lit Protocol) and 
    store blobs on decentralized storage (IPFS/Arweave) bypassing our DB entirely.

**8.5 API Routes**

  ---------------------------- ----------------------------------------------
  **Route**                    **Description**

  POST /api/auth/register      Create account, send verification email

  POST /api/auth/login         Authenticate, return session

  POST /api/auth/verify-email  Verify email token

  GET /api/vault/settings      Get check-in config for current user

  PUT /api/vault/settings      Update check-in interval, trusted contact,
                               etc.

  GET /api/vault/items         List vault items (decrypted for current user)

  POST /api/vault/items        Create new vault item

  PUT /api/vault/items/:id     Update item

  DELETE /api/vault/items/:id  Delete item

  POST /api/vault/files        Upload file (multipart)

  POST /api/checkin            Record a check-in (from dashboard)

  GET                          Verify check-in from email link
  /api/checkin/verify/:token   

  GET /api/vault/export        Download full vault as ZIP

  GET /api/recipient/:token    Public --- recipient views their items (no
                               auth)
  ---------------------------- ----------------------------------------------

**8.6 UI Pages**

  ------------------------ ----------------------------------------------
  **Page / Route**         **Description**

  / (Landing)              Product explanation, sign up CTA, no fluff

  /register                Email + password form

  /login                   Login form

  /verify-email            Email verification landing

  /onboarding              3-step wizard after first login

  /dashboard               Vault overview --- items list, check-in
                           status, settings shortcut

  /vault/new               Add item (note / file / credential tabs)

  /vault/:id/edit          Edit existing item

  /settings                Check-in interval, grace period, trusted
                           contact, export, delete account

  /checkin/:token          Email check-in verification (publicly
                           accessible, no login needed)

  /recipient/:token        Recipient view --- read-only, shows only their
                           items

  /404, /error             Friendly error pages
  ------------------------ ----------------------------------------------

**8.7 Background Jobs (Inngest)**

-   check-in-reminder --- runs daily, checks if any user is approaching
    deadline → sends reminder email

-   grace-period-start --- triggers when check-in deadline missed →
    sends warning #1, starts grace timer

-   grace-period-warning-2 --- 7 days into grace period → sends urgent
    warning + trusted contact email

-   vault-release --- end of grace period with no check-in → executes
    release flow

-   token-expiry --- daily job to clean up expired recipient tokens

**8.8 Email Templates**

-   Check-in reminder --- warm, simple, one big button: \'I\'m here ✓\'

-   Grace period warning #1 --- concerned, not alarming, clear action

-   Grace period warning #2 --- more urgent, shows days remaining

-   Trusted contact notification --- explains the situation, no action
    needed from them

-   Recipient notification --- warm, explains they\'ve been given
    access, provides link

-   Email verification --- standard

**8.9 Phase 1 Acceptance Criteria**

+-----------------------------------------------------------------------+
| **Definition of Done for Phase 1**                                    |
|                                                                       |
| A non-technical person can sign up, add one note addressed to a real  |
| email, set a 30-day check-in, miss the check-in, receive two warning  |
| emails, and the recipient receives an email with access to the note.  |
| All data is encrypted at rest. Vault can be exported at any time.     |
+-----------------------------------------------------------------------+

-   User can register, verify email, and log in

-   User can create Notes, Files, and Credentials in their vault

-   User can configure check-in interval and trusted contact

-   Check-in email is sent at the correct interval

-   Clicking the check-in link updates last_checkin and stops grace
    period

-   Missing check-in triggers grace period emails in correct sequence

-   Recipient receives email with working link to their specific items

-   Recipient link expires after 30 days

-   Vault export downloads all items as ZIP

-   All vault item content is encrypted at rest

-   UI is fully responsive and usable on mobile browser

**8.10 Phase 1 Timeline Estimate**

  ------------- ---------------------------------------------------------
  **Week**      **Focus**

  Week 1        Project setup, auth, database schema, Prisma migrations

  Week 2        Vault item CRUD, encryption implementation, file upload

  Week 3        Check-in system, Inngest jobs, email templates

  Week 4        Grace period flow, release flow, recipient page

  Week 5        Dashboard UI, settings page, onboarding wizard

  Week 6        Vault export, polish, bug fixes, end-to-end test of full
                flow
  ------------- ---------------------------------------------------------

**9. Phases 2--5 (High-Level)**

These will be detailed in separate PRD supplements after Phase 1 ships.
Brief scope below.

**Phase 2 --- The Real Product**

-   PWA with installability and push notifications for check-in

-   Full client-side encryption upgrade (TweetNaCl key wrapping)

-   Multiple recipients per vault (each item addressed differently)

-   Recipient experience upgrade --- better designed access page

-   Voice memo recording and playback

-   Auto-check-in on app activity

-   Mobile-optimized check-in notification (tap from lock screen)

**Phase 2.5 --- Product Polish & UI/UX Overhaul**

-   **Secret Key (1Password Model)**: Generate a 128-bit Recovery Phrase on signup. The Master Key is derived from Password + Secret Key. Requires the Secret Key to log in on new devices. A beautiful PDF is generated for the user to print and store in a safe.
-   **Floating Mobile Dock**: A native-feeling iOS-like bottom navigation dock for the PWA containing Home, Add, Beneficiaries, and Settings.
-   **Local App Lock**: Require a 4-digit PIN or Biometric (FaceID/Fingerprint via WebAuthn) check to unblur the app when waking from sleep/background on mobile.
-   **Beneficiaries Hub**: A dedicated management screen giving an overview of 'Who gets what' by contact, plus a Global Cover Letter.
-   **Folders & Tags**: Expand the flat item structure into custom user folders.
-   **Security Center & Audit Log**: A dedicated screen to view active login sessions, verify the Secret Key, and view a visual timeline of all account activity.
-   **Dashboard Transformation**: Bento-box or masonry grid layout for vault items. Real-time search, filtering, and rich empty states.
-   **Animations & Micro-interactions**: Smooth page transitions using Framer Motion, skeleton loaders, and satisfying success states (e.g., a "Heartbeat" ripple animation when checking in).
-   **File Drag-and-Drop**: A seamless drag-and-drop zone for uploading secure files.

**Phase 3 --- The Open Platform**

-   Docker Compose self-host with full documentation

-   MinIO integration for self-hosted file storage

-   Nodemailer SMTP config for self-hosted email

-   Scheduled future release (\'open on this date\')

-   Audit log (all events: logins, check-ins, edits, releases)

-   GitHub Actions CI/CD pipeline

**Phase 4 --- Hardening**

-   Third-party security audit

-   TOTP two-factor authentication

-   SMS check-in via Twilio (with email fallback)

-   Passphrase-locked vault within vault

-   **Web3 / Trustless Vault Mode** (IPFS Storage + Smart Contract / Lit Protocol conditions)

-   Rate limiting, brute-force protection, CSRF hardening

-   End-to-end Playwright tests for critical flows

**Phase 5 --- Growth & Community**

-   Public launch --- Product Hunt, Hacker News, privacy communities

-   FOSS community: contributing guide, issue templates, roadmap public

-   Optional hosted storage tier (for users who want more than free
    limit)

-   Localization: Hindi, Tamil, Spanish as first targets

-   Potential: API for integrations (password managers, etc.)

**10. Risks & Mitigations**

  ------------------ -------------------------- --------------------------
  **Risk**           **Impact**                 **Mitigation**

  False trigger      High --- vault releases    Multi-stage grace period,
  (user is alive but unintentionally            multiple channels, easy
  misses check-in)                              one-tap check-in

  Email delivery     High --- check-ins and     Email bounce handling,
  failure            releases fail              secondary email option,
                                                SMS fallback in Phase 4

  Key loss (user     High --- vault permanently Clear warning on setup:
  forgets password)  inaccessible               \'If you forget your
                                                password, your vault
                                                cannot be recovered.\' No
                                                backdoor by design.

  Recipient link     Medium --- unauthorized    Links expire in 30 days,
  abuse / forwarding access                     single-use option, IP
                                                logging

  Storage costs at   Medium --- free hosting    File size limits (50MB per
  scale              gets expensive             vault Phase 1), optional
                                                paid tier later

  Legal liability    Low-Medium --- if vault    Clear ToS: Afterword is a
                     contains sensitive info    file relay, not a legal
                                                service. Consult a lawyer
                                                separately.

  Platform           Medium --- users depend on Full export always
  abandonment        this tool                  available. Self-host
                                                option. AGPL license
                                                ensures forks can
                                                continue.
  ------------------ -------------------------- --------------------------

**11. Success Metrics**

**Phase 1 Launch**

-   100 signups in first 30 days (organic only)

-   80% of users complete onboarding (add at least 1 item)

-   Zero false-trigger releases in first 3 months

-   Check-in email open rate \> 60%

**Phase 2**

-   PWA install rate \> 25% of active users

-   GitHub: 500+ stars

-   At least 5 active self-hosters

**Long Term**

-   1,000 active vaults with at least 1 item

-   FOSS contributors from community

-   Zero data breaches or unauthorized releases

**Appendix --- Project Setup Commands**

For AI-assisted development, start with:

npx create-next-app@latest afterword \--typescript \--tailwind \--app
\--src-dir

npm install prisma \@prisma/client next-auth \@auth/prisma-adapter

npm install tweetnacl tweetnacl-util inngest resend
\@supabase/supabase-js

npm install react-hook-form zod \@hookform/resolvers

npx prisma init

+-----------------------------------------------------------------------+
| **Recommended AI Tools for Building**                                 |
|                                                                       |
| Cursor (primary IDE with AI) → Claude Sonnet for architecture         |
| decisions → v0.dev for UI component scaffolding → Cursor Agent mode   |
| for feature implementation. Use GitHub Copilot as secondary for       |
| repetitive code.                                                      |
+-----------------------------------------------------------------------+

*Afterword --- Because what you leave behind matters.*

FOSS • Private • Yours
