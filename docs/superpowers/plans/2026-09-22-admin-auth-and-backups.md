# Admin Authentication & Database Backups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Admin authentication system to use standard member login via an `is_admin` database column, and add a manual database backup export feature.

**Architecture:** We will add `is_admin` to the Supabase schema and mockStore. `requireAdminAuth()` will be refactored to check the current member's session and their `is_admin` flag. A new server action `exportDatabaseBackup()` will fetch all data from all tables. The UI will be updated to reflect these changes.

**Tech Stack:** Next.js (App Router), Server Actions, Supabase, Vitest, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-22-admin-auth-and-backups-design.md`

## Global Constraints

- NEVER set global `loading = true` during background task updates.
- Always use `pnpm` for package management.
- All database operations are mediated securely via Next.js Server Actions using the Service Role.
- All tests must pass: `pnpm test`.

---

### Task 1: Update Database Schema and Types

**Files:**
- Create: `supabase/migrations/20260922000000_add_admin_flag.sql`
- Modify: `src/types/database.ts:6-16`
- Modify: `supabase/schema.sql:5-15`
- Modify: `src/lib/db.ts:35-45`

**Interfaces:**
- Produces: Updates `Member` interface with `is_admin: boolean;`.

- [ ] **Step 1: Write the Supabase migration file**

```sql
-- supabase/migrations/20260922000000_add_admin_flag.sql
ALTER TABLE members ADD COLUMN is_admin BOOLEAN DEFAULT false;
```

- [ ] **Step 2: Update `schema.sql`**
Modify `supabase/schema.sql` to add the column so new environments match. Add `is_admin BOOLEAN DEFAULT false,` below `avatar_color TEXT DEFAULT '#3B82F6',` in the `members` table definition.

- [ ] **Step 3: Update `src/types/database.ts`**
Add `is_admin: boolean;` to the `Member` interface definition.

```typescript
export interface Member {
  id: string;
  name: string;
  role: string;
  avatar_color: string;
  is_admin: boolean;
  is_active: boolean;
  has_custom_passcode?: boolean;
  passcode_hash?: string;
  joined_at: string;
  created_at: string;
}
```

- [ ] **Step 4: Update Mock Store (`src/lib/db.ts`)**
Update `InMemoryStore.members` array to include `is_admin`. Set `is_admin: true` for "Alex Rivera" (m-1) and `false` for the rest.

- [ ] **Step 5: Run tests to verify typings pass**

Run: `pnpm test tests/actions/standupActions.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/ src/types/database.ts supabase/schema.sql src/lib/db.ts
git commit -m "feat: add is_admin flag to database schema and types"
```

---

### Task 2: Refactor Admin Authentication Actions

**Files:**
- Modify: `src/app/actions/adminActions.ts`

**Interfaces:**
- Consumes: `Member` interface, `getMemberAuthFromCookies()`, `verifyMemberSession()`
- Produces: Updated `requireAdminAuth()`, removed `verifyAdminPasscode`, removed `adminLogout`.

- [ ] **Step 1: Refactor `requireAdminAuth` in `src/app/actions/adminActions.ts`**
Replace the old `crypto` and `ADMIN_PASSCODE` based logic. Use the member auth utilities.

```typescript
// Add these imports at the top
import { getMemberAuthFromCookies } from '@/lib/authUtils';
import { verifyMemberSession } from './standupActions';
import { getServerSupabaseClient, mockStore } from '@/lib/db';

export async function requireAdminAuth(): Promise<boolean> {
  const auth = await getMemberAuthFromCookies();
  if (!auth.memberId || !auth.token) return false;

  const isValidSession = await verifyMemberSession(auth.memberId, auth.token);
  if (!isValidSession) return false;

  const db = getServerSupabaseClient();
  if (db) {
    const { data } = await db.from('members').select('is_admin').eq('id', auth.memberId).single();
    return data?.is_admin === true;
  } else {
    const member = mockStore.members.find(m => m.id === auth.memberId);
    return member?.is_admin === true;
  }
}
```

- [ ] **Step 2: Remove obsolete code**
Delete `verifyAdminPasscode` and `adminLogout` functions entirely. Delete `ADMIN_PASSCODE` environment variable reference.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/adminActions.ts
git commit -m "refactor: update requireAdminAuth to use member is_admin flag"
```

---

### Task 3: Fix Admin Action Tests

**Files:**
- Modify: `tests/actions/adminActions.test.ts`

**Interfaces:**
- Consumes: `adminActions.ts`

- [ ] **Step 1: Update `adminActions.test.ts` imports and setup**
Remove `verifyAdminPasscode` and `adminLogout` from imports. Import `verifyMemberPasscode` instead.

- [ ] **Step 2: Rewrite auth test**
Replace `it('validates admin passcode correctly and sets session cookie')` and `it('rejects unauthenticated requests to admin actions')` with a test that logs in as Alex Rivera (m-1, who is an admin in mockStore) and verifies access.

