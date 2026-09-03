# AGENTS.md — AI Agent Guidelines & Context for ScrumTool

Welcome to **ScrumTool** (`youxufkhan/scrumtool`). This document provides comprehensive context, architectural invariants, security rules, and development guidelines for AI agents and human contributors working on this codebase.

---

## 1. Project Overview & Mission

**ScrumTool** is a zero-friction daily standup, sprint tracking, and automated timesheet application designed for engineering teams.
- **Production URL**: [scrum.yousufkhan.uk](https://scrum.yousufkhan.uk) (Vercel: `scrumtool-tawny.vercel.app`)
- **Repository**: `https://github.com/youxufkhan/scrumtool` (`main` branch)
- **Tech Stack**: Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS, Supabase (PostgreSQL), Vitest.

---

## 2. Strict Operational Rules

1. **Package Manager**: **ALWAYS use `pnpm`**. Never use `npm`, `npx`, or `yarn`.
2. **Quality Verification Gate**:
   - Run tests: `pnpm test` (all 31+ unit tests across 6 test suites must pass).
   - Verify build: `pnpm build` (must compile and generate static/server pages with 0 errors).
3. **Commit & Deploy Discipline**:
   - Git commits should follow Conventional Commits (`fix:`, `feat:`, `refactor:`, `test:`).
   - Pushes to `origin/main` automatically trigger production deployments on Vercel.

---

## 3. Core Architecture & Abstractions (God Nodes)

```
                       ┌────────────────────────┐
                       │  Client (Browser UI)   │
                       └───────────┬────────────┘
                                   │ HTTP-Only Cookies
                                   ▼
                       ┌────────────────────────┐
                       │ Next.js Server Actions │
                       │ (standupActions.ts &   │
                       │   adminActions.ts)     │
                       └───────────┬────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────┐
   │ getServerSupabaseClient()               │      mockStore       │
   │ (Service Role Key)   │                  │ (In-Memory Fallback) │
   │ Bypasses RLS safely  │                  │ Zero-network tests   │
   └──────────┬───────────┘                  └──────────────────────┘
              ▼
   ┌──────────────────────┐
   │  Supabase Database   │
   │ (RLS Locked to Anon) │
   └──────────────────────┘
```

### Key Abstractions
1. **`getServerSupabaseClient()` (`src/lib/serverDb.ts`)**:
   - Primary database client for backend server actions.
   - Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass Row-Level Security (RLS) safely on the server.
   - Falls back gracefully to `mockStore` if Supabase environment variables are not configured.
2. **`mockStore` (`src/lib/db.ts`)**:
   - In-memory data store for isolated unit tests (`tests/actions/`) and zero-config local demos.
3. **`requireAdminAuth()` & `requireMemberAuth(memberId)`**:
   - Backend authorization gates that inspect HTTP-only session cookies before allowing mutations.
4. **`Member`, `Project`, `DailyTask`, `DailySubmission`, `Holiday` (`src/types/database.ts`)**:
   - Core relational data models.

---

## 4. Security & Authentication Architecture

### Supabase Row-Level Security (RLS)
- **Strict Database Lockdown**: Insecure public `anon` policies are removed from `supabase/schema.sql`.
- Direct anonymous REST access to tables (`members`, `projects`, `daily_submissions`, `daily_tasks`, `holidays`) is blocked.
- All database operations are mediated by Next.js Server Actions running in cloud environments with the Service Role key.

### Authentication Flows
- **Member Authentication**:
  - Authenticated via a 4-digit PIN (default `1234` on first login).
  - First login requires setting a custom 4-digit PIN.
  - Passcode is hashed using salted SHA-256 (`hashPasscode` in `src/lib/authUtils.ts`).
  - Session creates an HMAC token (`generateMemberSessionToken`) stored in `scrumtool_member_token` and `scrumtool_member_id` HTTP-only cookies.
  - Mutation endpoints (`saveDailyTasks`, `submitAndLockDay`, `markDayOnLeave`, `carryForwardYesterdayTasks`) enforce `requireMemberAuth(memberId)`.
- **Admin Authentication**:
  - Authenticated with `ADMIN_PASSCODE` (default `1234`).
  - Constant-time verification prevents timing attacks (`crypto.timingSafeEqual`).
  - Sets `scrumtool_admin_token` HTTP-only cookie.
  - Admin endpoints (`unlockSubmission`, `addMember`, `addProject`, `addHoliday`, `adminResetMemberPasscode`, `adminMarkMemberLeaveRange`, `exportAdminCsvData`) enforce `requireAdminAuth()`.
- **Cookie Utilities (`src/lib/authUtils.ts`)**:
  - Wraps Next.js `cookies()` with an in-memory `testCookieStore` fallback so Vitest unit tests execute seamlessly outside Next.js request contexts.

---

## 5. Domain Logic & Business Rules

1. **Daily Standup Lifecycle**:
   - **Morning**: Member enters planned tasks. Hours are left `null` (or `status = 'in_progress'`).
   - **Quick Carry-Forward**: "Copy Unfinished Tasks from Yesterday" (`carryForwardYesterdayTasks`) automatically pulls in uncompleted tasks from the prior working day.
   - **Evening**: Member enters decimal hours (`0` to `24`) spent on each task and clicks "Submit & Lock Day".
   - **Immutability Lock**: Once submitted (`is_locked = true` or `is_on_leave = true`), the day's tasks cannot be modified by members. Only an admin can unlock it (`unlockSubmission`) for corrections.
2. **Missing Hours Compliance Gate (`checkMemberGate`)**:
   - Scans up to 30 past calendar days for working days (excluding weekends and official holidays).
   - If any prior working day has tasks without entered hours or is unsubmitted, blocks today's standup until missing days are logged or marked as leave.
3. **Admin Leave Management (`adminMarkMemberLeaveRange`, `adminCancelMemberLeave`)**:
   - Automatically computes working days in a date range (skipping weekends and holidays).
   - Creates locked leave submissions exempting the member from compliance checks for those dates.
4. **Admin Timesheet & CSV Export**:
   - CSV generation is performed on the server via `exportAdminCsvData` to protect data integrity and avoid client-side database queries.

---

## 6. UI & Frontend Interaction Guidelines

1. **No Disruptive Full-Page Flickers**:
   - Never set global `loading = true` during background task updates or auto-saves.
   - `loadMemberDayData(isSilent)` accepts an `isSilent` boolean flag. Set `isSilent = true` for background synchronization.
   - `DailyStandupLogger` maintains local state and saves in the background without unmounting.
2. **Explicit Button Types**:
   - Always specify `type="button"` on non-submit buttons inside forms to prevent unexpected form submissions.
3. **Component Keying**:
   - Pass unique keys like `key={`${currentMember.id}-${currentDate}`}` to daily logger components to cleanly reset state only when the active member or date changes.

---

## 7. Environment Variables Reference

| Variable Name | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Build | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Secret | Privileged key (`sb_secret_...`) to bypass RLS in Server Actions |
| `ADMIN_PASSCODE` | Server Secret | Passcode to access `/admin` dashboard (default `1234`) |
| `ADMIN_JWT_SECRET` | Server Secret | Salt used for PIN hashing and HMAC session token signing |

---

## 8. Development & Testing Commands

```bash
# Install dependencies
pnpm install

# Run local development server
pnpm dev

# Run Vitest test suite
pnpm test

# Build production bundle
pnpm build
```
