# Afterword — Project Documentation

## 1. Introduction

### 1.1 What is Afterword?

Afterword is a zero-knowledge, privacy-first **Dead Man's Switch** platform. It allows users to store encrypted digital assets — private notes, login credentials, sensitive files, and personal messages — inside a secure vault. If the user becomes unresponsive for a configurable period of time (due to death, incapacitation, or prolonged absence), the system automatically delivers those assets to their designated beneficiaries via email, with encrypted payloads safely attached.

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
| **Next.js 14 (App Router)** | Full-stack React framework providing both the server-rendered frontend and the serverless API backend. |
| **TypeScript** | Strict type safety across all components, server actions, and API routes. |
| **Tailwind CSS** | Utility-first CSS framework for a consistent, dark-themed, premium UI design language. |
| **Framer Motion** | Smooth page transitions, micro-animations, and interactive motion effects throughout the UI. |
| **Lucide React** | Consistent, lightweight icon library used across all screens. |
| **shadcn/ui** | Pre-built, accessible component library providing Cards, Buttons, Inputs, Dialogs, Sheets, and Switches. |

### 2.2 Backend & Database
| Technology | Purpose |
|---|---|
| **Prisma ORM** | Strongly-typed database modeling with automatic migrations. |
| **SQLite (Dev) / PostgreSQL (Production)** | Configurable via standard `DATABASE_URL` strings. |
| **NextAuth.js (Auth.js v5)** | Session-based authentication with credential providers. |
| **bcryptjs** | Industry-standard password hashing with configurable salt rounds. |

### 2.3 Cryptography & Attachments
| Technology | Purpose |
|---|---|
| **WebCrypto API (AES-GCM 256-bit)** | Client-side zero-knowledge encryption. Vault items are encrypted inside the browser. |
| **PBKDF2 (100,000 iterations, SHA-256)** | Key derivation function combining password and Secret Key to produce AES master keys. |
| **Email Payloads** | Automated releases now attach the raw encrypted content as `.txt` files to emails to guarantee offline delivery preservation. |

### 2.4 Blockchain & Web3 Notarization
| Technology | Purpose |
|---|---|
| **Polygon Amoy (Blockchain)** | Scalable Layer 2 chain resolving immutable transactions. Every item created and every check-in event triggers a microscopic zero-sum transaction to publicly notarize a `SHA-256` timestamp hash on-chain. Provides "On-Chain" badges. |
| **ethers.js** | Used behind the scenes to bridge backend Next.js API actions directly to the Polygon RPC Nodes without exposing wallets to clients. |
| **IPFS & Pinata** | Encrypted vault payloads can optionally be pinned dynamically as immutable blobs on the global decentralized IPFS network as a physical fallback if decentralized permanence is favored over central hosting. |

### 2.5 Progressive Web App (PWA)
| Technology | Purpose |
|---|---|
| **next-pwa** | Injects Service Workers enabling offline caching, standalone manifest mapping, and fully-native app-like installation across Chrome, Edge, and Android Chromium. |
| **Client Prompts** | Includes a customized slide-up native `InstallPrompt` to encourage immediate PWA downloads. |

---

## 3. Database Architecture

The application uses interconnected database models via Prisma. 

### 3.1 VaultSettings & VaultItems
- **`VaultSetting`**: Per-user configuration for dead man switches (`checkinIntervalDays`, `gracePeriodDays`, `timezone`, `scheduledReleaseDate`, `trustedContactEmail`).
- **`VaultItem`**: The core entity storing encrypted string text, or stringified `ipfs://` IDs natively. It includes properties for multi-beneficiary emails (`recipientEmail`) and features full cascading soft-deletion logic (`deleteVaultItem`).

### 3.2 Audit & Check-ins
- **`CheckinEvent`**: Immutable log of every check-in action.
- **`AuditLog`**: Security audit trail logging event data.

---

## 4. Application Screens & Flows

