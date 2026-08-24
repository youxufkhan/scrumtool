# Technical Design Specification: ScrumTool (Zero-Friction Daily Standup & Hours Tracker)

**Date:** 2026-08-24  
**Status:** Approved for Implementation Planning  
**Target Platform:** Web (Desktop & Mobile Responsive)  
**Hosting & Database:** Vercel (Free Tier / `*.vercel.app`) + Supabase PostgreSQL (Free Tier)

---

## 1. Overview & Objectives

ScrumTool is an ultra-lightweight, frictionless web application designed to solve daily standup and timesheet overhead for agile teams. 

### Core Goals:
1. **Zero-Friction Member Experience:** Team members can log planned tasks at the start of the day in under 30 seconds, and log hours worked against those tasks at the end of the day in under 1 minute.
2. **Persistent Device Memory:** No cumbersome login credentials or passwords for members; selecting a member name persists across browser sessions in `localStorage`.
3. **Comprehensive Admin Dashboard:** Password-protected management dashboard with daily standup team board, Slack/Teams copy formatting, visual project/member hour analytics, CSV export, and holiday management.
4. **Smart Calendar Awareness:** Automatic weekend exclusion and admin-defined holiday exceptions so team members aren't falsely flagged for missing standups.
5. **100% Free Hosting & Domain:** Production-ready stack deployable on Vercel with automatic `*.vercel.app` domain and Supabase free-tier database.

---

## 2. User Experience & Workflows

### 2.1 Team Member Workflow

```
[Start of Day] 
  → Open App (Auto-loads member from localStorage)
  → GATE CHECK: Are there any past working days with unsubmitted hours?
      ├── YES → Display "Pending Hours Required" blocker screen:
      │         Must log hours (0, 0.5, etc.) for all past unfinished dates first.
      │         Once submitted, unlocked for Today.
      └── NO  → Proceed to Today's Standup.
  → Today's Standup Screen:
      - Option: "📋 Copy Unfinished Tasks from Yesterday" (if any)
      - Rapid Task Entry: Type Title + Select Project + Status (Planned/In Progress)
      - Press Enter to quickly add multiple tasks.
      - Tasks saved with initial pending hours.

[End of Day]
  → Open App (Today's tasks displayed)
  → Toggle Status per task: [Done], [In Progress], [Blocked] (with optional blocker note)
  → Enter Hours worked (supports decimals like 0.5, 1.25, and 0 for tasks not worked on)
  → Option: Click "+ Add Ad-hoc Task" for unplanned work handled during the day
  → Live Total Hours counter displays sum (e.g. "Total: 7.5 hrs")
  → Click "Submit & Lock Day's Hours"
      └── Once submitted, the day is permanently LOCKED for the member (read-only).
```

### 2.2 Admin / Lead Workflow

```
[Access]
  → Navigate to `/admin` → Enter Admin PIN / Passcode (stored in ENV)
  
[Daily Standup View]
  → Select Date (defaults to today)
  → View team summary cards:
      - Who submitted standup vs. who is pending vs. who has locked hours
      - Highlight members blocked due to past missing hours
      - Tasks list per member with status badges & hours
      - Highlight Blocked tasks in warning amber/red
      - "Copy for Slack / Teams" button (generates formatted markdown standup text)
      - Admin override: Option to unlock an accidental submission if needed
      
[Analytics & Reports View]
  → Date Range Filter (Today, This Week, This Month, Custom Date Range)
  → Total Team Hours KPI, Average Hours/Day, Ad-hoc vs. Planned Work ratio
  → Member Hours Bar Chart & Breakdown Table
  → Project Allocation Donut/Pie Chart & Breakdown Table
  → Download Timesheet CSV button

[Admin Settings]
  → Manage Team Members (Add, Edit, Activate/Deactivate)
  → Manage Projects (Add, Edit, Assign Colors)
  → Manage Holidays (Add custom holidays / company off days)
```

---

## 3. Architecture & Tech Stack

