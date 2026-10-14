# APInd — Colladome API Infrastructure Platform

Enterprise API aggregation, monetization, and gateway platform for identity, banking, and business verifications.

---

## 🌟 Key Features

- **Multi-Tenant Gateway (`/api/v1/...`)**:
  - Whitelabel proxy routing requests to upstream providers (Zoop, IDFY, Decentro, Surpass).
  - Strict sanitization: upstream secret keys, internal IDs, and raw provider schemas are completely concealed from clients.
  - Automatic provider failover and latency tracking.
  - Sub-millisecond IP Whitelisting (CIDR & single IPs) and API Key verification.
  - Atomic wallet debit per billable hit with balance protection.

- **Super Admin Portal (`/admin`)**:
  - Live API hit stream, gross revenue, net margin, and provider latency analytics.
  - **API Studio**: dynamic API creation, category assignment, input/output field definitions, and multi-provider priority mappings.
  - **Client 360° Directory**: Full client onboarding (`/admin/clients/new`), custom pricing override, key provisioning, and IP access rules.
  - **Wallet Master**: Real-time passbook, manual top-up / debit adjustment modal, and transaction audit trails.
  - **Compliance Reports**: Specialized PAN Verification, Bank Penny Drop, and Full Raw API Logs with Excel export (`.xlsx`).

- **Client Workspace Portal (`/dashboard`)**:
  - Client KPI overview, live wallet balance, and activated APIs.
  - **API House**: In-browser interactive API tester with auto-generated cURL and code snippets.
  - **Developer Access**: Live and Sandbox API key management with key rotation.
  - **Security**: Client IP whitelist configuration.
  - **Billing & Passbook**: Top-up request simulator and debit history.

- **Public Showcase & Developer Hub (`/`)**:
  - High-impact monochrome landing page featuring industry solutions for **Hotels & Hospitality, Fintech, Banking, HR, and Gaming**.
  - Interactive live gateway tester in hero section.
  - Instant Trial Sandbox key generator with pre-credited ₹100 test balance.
  - Dedicated pages: `/about`, `/apis`, `/industries`, `/contact`.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS (Tailored Black & White Monochrome Design System)
- **Database & ORM**: Prisma ORM with SQLite (Local Dev) / PostgreSQL (Production)
- **Icons**: Lucide React
- **Exporting**: SheetJS (`xlsx`)

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Database Migration & Seeding
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Running Development Server
```bash
npm run dev
# or for production
npm run build
npm run start
```
Server runs on `http://localhost:3000`.

### 4. Running Automated Tests
```bash
npx tsx scripts/verify-platform.ts
```

---

## 🔐 Default Credentials (Seed Data)

- **Super Admin**: `admin@colladome.com` / `Admin@123`
- **Demo Client**: `fintech@acme.com` / `Acme@123`
- **Pre-provisioned Live API Key**: `cd_live_acme_prod_secret_88319a2b`
- **Pre-provisioned Sandbox Key**: `cd_test_acme_sand_secret_11928c3d`
