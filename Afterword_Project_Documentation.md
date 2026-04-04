# Afterword — Project Documentation

## 1. Introduction

### 1.1 What is Afterword?

Afterword is a zero-knowledge, privacy-first **Dead Man's Switch** platform. It allows users to store encrypted digital assets — private notes, login credentials, sensitive files, and personal messages — inside a secure vault. If the user becomes unresponsive for a configurable period of time (due to death, incapacitation, or prolonged absence), the system automatically delivers those assets to their designated beneficiaries via email.

The platform operates on a simple principle: **check in periodically, or your vault gets released.** This makes it invaluable for digital estate planning, journalist protection, emergency credential backup, and whistleblower safeguarding.

### 1.2 Core Value Proposition

| Use Case | Description |
|---|---|
| **Digital Estate Planning** | Families gain access to banking credentials, crypto wallets, and insurance documents if a tragedy occurs. |
| **Journalist & Whistleblower Safety** | Research drops are automatically distributed if the reporter is detained or silenced. |
| **Emergency Infrastructure Backup** | Server credentials, API keys, and recovery phrases are released to trusted engineers if an admin disappears. |
| **Personal Legacy** | Love letters, final wishes, and sentimental messages are delivered to loved ones automatically. |

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Purpose |
|---|---|
| **Next.js 14 (App Router)** | Full-stack React framework providing both the server-rendered frontend and the serverless API backend. Uses the modern App Router with React Server Components for optimal performance. |
| **TypeScript** | Strict type safety across all components, server actions, and API routes. |
| **Tailwind CSS** | Utility-first CSS framework for a consistent, dark-themed, premium UI design language. |
| **Framer Motion** | Smooth page transitions, micro-animations, and interactive motion effects throughout the UI. |
| **Lucide React** | Consistent, lightweight icon library used across all screens for visual indicators. |
| **shadcn/ui** | Pre-built, accessible component library providing Cards, Buttons, Inputs, Dialogs, Sheets, Switches, and more. |
| **Sonner** | Toast notification library for real-time user feedback on actions like saving items and checking in. |

### 2.2 Backend & Database

| Technology | Purpose |
|---|---|
| **Prisma ORM** | Strongly-typed database modeling with automatic migrations. Provides compile-time safety for all database queries. |
| **SQLite (Development) / PostgreSQL (Production)** | SQLite for local-first development; production-ready swap to PostgreSQL via a single environment variable. |
| **NextAuth.js (Auth.js v5)** | Session-based authentication with credential providers. Handles secure login, registration, and session management. |
| **bcryptjs** | Industry-standard password hashing with configurable salt rounds for secure credential storage. |

### 2.3 Cryptography

| Technology | Purpose |
|---|---|
| **WebCrypto API (AES-GCM 256-bit)** | Client-side zero-knowledge encryption. All vault items are encrypted inside the user's browser before being transmitted. The server never sees plaintext data. |
| **PBKDF2 (100,000 iterations, SHA-256)** | Key derivation function that combines the user's password and their unique Secret Key to produce the AES master key. |
| **Server-Side AES (crypto module)** | Fallback server-side encryption for legacy compatibility, using Node.js native crypto. |

### 2.4 Web3 & Blockchain

| Technology | Purpose |
|---|---|
| **IPFS (InterPlanetary File System)** | Decentralized, content-addressed storage network. Encrypted vault payloads are pinned as immutable blobs on the global IPFS network. |
| **Pinata** | Managed IPFS pinning service. The Afterword backend communicates with Pinata's API to pin encrypted content, abstracting all Web3 complexity from the end user. |

### 2.5 Email & Notifications

| Technology | Purpose |
|---|---|
| **Nodemailer** | SMTP-based email transport for self-hosted deployments. Supports any standard SMTP server. |
| **Resend** | Managed transactional email API for cloud-hosted deployments. Used as a fallback if SMTP is not configured. |

### 2.6 Mobile