```
+-------------------------------------------------------------------+
|                        Next.js 14+ (App Router)                   |
|                                                                   |
|   +--------------------------+    +---------------------------+   |
|   |  Team Member App (/)     |    |  Admin Dashboard (/admin) |   |
|   |  - Hours Gate Blocker    |    |  - Standup Team Board     |   |
|   |  - Fast task entry       |    |  - Recharts Visualizations|   |
|   |  - Decimal hours logger  |    |  - CSV Timesheet Exporter |   |
|   |  - Submission locking    |    |  - Admin Unlock Override  |   |
|   |  - Ad-hoc task creator   |    |  - Holiday & Member Admin |   |
|   +--------------------------+    +---------------------------+   |
|                                                                   |
|   +-----------------------------------------------------------+   |
|   |                   Server Actions & API                    |   |
|   |  - standupActions.ts (CRUD tasks, gate check, lock day)   |   |
|   |  - adminActions.ts (aggregate standups, analytics, CSV)   |   |
|   |  - holidayActions.ts (manage holidays, weekend check)     |   |
|   +-----------------------------------------------------------+   |
+---------------------------------+---------------------------------+
                                  |
                                  v
                    +---------------------------+
                    |    Supabase PostgreSQL    |
                    |    (Hosted on AWS/GCP)    |
                    +---------------------------+
```

### Tech Stack Components:
- **Framework:** Next.js 14+ (TypeScript, React 18, App Router)
- **Styling:** Tailwind CSS + Radix UI primitives + Lucide React Icons
- **Charts:** Recharts for Admin Analytics
- **Database:** Supabase PostgreSQL with `@supabase/supabase-js`
- **Hosting:** Vercel (Automatic SSL, Edge CDN, Serverless API, `*.vercel.app` domain)

---

## 4. Database Schema

```sql
-- 1. Team Members
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'Member',
    avatar_color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Projects / Categories
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366F1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Daily Submissions (tracks whether a day's hours have been finalized & locked)
CREATE TABLE daily_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(member_id, date)
);

-- 4. Daily Tasks
CREATE TABLE daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    title TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'done', 'blocked')) DEFAULT 'in_progress',
    hours_spent NUMERIC(4, 2), -- NULL until entered in evening; 0.00 is valid (did not work on task)
    blocker_note TEXT,
    is_ad_hoc BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Holidays & Calendar Exceptions
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for optimal performance
CREATE INDEX idx_daily_tasks_member_date ON daily_tasks(member_id, date);
CREATE INDEX idx_daily_tasks_date ON daily_tasks(date);
CREATE INDEX idx_daily_tasks_project ON daily_tasks(project_id);
CREATE INDEX idx_daily_submissions_member_date ON daily_submissions(member_id, date);
CREATE INDEX idx_holidays_date ON holidays(date);
```

---

## 5. Key Logic & Business Rules

### 5.1 Missing Hours Gate & Standup Eligibility
- **Eligibility Rule:** A team member cannot create or edit tasks for today if there is any past working day where tasks were created but `daily_submissions.is_locked = false` (or tasks have unentered hours).
- **Non-Working Days Excluded:** Weekends (Saturday & Sunday) and dates listed in `holidays` table are automatically skipped during the missing hours check.
- **Resolution UX:** When blocked, the app immediately displays a clean, focused **"Outstanding Timesheets"** panel showing the exact past dates needing hours. The user enters their hours (or `0` if not worked on) for each task, clicks "Submit & Lock", and is immediately returned to today's standup.

### 5.2 Decimal Hours & 0-Hour Support
- `hours_spent` accepts standard floats (e.g. `0.25`, `0.5`, `1.5`, `4`, `0`).
- `0` hours represents a valid entry (meaning the task was planned but not worked on that day).
- Live validation prevents negative numbers.

### 5.3 Post-Submission Immutability (Locking)
- Clicking "Submit & Lock Hours" sets `daily_submissions.is_locked = true` and records `submitted_at = now()`.
- Once locked, the member UI switches to a clean read-only summary card with a green "🔒 Hours Submitted & Locked" badge.
- Only Admin has an override button to unlock a day in case an employee made a genuine mistake and requested a correction.

---

## 6. Gap Analysis, Security & Anti-Exploit Measures

### 6.1 Idempotency Mechanisms
1. **Deterministic Client UUIDs for Tasks:**
   - The client generates unique UUIDv4s for newly created tasks before sending them to the server.
   - If a network glitch or rapid double-clicking sends duplicate requests, the server performs an **UPSERT on `id`** rather than a naive `INSERT`. This mathematically guarantees no duplicate task creation.
2. **Atomic Daily Submissions:**
   - Submitting hours uses an `UPSERT` on `daily_submissions (member_id, date)` within a single database transaction.
   - If a user triggers "Submit & Lock" repeatedly, the subsequent calls return the already-locked state cleanly without duplicate side-effects.
3. **Carry-Forward Idempotency:**
   - `carryForwardUnfinishedTasks` checks whether previous unfinished tasks have already been copied to today before inserting, preventing duplicated task lists on double-click.

---

### 6.2 Anti-Exploit & Tamper Protections

