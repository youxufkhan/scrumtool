# Member Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to create, manage, and track 30-60-90 day growth roadmaps for members, and allow members to view their active roadmap.

**Architecture:** A new `member_roadmaps` table in Supabase (and `mockStore`), managed via Server Actions in `roadmapActions.ts`. The Admin dashboard gets a modal to create and view histories. The member dashboard gets a toggle to view their current active roadmap.

**Tech Stack:** Next.js 14 App Router, Server Actions, Supabase, Tailwind CSS, Vitest.

**Spec:** docs/superpowers/specs/2026-09-23-member-roadmap-design.md

## Global Constraints

- NEVER set global `loading = true` during background task updates.
- Always use `pnpm` for package management.
- All database operations are mediated securely via Next.js Server Actions using the Service Role.
- All tests must pass: `pnpm test`.

---

### Task 1: Database Schema & Mock Store Updates

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `src/types/database.ts`
- Modify: `src/lib/db.ts`

**Interfaces:**
- Produces: `MemberRoadmap` type, `memberRoadmaps` array in `mockStore`.

- [ ] **Step 1: Add table to `supabase/schema.sql`**
Add this at the end of the file:
```sql
-- 6. Member Roadmaps
CREATE TABLE IF NOT EXISTS member_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    tech_skills_score INTEGER CHECK (tech_skills_score >= 1 AND tech_skills_score <= 5),
    soft_skills_score INTEGER CHECK (soft_skills_score >= 1 AND soft_skills_score <= 5),
    learning_score INTEGER CHECK (learning_score >= 1 AND learning_score <= 5),
    admin_notes TEXT,
    goals_30_days TEXT,
    goals_60_days TEXT,
    goals_90_days TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

- [ ] **Step 2: Update `src/types/database.ts`**
Add the `MemberRoadmap` interface and export it:
```typescript
export interface MemberRoadmap {
  id: string;
  member_id: string;
  title: string;
  tech_skills_score: number | null;
  soft_skills_score: number | null;
  learning_score: number | null;
  admin_notes: string | null;
  goals_30_days: string | null;
  goals_60_days: string | null;
  goals_90_days: string | null;
  is_active: boolean;
  created_at: string;
}
```

- [ ] **Step 3: Update `src/lib/db.ts` `mockStore`**
Add `memberRoadmaps: MemberRoadmap[];` to the `mockStore` interface, and initialize it with `memberRoadmaps: [],` in the `createMockStore` and `resetMockStore` functions. Also ensure it's in the initial store state object `const initialStore = { ... }`.

- [ ] **Step 4: Commit**
```bash
git add supabase/schema.sql src/types/database.ts src/lib/db.ts
git commit -m "feat: add member_roadmaps schema and types"
```

---

### Task 2: Implement Roadmap Server Actions

**Files:**
- Create: `src/app/actions/roadmapActions.ts`
- Create: `tests/actions/roadmapActions.test.ts`

**Interfaces:**
- Consumes: `MemberRoadmap` type, `mockStore`
- Produces: `saveMemberRoadmap`, `getMemberRoadmapHistory`, `getActiveRoadmap`

- [ ] **Step 1: Write failing tests in `tests/actions/roadmapActions.test.ts`**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { saveMemberRoadmap, getMemberRoadmapHistory, getActiveRoadmap } from '../../src/app/actions/roadmapActions';
import { mockStore, resetMockStore } from '../../src/lib/db';
import { verifyMemberPasscode, testCookieStore } from '../../src/lib/authUtils';

describe('Roadmap Actions', () => {
  beforeEach(() => {
    resetMockStore();
    testCookieStore.clear();
    mockStore.members.push(
      { id: 'admin-1', name: 'Admin', is_admin: true, is_active: true, passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50', has_custom_passcode: false, role: 'Admin', avatar_color: '#000', joined_at: '2025-01-01', created_at: '2025-01-01' },
      { id: 'member-1', name: 'Member', is_admin: false, is_active: true, passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50', has_custom_passcode: false, role: 'Eng', avatar_color: '#000', joined_at: '2025-01-01', created_at: '2025-01-01' }
    );
  });

  it('allows admin to save a roadmap and deactivates old ones', async () => {
    await verifyMemberPasscode('admin-1', '1234');
    
    await saveMemberRoadmap({
      member_id: 'member-1',
      title: 'V1',
      tech_skills_score: 5,
      soft_skills_score: 4,
      learning_score: 3,
      admin_notes: 'Notes',
      goals_30_days: '30',
      goals_60_days: '60',
      goals_90_days: '90'
    });
    
    const active1 = await getActiveRoadmap('member-1');
    expect(active1?.title).toBe('V1');
    expect(active1?.is_active).toBe(true);

    await saveMemberRoadmap({
      member_id: 'member-1',
      title: 'V2',
      tech_skills_score: 5,
      soft_skills_score: 4,
      learning_score: 3,
      admin_notes: 'Notes 2',
      goals_30_days: '30',
      goals_60_days: '60',
      goals_90_days: '90'
    });

    const history = await getMemberRoadmapHistory('member-1');
    expect(history.length).toBe(2);
    const active2 = await getActiveRoadmap('member-1');
    expect(active2?.title).toBe('V2');
    
    const v1 = history.find(r => r.title === 'V1');
    expect(v1?.is_active).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm test tests/actions/roadmapActions.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Write implementation in `src/app/actions/roadmapActions.ts`**
```typescript
'use server';