| Technology | Purpose |
|---|---|
| **Capacitor.js** | Cross-platform native runtime that wraps the Afterword web application into a native Android APK. Provides access to native device APIs including biometric authentication, background services, and push notifications. |

### 2.7 DevOps & CI/CD

| Technology | Purpose |
|---|---|
| **GitHub Actions** | Automated CI pipeline (`.github/workflows/ci.yml`) that runs linting and builds on every push to ensure code quality. |

---

## 3. Database Architecture

The application uses 13 interconnected database models managed by Prisma. Below is a detailed breakdown of each model and its role in the system.

### 3.1 User

The central identity model. Every other model in the system relates back to the User.

| Field | Type | Description |
|---|---|---|
| `id` | String (CUID) | Unique identifier |
| `email` | String (Unique) | User's email address, used for login |
| `passwordHash` | String | bcrypt-hashed password |
| `emailVerified` | DateTime? | Timestamp of email verification |
| `lastCheckinAt` | DateTime | The most critical field — tracks the user's last check-in time. The dead man's switch logic compares this against the configured interval. |

### 3.2 VaultSetting

Per-user configuration for the dead man's switch behavior.

| Field | Type | Description |
|---|---|---|
| `checkinIntervalDays` | Int (default: 30) | How many days the user can go without checking in before the grace period begins. |
| `gracePeriodDays` | Int (default: 14) | Duration of the warning window before the vault is released. |
| `trustedContactEmail` | String? | Email of a trusted person who receives Warning 2 before the vault is fully released. |
| `scheduledReleaseDate` | DateTime? | Optional hard date for automatic vault release, regardless of check-in status. |
| `timezone` | String (default: "UTC") | User's timezone for accurate scheduling of release triggers. |
| `isPaused` | Boolean (default: false) | Emergency pause toggle. When enabled, the entire dead man's switch is suspended. |

### 3.3 VaultItem

The core data entity — represents a single encrypted piece of data in the vault.

| Field | Type | Description |
|---|---|---|
| `itemType` | String | One of: `note`, `credential`, `file` |
| `title` | String | Human-readable title for the vault item |
| `encryptedContent` | String | The encrypted payload (AES-GCM ciphertext) or an IPFS URI (`ipfs://<CID>`) |
| `recipientEmail` | String? | Primary beneficiary email address |
| `storageProvider` | String (default: "DATABASE") | Either `DATABASE` (centralized) or `IPFS` (decentralized Web3) |
| `folderId` | String? | Optional folder organization |

### 3.4 Supporting Models

| Model | Purpose |
|---|---|
| **Contact** | Address book entry for a beneficiary. Contains name, email, phone, and trust level. |
| **Recipient** | Links a VaultItem to one or more recipient email addresses for multi-recipient distribution. |
| **GracePeriod** | Tracks the active grace period window with timestamps for Warning 1 and Warning 2 emails sent. |
| **CheckinEvent** | Immutable log of every check-in action, including the method used (dashboard, email link, auto). |
| **AuditLog** | Security audit trail recording every significant action with IP address and user agent metadata. |
| **ReleaseToken** | Time-limited, unique token generated for beneficiaries to securely access released vault items. |
| **CoverLetter** | A single encrypted global message displayed to all beneficiaries before they view individual items. |
| **Folder** | Color-coded organizational folders for vault items. |
| **File** | Metadata for file attachments linked to vault items, including storage key, filename, size, and MIME type. |

---

## 4. Application Screens

### 4.1 Landing Page (`/`)

**Purpose:** The public-facing marketing page that introduces Afterword to new visitors.

**What the user sees:**
- A cinematic dark-themed hero section with animated gradient background effects (blue, purple, and emerald blurs).
- A bold headline: *"A private time capsule with a dead man's switch."*
- A descriptive subtitle explaining the core concept in plain language.
- Two primary CTAs: **"Create Your Vault"** (links to registration) and **"Sign In"** (links to login).
- Three feature cards at the bottom highlighting: **Zero-Trust Security**, **Automated Release**, and **Self-Sovereign** philosophy.

