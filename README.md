# Afterword - Ultimate Digital Legacy Vault

Afterword is a secure, end-to-end digital legacy vault that allows you to store your most sensitive information (notes, credentials, and files) and ensure they are automatically released to trusted recipients if you go inactive.

## Phase 1 Features
- **Secure Vault:** AES-256-GCM encryption on the server to securely store Notes, Credentials, and Files (~4MB embedded payloads).
- **Authentication:** Passwordless authentication via Magic Links or GitHub OAuth (NextAuth.js).
- **Dead Man's Switch:** Automatic grace period activation upon missing check-ins. If the grace period expires, emails containing secure access links are fired to recipients.
- **Recipient Access:** One-time restricted viewing portal for trusted recipients with automatic token expiration.
- **Exporting:** Download your entire vault at any time as an organized ZIP file.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma with PostgreSQL or SQLite (default local)
- **Authentication:** Auth.js (NextAuth v5)
- **Cryptography:** Node `crypto` module (AES-256-GCM)
- **Design:** Tailwind CSS, Framer Motion, Radix UI (shadcn), Sonner (Toasts)

---

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/afterword.git
cd afterword
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory based on the following template. By default, Prisma is configured for SQLite for easy local setup.

```env
# Define the local database connection
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
# Run `npx auth secret` to generate a random 32-character secret
AUTH_SECRET="your_nextauth_secret"

# Resend API Key for magic links and notification emails
# (Optional for local if using terminal logging, but required for production emails)
RESEND_API_KEY="re_..."

# Core Encryption Key
# MUST BE EXACTLY 32 CHARACTERS (e.g., 256 bits). NEVER LOSE THIS!
# If this changes, existing vault items CANNOT be decrypted.
ENCRYPTION_KEY="your-32-character-ultra-secure-key"
```

### 3. Database Migration
Run the Prisma migrations to initialize the database schema.
```bash
npx prisma migrate dev --name init
```

### 4. Run Development Server
Start the Next.js local development server.
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Security Model (Phase 1)
Currently, Afterword uses Server-Side encryption. When you add a new Vault Item (Note, File, or Credential), the data is transmitted over HTTPS to the server. The `ENCRYPTION_KEY` environment variable is then utilized to encrypt the payload via `AES-256-GCM` before sending it to the database.

Only your Afterword server has the decryption key. This ensures data is completely unreadable at rest within your database platform.

---

## Scripts
- `npm run dev`: Starts the Next.js development server
- `npm run build`: Builds the app for production deployment
- `npm start`: Runs the production build
- `npm run lint`: Formats and lints code structure

## Future Roadmap (Phase 2 & 3)
- Fully Client-Side Encryption Implementation using WebCrypto API
- Progressive Web App (PWA) Offline Support
- Physical Storage Integrity Logging 
