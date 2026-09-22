# Member Roadmap Design Specification

## 1. Overview
The Member Roadmap feature allows administrators to evaluate team members and set actionable 30-60-90 day goals. Members have read-only visibility into their active roadmap to stay aligned on expectations.

## 2. Database Schema
A new table `member_roadmaps` will be added to the Supabase schema:
- `id` (UUID, primary key)
- `member_id` (UUID, foreign key to `members.id`, cascade delete)
- `title` (TEXT, e.g., "Q4 2026 Growth Plan")
- `tech_skills_score` (INTEGER, 1-5 check constraint)
- `soft_skills_score` (INTEGER, 1-5 check constraint)
- `learning_score` (INTEGER, 1-5 check constraint)
- `admin_notes` (TEXT)
- `goals_30_days` (TEXT)
- `goals_60_days` (TEXT)
- `goals_90_days` (TEXT)
- `is_active` (BOOLEAN, default true)
- `created_at` (TIMESTAMPTZ, default now())

## 3. Server Actions & Backend
Created in `src/app/actions/roadmapActions.ts`:
- `saveMemberRoadmap(data)`: Protected by `requireAdminAuth()`. Sets existing active roadmaps for the specific member to `is_active = false`, then inserts the new record as `is_active = true`.
- `getMemberRoadmapHistory(memberId)`: Protected by `requireAdminAuth()`. Returns all historical roadmaps for a member.
- `getActiveRoadmap(memberId)`: Protected by `requireMemberAuth(memberId)`. Returns the single active roadmap for the authenticated member.

The Vitest `mockStore` (`src/lib/db.ts`) will be updated to include `memberRoadmaps: any[]` to support zero-network testing.

## 4. Frontend: Admin UI
Located primarily in `src/components/admin/HolidayAndTeamManager.tsx` (or a dedicated component imported there):
- Add a "Roadmap" button in the Team tab next to each member.
- Opens an `AdminRoadmapModal` which includes:
  - A history list of past roadmaps.
  - A form to create a new roadmap with title, three 1-5 score inputs, general notes, and three text areas for 30/60/90 day goals.

## 5. Frontend: Member UI
Located in the main standup flow (e.g. `src/components/standup/DailyStandupLogger.tsx` / `src/app/page.tsx`):
- Add a tab toggle at the top level: "Daily Standup" vs "My Roadmap".
- The Roadmap view is read-only, displaying the evaluation scores visually (stars/progress bars), admin notes, and 3 cards for the 30/60/90 milestones.
- Displays a friendly empty state if no active roadmap exists.

## 6. Testing Strategy
- Add unit tests for the new `roadmapActions.ts` against the `mockStore`.
- Verify admin actions reject non-admin requests, and member actions reject unauthorized members.