**Technical details:**
- Uses Framer Motion for fade-in animations on load.
- Fully responsive — adapts from mobile to desktop seamlessly.
- All animations are GPU-accelerated for smooth 60fps rendering.

---

### 4.2 Registration Page (`/register`)

**Purpose:** Account creation with integrated cryptographic key generation.

**What the user sees:**
- A centered glassmorphic card with email and password fields.
- After successful registration, the UI transitions (with a blur animation) to a **Secret Key Reveal** screen.
- The Secret Key is displayed in a monospaced, emerald-colored font inside a dark bordered box.
- A critical warning banner (orange) explains that this key is mathematically required and cannot be recovered.
- Two action buttons: **"Save as PDF"** (triggers browser print dialog) and **"I saved it →"** (proceeds to login).

**How it works internally:**
1. The user submits email + password.
2. The server action `register()` hashes the password with bcrypt and creates the User record.
3. The client generates a 128-bit random Secret Key using `window.crypto.getRandomValues()`.
4. The key is formatted as `XXXX-XXXX-XXXX-XXXX` (uppercase hex).
5. On confirmation, the key is stored in `localStorage` for this device.
6. A print-optimized **Emergency Kit** is also rendered (hidden on screen, visible only in print) containing the key and recovery instructions.

---

### 4.3 Login Page (`/login`)

**Purpose:** Secure vault authentication with automatic key derivation.

**What the user sees:**
- Email and password fields in a glassmorphic card titled "Unlock Vault".
- If the user is on a **new device** (no Secret Key in localStorage), an additional emerald-styled input appears requesting the Secret Key.
- A loading state shows "Decrypting..." while the key derivation runs.

**How it works internally:**
1. Credentials are validated via NextAuth's credential provider.
2. On success, the client runs PBKDF2 key derivation: `deriveKey(password, secretKey)` produces an AES-GCM 256-bit CryptoKey.
3. The derived key is exported to Base64 and stored in `sessionStorage` as `afterword_vault_key`.
4. This key lives only in memory for the duration of the session — it is never transmitted to the server.
5. The user is redirected to `/dashboard`.

---

### 4.4 Dashboard (`/dashboard`)

**Purpose:** The central command center where users manage their vault and monitor their check-in status.

**What the user sees:**

**Header Section:**
- Personalized greeting: *"Welcome, [username]"* (extracted from email).
- Action buttons: Export Vault, Settings gear icon, and Sign Out.

**Check-In Status Card:**
- A large numerical countdown showing days remaining until the grace period begins.
- Color-coded urgency: **Emerald** (safe), **Yellow** (warning, ≤7 days), **Red** (critical, ≤0 days).
- Animated glow effects that match the urgency color.
- A prominent **"Check In Now"** button that resets the timer.

**Secured Data Section:**
- A responsive grid of vault item cards. Each card shows:
  - Item title
  - Item type icon (key icon for credentials, document icon for notes/files)
  - Recipient email
  - IPFS badge (green "IPFS" tag) if stored on Web3
  - Loading spinner while decrypting
- Clicking a card opens a secure **Dialog modal** that decrypts and displays the content:
  - **Notes:** Plaintext rendered in monospace font.
  - **Credentials:** Structured display with username, password (hidden by default with show/hide toggle), and URL.
  - **Files:** Download button linking to a base64-decoded data URI.
- Items stored on IPFS show a "Web3" badge in the dialog header.

**Floating Action Button (FAB):**
- A fixed "+" button at the bottom-right that opens a slide-up **Sheet** for adding new items.

---

### 4.5 "Secure Item" Creator Sheet

**Purpose:** The primary data entry interface for adding new encrypted vault items.