```typescript
  it('grants admin access to members with is_admin flag', async () => {
    // No login performed
    await expect(getAdminDailyStandup('2026-08-24')).rejects.toThrow('UNAUTHORIZED');

    // Login as admin member (Alex Rivera, m-1)
    const loginRes = await verifyMemberPasscode('m-1', '1234');
    expect(loginRes.success).toBe(true);

    // Should now succeed
    const addMemRes = await addMember('New Admin Member', 'Engineer');
    expect(addMemRes.success).toBe(true);
  });
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `pnpm test tests/actions/adminActions.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add tests/actions/adminActions.test.ts
git commit -m "test: update admin auth tests for is_admin flag"
```

---

### Task 4: Create Database Backup Server Action

**Files:**
- Modify: `src/app/actions/adminActions.ts`

**Interfaces:**
- Produces: `exportDatabaseBackup()` returning `ActionResult<any>`

- [ ] **Step 1: Implement `exportDatabaseBackup`**
Add the following to the bottom of `adminActions.ts`.

```typescript
export async function exportDatabaseBackup(): Promise<ActionResult<any>> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED' };
  }

  const db = getServerSupabaseClient();
  if (db) {
    try {
      const [members, projects, submissions, tasks, holidays] = await Promise.all([
        db.from('members').select('*'),
        db.from('projects').select('*'),
        db.from('daily_submissions').select('*'),
        db.from('daily_tasks').select('*'),
        db.from('holidays').select('*'),
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        data: {
          members: members.data || [],
          projects: projects.data || [],
          daily_submissions: submissions.data || [],
          daily_tasks: tasks.data || [],
          holidays: holidays.data || [],
        }
      };
      
      return { success: true, data: backup };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  } else {
    // mockStore export for testing
    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        data: {
          members: mockStore.members,
          projects: mockStore.projects,
          daily_submissions: mockStore.submissions,
          daily_tasks: mockStore.tasks,
          holidays: mockStore.holidays,
        }
      }
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/adminActions.ts
git commit -m "feat: add exportDatabaseBackup server action"
```

---

### Task 5: Refactor UI Layouts for Admin Access

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/app/admin/page.tsx`
- Delete: `src/components/admin/AdminAuthModal.tsx`

**Interfaces:**
- Consumes: `requireAdminAuth()` through `checkInitialAdminAuth()`

- [ ] **Step 1: Conditionally render Admin link in `Header.tsx`**
Update the `<Link href="/admin">` to only render if `currentMember?.is_admin` is true.

```tsx
          {currentMember?.is_admin && (
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
              title="Admin Dashboard"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}
```

- [ ] **Step 2: Update `src/app/admin/page.tsx`**
- Remove `AdminAuthModal` import.
- Remove `adminLogout` import.
- Find `if (!isAuthenticated) { return <AdminAuthModal ... /> }` and replace it with `<div className="flex h-screen items-center justify-center text-slate-500">Access Denied. You must be an administrator to view this page.</div>`.
- Remove the "LogOut" button in the `<header>` block of the AdminPage entirely.

- [ ] **Step 3: Delete the modal file**
Delete `src/components/admin/AdminAuthModal.tsx`.

- [ ] **Step 4: Commit**

```bash
git rm src/components/admin/AdminAuthModal.tsx
git add src/components/Header.tsx src/app/admin/page.tsx
git commit -m "refactor: integrate new admin auth flow into UI"
```

---

### Task 6: Add Backup UI to Admin Dashboard

**Files:**
- Modify: `src/components/admin/HolidayAndTeamManager.tsx`

**Interfaces:**
- Consumes: `exportDatabaseBackup()`

- [ ] **Step 1: Update tabs**
Add `| 'database'` to `activeTab` state type.

- [ ] **Step 2: Import server action**
Add `exportDatabaseBackup` to the imports from `@/app/actions/adminActions`.

- [ ] **Step 3: Add backup function**
Inside the component, add this function:

```tsx
  const handleDownloadBackup = async () => {
    try {
      const res = await exportDatabaseBackup();
      if (res.success && res.data) {
        const json = JSON.stringify(res.data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scrumtool_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Backup downloaded successfully!');
      } else {
        alert('Backup failed: ' + (res.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Backup error');
    }
  };
```

- [ ] **Step 4: Add tab button and content**
Add a new `<button>` in the tab sub-nav for "Database".

```tsx
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'database'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" /> Database
          </button>
```

Add the view logic at the bottom:

```tsx
      {activeTab === 'database' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Database Backup</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Export all data from the database into a secure JSON file. You can use this file for disaster recovery or migrations.
          </p>
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Download Full Backup
          </button>
        </div>
      )}
```

- [ ] **Step 5: Build to ensure no type errors**

Run: `pnpm build`
Expected: Success

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/HolidayAndTeamManager.tsx
git commit -m "feat: add database backup download ui"
```