### 4.1 Dashboard (`/dashboard`)
- **Check-In Status**: A massive numerical countdown card showing urgency. Colors transition dynamically from Emerald -> Yellow -> Red as the switch risks firing. 
- **Secured Data Vault**: A grid layout showcasing every data token inside the User's vault. Vault items dynamically display an "On-Chain" blockchain notarization badge, as well as an "IPFS" badge if decentralized. A newly added `Trash` icon allows verified permanent removal of sensitive local data.
- **PWA Prompt**: A slick native PWA installation module requests offline access caching context to "install as an app."

### 4.2 Security Center (`/security`)
- **Cryptographic Settings**: Key revelation interfaces for handling and protecting the zero-knowledge key derivations.
- **Active Sessions**: Monitoring system for all concurrent sign-ins mapped natively.
- **Activity Log**: Read-only chronological digest of system access and check-in audit metrics.
- *(Note: Legacy dummy App Locks have been successfully stripped for improved usability).*

### 4.3 Vault Settings (`/settings`)
- **Engine Rules**: Complete configurations for Interval constraints and Grace Period fallbacks.
- **Emergency Release Switch**: Under the red "Danger" zone, an explicit `Release All` system handles complete instant-dispatch of entire vault payloads via bypass to all verified Beneficiaries via Email. Contains built-in `.txt` cryptographic attachment payload logic.

---

## 5. System Architecture: The Pipeline

### 5.1 The Dead Man's Switch Engine
Executed daily by a CRON architecture (native to Vercel via `vercel.json`):
1. **Scrub Active Users**: Identify check-in timestamps exceeding their configured logic maps.
2. **Warn & Release**: Generate "Warning" emails or outright fire a master payload dispatch.
3. **Attach Keys**: Instead of strictly relying on URLs linking to the backend where links may break if infrastructure is taken down years from now, the system dynamically generates `.txt` blobs. It pulls IPFS strings down to raw encryptions or constructs database blobs and attaches them cleanly as pure File Attachments onto the Resend/SMTP email natively before sending!

### 5.2 Blockchain Nonce Management
To prevent `ethers.js` from getting clogged by race-conditions during simultaneous User Check-in loops and System Item Generation logic, the application uses manual flags (`shouldNotarize`) to intentionally skip identical-nonce RPC transaction executions to ensure the Polygon ledger never drops a transaction.

---

## 6. Official Vercel Hosting Instructions

The Afterword project is officially `production-ready` for seamless single-click deployment via **Vercel** with a built-in Postinstall script configured.

### Deployment Checklist:
1. **Push:** Push the `afterword/` directory up to a standard private Github repository.
2. **Vercel Hook:** Inside the Vercel Dashboard, import the repository and instantiate it using standard `Next.js` logic.
3. **Environment Injection:** You MUST supply the matching environment variables immediately into the Vercel settings under Project Configuration before running your deploy build.
4. **Deploy:** Hit build. The Vercel system will intelligently find `vercel.json` and automatically schedule your Dead Man Switch to fire every 24 hours checking User rules in the cloud eternally.

### Critical Production .ENV List:
```bash
# Database Override strings
DATABASE_URL="postgresql://[prod-db-address]..."

# Cryptographic Salt (Must be ultra-secure for Auth.js to spin cookies)
AUTH_SECRET="long_random_base64_string_here"

# Resend Mail Dispatching
RESEND_API_KEY="re_XXXXXXX"
RESEND_FROM="Afterword Protocol <noreply@yourdomain.com>"

# Web3 Storage (Pinata defaults)
PINATA_JWT="ey_XXXX..."

# Web3 Ledger Notarization (Polygon Amoy / Ethereum RPC networks)
BLOCKCHAIN_RPC_URL="https://rpc-amoy.polygon.technology"
BLOCKCHAIN_PRIVATE_KEY="YOUR_WEB3_WALLET_PRIVATE_KEY_HERE"
```

---

## 7. Security Wrap-up

Afterword relies purely upon Client-Side mathematical security. Because AES-GCM generation locks inside the client context memory, server infiltration yields solely obfuscated database noise. This codebase provides high-resilience decentralized durability through optional IPFS persistence mappings merged naturally into Email Delivery fallback mechanics to ensure your digital legacy survives you.