**What the user sees:**
- A bottom slide-up sheet (mobile-first UX pattern).
- **Item Type Selector:** Three tabs — Note, Credential, File — each showing different form fields.
- **Storage Medium Toggle:** A segmented control with two options:
  - **Database (Platform):** Standard centralized storage.
  - **Web3 (IPFS):** Decentralized blockchain storage with a yellow warning: *"IPFS data is globally distributed. Only destroying your decryption key guarantees data deletion."*
- **Title Field:** Name for the vault item.
- **Beneficiary Selector:** A dropdown populated from the user's Contact list (not a raw text input).
- **Content Fields:** Dynamic based on item type:
  - Note: Textarea
  - Credential: Username, Password, URL fields
  - File: File upload input with size display

**How it works internally:**
1. User fills out the form and selects storage medium + beneficiary.
2. The client derives the AES key from `sessionStorage`.
3. Content is encrypted using `encryptData()` → produces `CLIENT_ENCRYPTED:<base64IV>:<base64Cipher>`.
4. The encrypted payload is sent to the server action `addVaultItem()`.
5. If `storageProvider === "IPFS"`: the server uploads the ciphertext to Pinata, receives a CID, and stores `ipfs://<CID>` in the database instead of the raw blob.
6. If `storageProvider === "DATABASE"`: the ciphertext is stored directly in the `encryptedContent` column.
7. An audit log entry is created, and the check-in timer is automatically reset.

---

### 4.6 Beneficiaries Hub (`/beneficiaries`)

**Purpose:** Manage the trusted contacts who will receive vault contents upon release.

**What the user sees:**

**Contact Cards Grid:**
- Each contact is displayed as a card showing:
  - Avatar initials (first two letters of name)
  - Name, email, phone number
  - Trust badge: "Trusted" (emerald) or "Added" (neutral)
  - Item count: how many vault items are addressed to them
  - **Remove** button (red, with confirmation)
- Empty state shows an illustration with "No Beneficiaries Yet" message.

**Add Contact Sheet:**
- A slide-up form to add new contacts with name, email, phone, and trust level toggle.

**Global Cover Letter:**
- A dedicated section at the bottom with a rich text editor.
- The cover letter is an encrypted message displayed to **all** beneficiaries before they view their individual items.
- Useful for providing context, explaining the situation, or expressing final wishes.
- The content is encrypted client-side before storage, maintaining zero-knowledge integrity.

---

### 4.7 Security Center (`/security`)

**Purpose:** Comprehensive security management dashboard.

**What the user sees:**

**Cryptographic Identity Section:**
- Master Secret Key management panel.
- "Reveal Key" button to temporarily display the key.
- "Download PDF Backup" button to save the Emergency Kit.

**Local Protection Section:**
- **Biometric / PIN App Lock** toggle.
- When enabled, a 4-digit PIN setup form appears.
- The PIN is hashed using SHA-256 before being stored in `localStorage`.
- On subsequent visits, the `AppLockWrapper` component intercepts navigation and requires PIN entry.

**Active Sessions Section:**
- Displays all currently active sessions with device type, browser, and last activity time.
- Ability to revoke sessions from other devices.

**Account Activity Log Section:**
- Real-time audit log pulled from the database.
- Each entry shows the action type (check-in, item created, login, etc.), timestamp, and metadata.
- Visual timeline with color-coded icons per action type.

---

### 4.8 Vault Configuration / Settings (`/settings`)

**Purpose:** Configure the dead man's switch parameters and advanced controls.

**What the user sees:**

**Check-in Interval Selector:**
- Dropdown with options: 30, 60, or 90 days.
- Helper text explains the check-in requirement.

**Trusted Contact Email:**
- Input field for the VIP contact who receives Warning 2 before vault release.

**Scheduled Release Date:**
- Date picker for a hard release date. If set, the vault releases on this exact date regardless of check-in status.

**Timezone Selector:**
- Dropdown with major world timezones (UTC, Eastern, Central, Pacific, London, Paris, Tokyo, India, Sydney).
- Ensures scheduled releases trigger at the correct local time.