import { getServerSupabaseClient } from '@/lib/serverDb';
import { requireAdminAuth, requireMemberAuth } from '@/lib/authUtils';
import { mockStore } from '@/lib/db';
import { MemberRoadmap } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export async function saveMemberRoadmap(data: Omit<MemberRoadmap, 'id' | 'created_at' | 'is_active'>): Promise<{ success: boolean; error?: string }> {
  await requireAdminAuth();
  
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    mockStore.memberRoadmaps.forEach(r => {
      if (r.member_id === data.member_id) r.is_active = false;
    });
    
    const newRoadmap: MemberRoadmap = {
      ...data,
      id: uuidv4(),
      is_active: true,
      created_at: new Date().toISOString()
    };
    mockStore.memberRoadmaps.push(newRoadmap);
    return { success: true };
  }
  
  await supabase.from('member_roadmaps').update({ is_active: false }).eq('member_id', data.member_id);
  const { error } = await supabase.from('member_roadmaps').insert([{ ...data, is_active: true }]);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getMemberRoadmapHistory(memberId: string): Promise<MemberRoadmap[]> {
  await requireAdminAuth();
  
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return mockStore.memberRoadmaps
      .filter(r => r.member_id === memberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  
  const { data } = await supabase.from('member_roadmaps').select('*').eq('member_id', memberId).order('created_at', { ascending: false });
  return data || [];
}

export async function getActiveRoadmap(memberId: string): Promise<MemberRoadmap | null> {
  try {
    await requireMemberAuth(memberId);
  } catch {
    await requireAdminAuth();
  }
  
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return mockStore.memberRoadmaps.find(r => r.member_id === memberId && r.is_active) || null;
  }
  
  const { data } = await supabase.from('member_roadmaps').select('*').eq('member_id', memberId).eq('is_active', true).single();
  return data || null;
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm test tests/actions/roadmapActions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/actions/roadmapActions.ts tests/actions/roadmapActions.test.ts
git commit -m "feat: implement roadmap server actions"
```

---

### Task 4: Admin UI for Roadmaps

**Files:**
- Create: `src/components/admin/AdminRoadmapModal.tsx`
- Modify: `src/components/admin/HolidayAndTeamManager.tsx`

**Interfaces:**
- Consumes: `saveMemberRoadmap`, `getMemberRoadmapHistory`

- [ ] **Step 1: Create `src/components/admin/AdminRoadmapModal.tsx`**
Build a modal component taking `{ member: Member, onClose: () => void }`.
Use `useEffect` to fetch `getMemberRoadmapHistory(member.id)`.
Provide a UI to list history and a form to submit a new roadmap using `saveMemberRoadmap()`.

- [ ] **Step 2: Update `src/components/admin/HolidayAndTeamManager.tsx`**
Add state: `const [roadmapMember, setRoadmapMember] = useState<Member | null>(null);`
In the "Team" tab member list, render a `<button onClick={() => setRoadmapMember(member)} className="...">Roadmap</button>` next to the reset key.
Render `<AdminRoadmapModal member={roadmapMember} onClose={() => setRoadmapMember(null)} />` when `roadmapMember` is not null.

- [ ] **Step 3: Run build check**
Run: `pnpm build`
Expected: Succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**
```bash
git add src/components/admin/AdminRoadmapModal.tsx src/components/admin/HolidayAndTeamManager.tsx
git commit -m "feat: add admin ui for managing roadmaps"
```

---

### Task 5: Member UI for Roadmaps

**Files:**
- Create: `src/components/standup/MemberRoadmapTab.tsx`
- Modify: `src/components/standup/DailyStandupLogger.tsx`

**Interfaces:**
- Consumes: `getActiveRoadmap`

- [ ] **Step 1: Create `src/components/standup/MemberRoadmapTab.tsx`**
Create a component taking `{ memberId: string }`.
Use `useEffect` to fetch `getActiveRoadmap(memberId)`.
Render the roadmap details (Title, Notes, 30/60/90 goals, and visual score representation) or an empty state.

- [ ] **Step 2: Update Member Dashboard (`src/components/standup/DailyStandupLogger.tsx`)**
Add a state for active view: `const [activeView, setActiveView] = useState<'standup' | 'roadmap'>('standup');`
Render a toggle at the top. When `activeView === 'roadmap'`, show `<MemberRoadmapTab memberId={currentMember.id} />`. Otherwise, show the existing standup UI.

- [ ] **Step 3: Run build check**
Run: `pnpm build`
Expected: Succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**
```bash
git add src/components/standup/MemberRoadmapTab.tsx src/components/standup/DailyStandupLogger.tsx
git commit -m "feat: add member ui for viewing active roadmap"
```