| Threat / Exploit Vector | Potential Risk | Server-Side Enforcement & Prevention |
|---|---|---|
| **Gate Bypass via Direct API Call** | User bypasses UI to create today's tasks without logging past hours. | **Server-Side Gate Check:** `saveDailyTasks` queries `daily_submissions` and `daily_tasks` for past working days. If any past date is unsubmitted, server rejects with `403 FORBIDDEN_UNSUBMITTED_HOURS`. |
| **Tampering with Locked Submissions** | User calls update endpoint to change tasks on a locked past day. | **Server-Side Immutability:** `saveDailyTasks` verifies `daily_submissions.is_locked = false`. If locked, all mutations are rejected with `403 SUBMISSION_LOCKED`. |
| **Admin Privilege Escalation / Timing Attack** | Attacker brute-forces admin passcode or alters client role. | **Signed HttpOnly Cookies & Constant-Time Check:** Admin session is issued via an HMAC-signed HttpOnly cookie. Passcode verification uses `crypto.timingSafeEqual` to prevent timing side-channel attacks. |
| **CSV Formula Injection** | Attacker enters `=CMD|' /C calc'!A0` or `=SUM(...)` in task title to exploit Admin spreadsheet. | **CSV Sanitization:** Any field starting with `=`, `+`, `-`, `@`, `\t`, `\r` is escaped with a leading single quote `'` during CSV generation. |
| **Excessive / Invalid Hours Injection** | Negative hours or 9999 hours entered to distort reporting. | **Range Constraints:** Server strictly enforces `0.00 <= hours_spent <= 24.00` per task and total daily hours `<= 24.00`. |
| **XSS / HTML Script Injection** | Malicious script payload in task titles or blocker notes. | React auto-escaping on render + DOMPurify / text sanitization before Slack/Teams markdown export. |
| **Colleague Standup Overwrite** | Malicious or accidental editing of another member's standup. | Lightweight device token / member secret stored in `localStorage` validated against the database on each submission. |

---

### 6.3 Critical Business Edge Cases Resolved

1. **New Team Members (Joined Date):**
   - The missing hours gate only scans working days **on or after the member's `joined_at` date**. A new hire joining on Wednesday is never blocked by Monday/Tuesday standups from before they joined.
2. **Member Sick Leave / PTO / Vacation:**
   - Members or Admin can mark a specific date as **"On Leave / PTO"**.
   - PTO days require 0 tasks and 0 hours, and are automatically marked as satisfied/locked so the member is not blocked when returning from vacation.
3. **Timezone & Midnight Boundaries:**
   - Dates are explicitly calculated and transmitted using the member's local browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone` formatted as `YYYY-MM-DD`).
   - Prevents UTC mismatch where a standup logged at 11:30 PM is assigned to the wrong day.
4. **Future Date Prevention:**
   - Server blocks creating tasks for dates further than 1 day in the future to prevent timesheet falsification.

---

## 7. Configuration & Environment Variables

- **Environment Variables (`.env.local` / Vercel):**
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon key.
  - `SUPABASE_SERVICE_ROLE_KEY`: Supabase server-side service role key.
  - `ADMIN_PASSCODE`: 4-8 digit passcode to access `/admin`.
  - `ADMIN_JWT_SECRET`: Random 32+ char secret for signing Admin session cookies.
- **Local Fallback Mode:** In-memory / local JSON store fallback enabled automatically when Supabase environment variables are omitted, enabling instant zero-config testing.

---

## 8. Verification & Testing Plan

1. **Automated Unit & Invariant Tests:**
   - **Idempotency Test:** Execute duplicate task batch creation with identical IDs; assert single record in database.
   - **Gate Enforcement Test:** Attempt to call `saveDailyTasks(today)` when yesterday has unsubmitted hours; assert `403 Forbidden`.
   - **Immutability Test:** Attempt to modify tasks on a locked day; assert `403 Submission Locked`.
   - **CSV Sanitization Test:** Assert leading formula characters (`=`, `+`, `-`, `@`) are safely escaped.
   - **Hours Boundary Test:** Assert negative hours (`-2`) and excessive hours (`> 24`) are rejected.
   - **New Hire Gate Test:** Assert dates prior to `joined_at` are ignored by the gate check.
2. **Manual End-to-End Verification:**
   - Test morning task logging flow (fast keyboard navigation).
   - Test evening hours submission & instant UI lock.
   - Test blocked screen appearance when simulating an unsubmitted previous day.
   - Test admin analytics graphs, CSV download, and holiday management.
   - Verify zero build/lint errors via `npm run build`.