**Emergency Pause Toggle:**
- A prominent switch with description: *"Suspend the dead man's switch. No warnings or releases will occur."*
- Useful for extended travel, military deployment, or any scenario where internet access is unavailable.

**Save Configuration Button:**
- Submits all settings via a server action that upserts the `VaultSetting` record.

---

### 4.9 Activity Audit Log (`/activity`)

**Purpose:** A complete chronological timeline of all authentication and vault modification events.

**What the user sees:**
- A vertical timeline card with color-coded event entries:
  - **Green (ShieldCheck):** Check-in events
  - **Blue (FilePlus):** Vault item creation events
  - **Orange (Smartphone):** New device login events
  - **Purple (KeyRound):** Secret Key access events
  - **Neutral (Fingerprint):** Account initialization
- Each entry shows: Event title, description, timestamp, and device/IP metadata.
- Footer: "End of log (30 day retention)."

---

### 4.10 Recipient Portal (`/recipient/[token]`)

**Purpose:** The beneficiary-facing page for accessing released vault items.

**How it works:**
- When the vault is released, each beneficiary receives an email with a unique tokenized URL.
- The token maps to a `ReleaseToken` record with an expiry time.
- On visiting the URL, the `RecipientDecrypter` component validates the token, fetches the encrypted item, and attempts server-side decryption for rendering.

---

## 5. System Architecture: How Everything is Wired Together

### 5.1 The Dead Man's Switch Engine

The engine is the core automated process that runs on a scheduled interval (via the Cron API endpoint `POST /api/cron/trigger`). Here is the complete decision tree:

```
For each user in the system:
│
├── Is Emergency Pause enabled?
│   └── YES → Skip this user entirely. Log "Skipped (Emergency Pause Active)".
│
├── Is there a Scheduled Release Date that has passed?
│   └── YES → RELEASE VAULT immediately.
│         → Send emails to all beneficiaries with their specific vault items.
│         → Log "RELEASE_VAULT (Scheduled Date Reached)".
│
├── Calculate: daysSinceCheckin = now - lastCheckinAt
│   └── Is daysSinceCheckin >= checkinIntervalDays?
│       │
│       ├── NO → User is safe. Log "Safe".
│       │
│       └── YES → Check for active Grace Period
│           │
│           ├── No active Grace Period exists:
│           │   → Create new GracePeriod record
│           │   → Send Warning 1 email to the USER
│           │   → Log "Started Grace Period"
│           │
│           └── Active Grace Period exists:
│               │
│               ├── daysInGrace >= gracePeriodDays?
│               │   → RELEASE VAULT
│               │   → Send emails to ALL beneficiaries
│               │   → Log "RELEASE_VAULT"
│               │
│               └── daysInGrace >= 7 AND Warning 2 not sent?
│                   → Send Warning 2 to Trusted Contact
│                   → Update GracePeriod.warning2SentAt
│                   → Log "Warning 2 Sent"
```

### 5.2 Encryption Pipeline

```
Registration:
  Browser generates 128-bit Secret Key
  └── Stored in user's localStorage (never sent to server)

Login:
  PBKDF2(password + secretKey, 100K iterations, SHA-256)
  └── Produces AES-GCM 256-bit CryptoKey
      └── Exported to Base64 → stored in sessionStorage

Encrypting a Vault Item:
  1. User enters plaintext in browser
  2. Browser generates random 12-byte IV
  3. AES-GCM encrypt(plaintext, key, iv)
  4. Format: "CLIENT_ENCRYPTED:<base64IV>:<base64Ciphertext>"
  5. Sent to server (server never sees plaintext)

Decrypting a Vault Item:
  1. Server returns encrypted string to browser
  2. Browser imports key from sessionStorage
  3. Parse IV and ciphertext from formatted string
  4. AES-GCM decrypt(ciphertext, key, iv)
  5. Display plaintext in UI
```

### 5.3 Dual Storage Pipeline

