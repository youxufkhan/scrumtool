# 🚀 ScrumTool

> **Zero-Friction Daily Standups & Task Hours Tracker** for fast-moving agile teams.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://scrumtool-tawny.vercel.app)

---

## ✨ Features

- ⚡ **Zero-Friction Identity:** 1-click name selector remembered in browser `localStorage`. No passwords to forget.
- 🌅 **Morning Standup (< 30 seconds):** Rapid keyboard-friendly task input (press `Enter` to add consecutive tasks) + 1-click *"Copy Unfinished Tasks from Yesterday"*.
- 🌇 **Evening Standup (< 1 minute):** Status toggles (`Done`, `In Progress`, `Blocked`), decimal hours (`0.5`, `1.25`, `0`), `+ Add Ad-hoc Task`, and a **"Submit & Lock"** button.
- 🛡️ **Missing Hours Compliance Gate:** Prevents participating in today's standup if past working days have unentered hours (skipping weekends & holidays) until resolved.
- 🔒 **Immutable Timesheets:** Once submitted, entries are locked to ensure accurate data integrity (with admin unlock override).
- 📊 **Admin Dashboard & Analytics (`/admin`):**
  - Daily team standup board with 1-click **"Copy for Slack / Teams"** markdown generator.
  - Interactive Recharts charts for member hours, project allocation donut chart, and daily planned vs. ad-hoc trends.
  - **Sanitized CSV Timesheet Export** with formula injection protection.
  - Official holiday & team member manager.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Testing:** [Vitest](https://vitest.dev/)
- **Package Manager:** `pnpm`

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/youxufkhan/scrumtool.git
cd scrumtool
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_PASSCODE=1234
ADMIN_JWT_SECRET=your_admin_secret_key
```

### 3. Run Database Migrations

Apply `supabase/schema.sql` to your Supabase SQL editor.

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the member standup view, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin console.

---

## 🧪 Running Tests

```bash
pnpm test
```
