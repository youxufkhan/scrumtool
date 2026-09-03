# 🚀 ScrumTool

> **Zero-Friction Daily Standups, Sprint Tracking & Automated Timesheets** for modern engineering teams.

[![Live App](https://img.shields.io/badge/Production-scrum.yousufkhan.uk-indigo?style=for-the-badge)](https://scrum.yousufkhan.uk)
[![Next.js](https://img.shields.io/badge/Next.js-14_(App_Router)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_(RLS)-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-31_Tests_Passing-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

## ✨ Features

### 👤 Member Standup Experience
- 🔐 **Secure 4-Digit PIN Authentication:** Quick and friction-free login with custom PIN setup on first access (default: `1234`). Passcodes are securely hashed using salted SHA-256 and sessions are managed via HTTP-only cookies.
- 🌅 **Morning Standup (< 30s):** Rapid keyboard-first task planning (`Enter` to add consecutive tasks) + 1-click **"Copy Unfinished Tasks from Yesterday"**.
- 🌆 **Evening Standup (< 1m):** Decimal hour entry (`0.5`, `1.25`, `0`), status toggles (`Done`, `In Progress`, `Blocked`), and **"Submit & Lock Day"**.
- 🛡️ **Missing Hours Compliance Gate:** Automatically scans past working days (excluding weekends & holidays) and blocks current standups until unsubmitted hours are logged or marked as leave.
- ⚡ **Zero-Flicker Optimistic UI:** Tasks are saved seamlessly in the background without disruptive full-page reloads or spinner unmounts.
- 📅 **Smart Date Navigation:** Future date lockout prevents recording standups ahead of time, while previous working days remain accessible for retroactive logging.

### 🛠️ Admin Console (`/admin`)
- 📋 **Daily Team Board:** Real-time summary across all members with a 1-click **"Copy for Slack / Teams"** markdown generator.
- 📊 **Analytics & Timesheets:** Interactive charts for total team hours, project allocation distribution, and planned vs. ad-hoc trends.
- 📥 **Secure CSV Export:** Server-generated timesheet CSV export with formula injection sanitization.
- 🌴 **Leave & PTO Management:** Schedule member leaves across date ranges with automatic weekend and holiday exclusion.
- 🔑 **PIN Management & Submission Unlocks:** 1-click passcode reset for members and submission unlock overrides for corrections.

---

## 🔒 Security Architecture

- **Strict Supabase Row-Level Security (RLS):** Insecure public `anon` policies are completely removed. Database operations are strictly mediated by Next.js Server Actions using the `SUPABASE_SERVICE_ROLE_KEY`.
- **HTTP-Only Cookie Sessions:** Auth tokens are stored in secure, `httpOnly`, `sameSite: 'lax'` cookies rather than vulnerable `localStorage`/`sessionStorage`.
- **Authorization Gates:** All administrative and member mutations enforce backend gate checks (`requireAdminAuth()` and `requireMemberAuth(memberId)`).
- **Constant-Time Passcode Check:** Constant-time buffer comparisons (`crypto.timingSafeEqual`) prevent timing attack exploits.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL with RLS)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Visualizations:** [Recharts](https://recharts.org/)
- **Testing:** [Vitest](https://vitest.dev/)
- **Package Manager:** `pnpm`

---

## 🚀 Quickstart & Setup

### 1. Clone & Install

```bash
git clone https://github.com/youxufkhan/scrumtool.git
cd scrumtool
pnpm install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_service_role_key

# Admin & Session Security
ADMIN_PASSCODE=1234
ADMIN_JWT_SECRET=your_long_random_salt_secret
```

### 3. Database Migration

Run the SQL script located in [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor.

### 4. Run Locally

```bash
pnpm dev
```

- **Standup App:** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🧪 Testing

The codebase includes an extensive Vitest test suite covering action authorization, passcode hashing, leave calculations, and missing hours compliance checks:

```bash
pnpm test
```

---

## 🤖 AI Agent Guidelines

For AI agents working on this repository, consult [`AGENTS.md`](AGENTS.md) for architectural invariants, God node abstractions, and coding standards.