```
User creates item → selects storage medium:
│
├── DATABASE (Web2):
│   └── Encrypted payload stored directly in PostgreSQL/SQLite
│       └── Retrieved directly from DB on access
│
└── IPFS (Web3):
    └── Encrypted payload uploaded to Pinata IPFS
        └── Returns Content ID (CID)
            └── "ipfs://<CID>" stored in database
                └── On access: fetch from IPFS gateway → decrypt in browser
```

### 5.4 Email Dispatch System

The platform supports dual email providers:

1. **SMTP (Nodemailer):** Prioritized if `SMTP_HOST` environment variable is configured. Ideal for self-hosted deployments using services like Mailgun, SendGrid, or a personal SMTP server.

2. **Resend:** Used as fallback if SMTP is not configured. Requires `RESEND_API_KEY` environment variable.

Emails are dispatched for three scenarios:
- **Warning 1:** Sent to the vault owner when grace period begins.
- **Warning 2:** Sent to the trusted contact after 7 days in grace period.
- **Vault Release:** Sent to each beneficiary with their specific vault item details.

---

## 6. Mobile Application (Android)

### 6.1 Technology

The Afterword mobile application is built using **Capacitor.js**, which wraps the entire Next.js web application into a native Android APK. This approach provides several advantages:

- **Single codebase:** The web and mobile versions share 100% of the application logic and UI.
- **Native API access:** Capacitor bridges provide access to native Android features including biometric authentication (fingerprint/face), push notifications, and background services.
- **Instant updates:** UI changes deployed to the web are automatically reflected in the mobile app without requiring a new APK release.

### 6.2 Mobile-Specific Features

| Feature | Implementation |
|---|---|
| **Biometric Authentication** | Uses Capacitor's Biometrics plugin to authenticate via fingerprint or face recognition before unlocking the app. |
| **PIN Lock** | 4-digit PIN with SHA-256 hashing, stored locally on the device. Activates when the app returns from background. |
| **Push Notifications** | Capacitor Push Notifications plugin sends check-in reminders to prevent accidental grace period triggers. |
| **Background Sync** | Periodic background task that performs silent check-ins when the app detects the user is active on the device. |
| **PWA Install Banner** | For users who prefer not to use the native APK, the web app can be installed as a Progressive Web App directly from the browser. |

### 6.3 APP Lock Flow

The `AppLockWrapper` component (a client-side wrapper around the entire authenticated layout) implements the following flow:

1. On app launch or return from background, check if a PIN hash exists in `localStorage`.
2. If yes, display a full-screen PIN entry overlay.
3. User enters 4-digit PIN → hash with SHA-256 → compare against stored hash.
4. On match: dismiss overlay and reveal the app.
5. On mismatch: show error and allow retry.

---

## 7. Key Components Reference

| Component | File | Purpose |
|---|---|---|
| `AddItemSheet` | `src/components/AddItemSheet.tsx` | FAB button + slide-up sheet trigger for the item creator |
| `AddItemClientWrapper` | `src/app/(app)/dashboard/AddItemClientWrapper.tsx` | The full form logic for creating encrypted vault items with storage selection |
| `VaultItemViewer` | `src/app/(app)/dashboard/VaultItemViewer.tsx` | Grid display of vault items with click-to-decrypt dialog |
| `CheckinButton` | `src/app/(app)/dashboard/CheckinButton.tsx` | The check-in action button with urgency-based styling |
| `AddContactSheet` | `src/components/AddContactSheet.tsx` | Slide-up form for adding new beneficiary contacts |
| `CoverLetterEditor` | `src/components/CoverLetterEditor.tsx` | Rich text editor for the global cover letter |
| `ExportVaultButton` | `src/components/ExportVaultButton.tsx` | One-click encrypted vault export functionality |
| `RecipientDecrypter` | `src/components/RecipientDecrypter.tsx` | Beneficiary-facing component for accessing released items |
| `AppLockWrapper` | `src/components/AppLockWrapper.tsx` | PIN/biometric lock screen overlay |
| `AutoCheckinWrapper` | `src/components/AutoCheckinWrapper.tsx` | Background auto-check-in for active sessions |
| `AuditLogList` | `src/components/AuditLogList.tsx` | Real-time audit log display component |
| `ActiveSessions` | `src/components/ActiveSessions.tsx` | Active device session management |
| `Navigation` | `src/components/Navigation.tsx` | App-wide navigation bar with route indicators |

