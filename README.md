# Afterword — Secure Digital Legacy Vault

Afterword is a **client-side encrypted digital legacy vault**. Store your most sensitive data — notes, credentials, files, letters — and ensure it is automatically released to your trusted beneficiaries if you go inactive.

---

## ✨ Features

### Core Vault
- **Client-Side Encryption** — All vault items are encrypted/decrypted entirely in the browser using the WebCrypto API + your personal Secret Key. The server never sees plaintext.
- **Multiple Item Types** — Notes, Credentials, Files (with S3/local storage support), and rich text Documents.
- **Vault Export** — Download your entire vault as an organized ZIP at any time.

### Dead Man's Switch
- **Automatic Check-In Monitoring** — A configurable interval (30 / 60 / 90 days) monitors whether you're still active.
- **Grace Period** — After missing a check-in, a grace period activates. Two escalating warning emails are sent before the vault is released.
- **Scheduled Release** — Optionally set a fixed future date to trigger release automatically, regardless of check-ins.
- **Emergency Pause** — Instantly suspend the switch from the Settings page with no emails fired.

### Beneficiaries Hub
- **Contact Profiles** — Manage trusted people as named Contact profiles (name, email, phone, trusted flag).
- **Item-Level Assignment** — Each vault item can be assigned to specific contacts via a many-to-many relationship (new in Phase 3). Not every recipient sees every item.
- **Global Cover Letter** — Write an encrypted personal message shown to all beneficiaries when the vault unlocks.

### Activity Audit Log
- **Real-Time Timeline** — Every check-in, vault item creation, beneficiary addition, and grace period trigger is logged and displayed in chronological order with relative timestamps.

### Security Center
- **Secret Key** — A locally generated 128-bit key required for new device logins. Download as an Emergency PDF.
- **App Lock** — Optional PIN lock that triggers when the PWA resumes from background.
- **Active Sessions** — View and manage connected device sessions.

### User Settings
- **Dead Man's Switch Config** — Interval, trusted contact, scheduled release date, timezone, pause toggle.
- **Change Password** — Securely update your login password (validates current password with bcrypt).
- **Delete Account** — Permanently deletes your account and all data with a two-step typed confirmation.

### Emails (Resend / SMTP)
- **Welcome Email** — Sent automatically on account creation.
- **Check-In Reminders** — Warning emails fired when the grace period activates and escalates.
- **Vault Release Emails** — Sent to all assigned beneficiaries when the dead man's switch triggers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Prisma ORM + SQLite (default) / PostgreSQL |
| Authentication | Auth.js (NextAuth v5) |
| Encryption | WebCrypto API (client-side) + AES-256-GCM |
| Email | Resend SDK / Nodemailer (SMTP fallback) |
| UI | Tailwind CSS, Framer Motion, shadcn/ui, Sonner |
| PWA | `next-pwa` |

---

## Getting Started

### Prerequisites
- Node.js 18.17+
- pnpm (recommended) or npm

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/afterword.git
cd afterword
pnpm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# SQLite for local dev (default)
DATABASE_URL="file:./dev.db"

# NextAuth — generate with: npx auth secret
AUTH_SECRET="your_nextauth_secret"

# Email — choose one:
RESEND_API_KEY="re_..."          # Resend (preferred for production)
RESEND_FROM="Afterword <noreply@yourdomain.com>"

# SMTP alternative (optional)
# SMTP_HOST="smtp.example.com"
# SMTP_PORT="587"
# SMTP_USER="user@example.com"
# SMTP_PASSWORD="yourpassword"
# SMTP_FROM="Afterword <noreply@example.com>"

# Server-side fallback encryption key (32 chars)
# NOTE: Primary encryption is client-side via WebCrypto.
ENCRYPTION_KEY="your-32-character-ultra-secure-key"
```

> **Important:** If neither `RESEND_API_KEY` nor SMTP is configured, email actions will be simulated in the console — useful for local development.

### 3. Initialize Database
```bash
npx prisma db push    # apply schema (dev)
npx prisma generate   # regenerate Prisma client
```

### 4. Run Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Security Model

Afterword uses a **dual-layer encryption architecture**:

1. **Client-Side (Primary):** Vault contents are encrypted in the browser using the WebCrypto API + a user-held Secret Key before being sent to the server. The server stores only ciphertext.

2. **Server-Side (Fallback/Transport):** The `ENCRYPTION_KEY` env variable provides AES-256-GCM encryption at the server boundary for non-secret fields and transport security.

Only the user (via their Secret Key) can decrypt stored vault payloads. Even if the database is compromised, vault contents remain unreadable.

---

## Database Schema (Key Models)

```
User → VaultItem → VaultItemContact (M:N) → Contact
User → CheckinEvent
User → GracePeriod
User → AuditLog
User → Folder → VaultItem
VaultItem → ReleaseToken (for recipient access)
```

---

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Run production server
pnpm lint         # Lint & format

npx prisma studio # Browse database in browser
npx prisma db push # Sync schema to database
```

---

## Roadmap

- [ ] UI for item-level contact assignment in AddItemSheet
- [ ] Skeleton loaders for all loading states
- [ ] SVG empty-state illustrations
- [ ] Folder-based bento grid dashboard layout
- [ ] Drag-and-drop multi-file uploads
