# ScrumTool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-friction daily standup and task hours tracking web application with morning task entry, evening hours logging, missing hours gating, admin analytics, and free Vercel + Supabase hosting.

**Architecture:** Full-stack Next.js 14+ (App Router) with TypeScript, Tailwind CSS, Server Actions, Supabase PostgreSQL with local in-memory fallback, Recharts analytics, and signed HttpOnly cookies for admin security.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, @supabase/supabase-js, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-24-scrumtool-standup-tracker-design.md`

## Global Constraints
- Node.js >= 18.x
- Zero required paid tiers (100% free Vercel hosting + Supabase free tier)
- Strict server-side enforcement of missing hours gate, day immutability lock, and hours bounds (0.00 to 24.00)
- Client UUIDv4 generation for idempotent task operations
- Weekend (Sat/Sun) and Admin Holidays automatically excluded from standup enforcement
- Sanitization on CSV exports against spreadsheet formula injection

---

### Task 1: Project Scaffolding, Dependencies & Testing Harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `next.config.js`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

**Interfaces:**
- Produces: Runnable Next.js project with Tailwind CSS and Vitest test runner.

- [ ] **Step 1: Create `package.json` with required scripts and dependencies**

```json
{
  "name": "scrumtool",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.435.0",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.js`, and `vitest.config.ts`**

- [ ] **Step 3: Create base layout in `src/app/layout.tsx` and styles in `src/app/globals.css`**

- [ ] **Step 4: Install dependencies using `npm install`**

- [ ] **Step 5: Verify build with `npm run test` and `npm run build`**

- [ ] **Step 6: Commit**
```bash
git add package.json tsconfig.json tailwind.config.ts postcss.config.js next.config.js vitest.config.ts src/
git commit -m "chore: scaffold Next.js project with Tailwind, TypeScript, and Vitest"
```

---

### Task 2: Supabase Schema, Database Types & Adapter with Local Fallback

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/types/database.ts`
- Create: `src/lib/db.ts`
- Test: `tests/lib/db.test.ts`

**Interfaces:**
- Produces: `Member`, `Project`, `DailyTask`, `DailySubmission`, `Holiday` types; `getDbClient()` returning Supabase client or Local Mock store.

- [ ] **Step 1: Write `supabase/schema.sql` with complete DDL, constraints, triggers, and sample seed data**

- [ ] **Step 2: Define TypeScript interfaces in `src/types/database.ts`**

- [ ] **Step 3: Create `src/lib/db.ts` with local fallback support when `NEXT_PUBLIC_SUPABASE_URL` is unset**

- [ ] **Step 4: Write unit test in `tests/lib/db.test.ts` to verify local fallback repository CRUD**

- [ ] **Step 5: Run tests and verify passing**
Run: `npx vitest run tests/lib/db.test.ts`

- [ ] **Step 6: Commit**
```bash
git add supabase/schema.sql src/types/database.ts src/lib/db.ts tests/lib/db.test.ts
git commit -m "feat(db): add schema DDL, database types, and client with local fallback"
```

---

### Task 3: Core Domain Utilities (Date Logic, Weekend/Holiday Detection, CSV & Slack Formatter)

**Files:**
- Create: `src/lib/dateUtils.ts`
- Create: `src/lib/csvUtils.ts`
- Create: `src/lib/slackUtils.ts`
- Test: `tests/lib/dateUtils.test.ts`
- Test: `tests/lib/csvUtils.test.ts`
- Test: `tests/lib/slackUtils.test.ts`

**Interfaces:**
- Produces:
  - `isWeekend(date: Date | string): boolean`
  - `formatDateIso(date: Date): string`
  - `getPriorWorkingDay(date: string, holidays: string[]): string`
  - `escapeCsvField(val: string): string`
  - `generateStandupCsv(rows: CsvTaskRow[]): string`
  - `formatSlackStandup(date: string, membersData: StandupMemberSummary[]): string`

- [ ] **Step 1: Write failing tests for dateUtils, csvUtils (including formula injection protection), and slackUtils**

- [ ] **Step 2: Run tests to confirm failures**
Run: `npx vitest run tests/lib/`

- [ ] **Step 3: Implement `src/lib/dateUtils.ts`, `src/lib/csvUtils.ts`, and `src/lib/slackUtils.ts`**

- [ ] **Step 4: Run tests to confirm all pass**
Run: `npx vitest run tests/lib/`

- [ ] **Step 5: Commit**
```bash
git add src/lib/ tests/lib/
git commit -m "feat(utils): add date calculation, weekend detection, CSV sanitization, and Slack formatter"
```

---

### Task 4: Server Actions & Security Gate Layer

**Files:**
- Create: `src/app/actions/standupActions.ts`
- Create: `src/app/actions/adminActions.ts`
- Test: `tests/actions/standupActions.test.ts`
- Test: `tests/actions/adminActions.test.ts`

**Interfaces:**
- Produces:
  - `checkMemberGate(memberId: string, clientToday: string)`: returns `{ isBlocked: boolean, pendingDates: string[] }`
  - `getDailyTasks(memberId: string, date: string)`: returns `{ tasks: DailyTask[], isLocked: boolean }`
  - `saveDailyTasks(memberId: string, date: string, tasks: Partial<DailyTask>[])`: creates/updates tasks with server-side gate & lock enforcement
  - `submitAndLockDay(memberId: string, date: string, tasks: Partial<DailyTask>[])`: locks day with validation
  - `carryForwardYesterdayTasks(memberId: string, todayDate: string)`: idempotent carry forward
  - `verifyAdminPasscode(passcode: string)`: constant-time validation & session cookie
  - `getAdminStandupReport(date: string)`
  - `getAdminAnalytics(startDate: string, endDate: string)`
  - `unlockSubmission(memberId: string, date: string)`

- [ ] **Step 1: Write tests for gate check, idempotency, hour range validation, and locked immutability**

- [ ] **Step 2: Run tests to verify failure**

- [ ] **Step 3: Implement `src/app/actions/standupActions.ts` and `src/app/actions/adminActions.ts`**

- [ ] **Step 4: Run tests to verify pass**
Run: `npx vitest run tests/actions/`

- [ ] **Step 5: Commit**
```bash
git add src/app/actions/ tests/actions/
git commit -m "feat(actions): implement standup CRUD, gate validation, idempotency, and admin actions"
```

---

### Task 5: Zero-Friction Team Member UI Components

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/MemberSelector.tsx`
- Create: `src/components/MissingHoursGateCard.tsx`
- Create: `src/components/DailyStandupLogger.tsx`
- Create: `src/components/LockedStandupCard.tsx`
- Create: `src/app/page.tsx`

**Interfaces:**
- Consumes: `standupActions.ts`, `dateUtils.ts`
- Produces: Responsive, keyboard-accessible Member Standup page with instant local session persistence and auto-recovery.

- [ ] **Step 1: Create `src/components/Header.tsx` and `src/components/MemberSelector.tsx`**

- [ ] **Step 2: Create `src/components/MissingHoursGateCard.tsx` (blocks today's standup until past dates are resolved)**

- [ ] **Step 3: Create `src/components/DailyStandupLogger.tsx` (supports enter-to-add, project pills, status toggles, ad-hoc tasks, float hours, live total)**

- [ ] **Step 4: Create `src/components/LockedStandupCard.tsx` (clean read-only locked view)**

- [ ] **Step 5: Assemble `src/app/page.tsx`**

- [ ] **Step 6: Verify component rendering and test member interaction flow**

- [ ] **Step 7: Commit**
```bash
git add src/components/ src/app/page.tsx
git commit -m "feat(ui): implement member logger, missing hours gate, and locked standup components"
```

---

### Task 6: Admin Analytics Dashboard, Standup Board & Management

**Files:**
- Create: `src/components/admin/AdminAuthModal.tsx`
- Create: `src/components/admin/AdminDailyBoard.tsx`
- Create: `src/components/admin/AdminAnalyticsView.tsx`
- Create: `src/components/admin/HolidayAndTeamManager.tsx`
- Create: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `adminActions.ts`, `slackUtils.ts`, `csvUtils.ts`
- Produces: Protected Admin page with daily team standup view, Recharts visualizations, CSV export, Slack markdown copy, and holiday/member management.

- [ ] **Step 1: Create `src/components/admin/AdminAuthModal.tsx`**

- [ ] **Step 2: Create `src/components/admin/AdminDailyBoard.tsx` with 1-click Slack/Teams copy and unlock override**

- [ ] **Step 3: Create `src/components/admin/AdminAnalyticsView.tsx` with member & project charts and CSV download**

- [ ] **Step 4: Create `src/components/admin/HolidayAndTeamManager.tsx` (holiday calendar + member/project management)**

- [ ] **Step 5: Assemble `src/app/admin/page.tsx`**

- [ ] **Step 6: Commit**
```bash
git add src/components/admin/ src/app/admin/
git commit -m "feat(admin): build admin standup board, charts analytics, CSV exporter, and holiday manager"
```

---

### Task 7: Full System Verification, Polishing & Vercel Deployment Documentation

**Files:**
- Create: `docs/DEPLOYMENT.md`
- Create: `.env.example`
- Test: Full integration test suite

- [ ] **Step 1: Create `.env.example` and `docs/DEPLOYMENT.md` with step-by-step Supabase & Vercel instructions**

- [ ] **Step 2: Run full test suite**
Run: `npm run test`

- [ ] **Step 3: Run production build verification**
Run: `npm run build`

- [ ] **Step 4: Commit**
```bash
git add docs/DEPLOYMENT.md .env.example
git commit -m "docs: add Vercel and Supabase deployment guide and environment sample"
```