---

## 8. Server Actions Reference

| Action | File | Purpose |
|---|---|---|
| `register()` | `src/app/actions/auth.ts` | Creates new user account with bcrypt-hashed password |
| `login()` | `src/app/actions/login.ts` | Validates credentials and initiates session |
| `checkin()` | `src/app/actions/vault.ts` | Resets the dead man's switch timer and resolves active grace periods |
| `addVaultItem()` | `src/app/actions/vault.ts` | Encrypts and stores a new vault item (supports both DB and IPFS storage) |
| `getDecryptedVaultItem()` | `src/app/actions/vault.ts` | Retrieves and prepares an item for client-side decryption (with IPFS gateway fetch support) |
| `getContacts()` | `src/app/actions/contacts.ts` | Fetches the user's contact list for beneficiary selection |
| `deleteContact()` | `src/app/actions/contacts.ts` | Removes a contact from the beneficiary list |
| `updateSettings()` | `src/app/(app)/settings/page.tsx` | Upserts vault configuration (interval, trusted contact, timezone, pause state) |

---

## 9. API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/cron/trigger` | POST | The dead man's switch engine. Processes all users, checks intervals, manages grace periods, and dispatches emails. |
| `/api/auth/*` | Various | NextAuth.js authentication endpoints for session management. |

---

## 10. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string. `file:./dev.db` for SQLite, full connection string for PostgreSQL. |
| `AUTH_SECRET` | Yes | NextAuth.js session encryption secret. |
| `PINATA_JWT` | No | Pinata API JWT token for IPFS Web3 storage. If not set, IPFS uploads are mocked locally. |
| `RESEND_API_KEY` | No | Resend API key for managed email delivery. |
| `SMTP_HOST` | No | SMTP server hostname. If set, SMTP is prioritized over Resend. |
| `SMTP_PORT` | No | SMTP server port (default: 587). |
| `SMTP_USER` | No | SMTP authentication username. |
| `SMTP_PASSWORD` | No | SMTP authentication password. |
| `SMTP_SECURE` | No | Whether to use TLS (`true`/`false`). |
| `SMTP_FROM` | No | Sender email address for outbound emails. |

---

## 11. Security Considerations

1. **Zero-Knowledge Architecture:** The server stores only ciphertext. The AES-GCM encryption key is derived from the user's password + Secret Key and exists only in the browser's `sessionStorage`. Even a complete database breach reveals nothing.

2. **Secret Key:** A 128-bit cryptographically random value generated using `window.crypto.getRandomValues()`. It is never transmitted to the server. Loss of this key means permanent, irrecoverable data loss.

3. **IPFS Immutability:** Data pinned to IPFS cannot be traditionally deleted. Revoking access is achieved by destroying the local decryption key, rendering the on-chain blob meaningless random bytes.

4. **Audit Trail:** Every significant action is logged with IP address and user agent for forensic analysis.

5. **PIN Lock:** The 4-digit PIN is hashed with SHA-256 before storage, preventing plaintext PIN exposure even if device storage is compromised.

---

## 12. Conclusion

Afterword represents a complete, production-ready digital legacy platform that combines the reliability of traditional centralized storage with the permanence and censorship-resistance of Web3 decentralized networks. The system has been built with a mobile-first approach, zero-knowledge cryptography at its core, and a fully automated release engine that operates independently once configured.

The platform is ready for production deployment with the appropriate environment variables configured for SMTP/Resend email delivery, Pinata IPFS pinning, and a production-grade PostgreSQL database.
