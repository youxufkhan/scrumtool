# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Member 30-60-90 Day Roadmaps & Evaluations**:
  - Added `member_roadmaps` table in Supabase schema and migration `20260923000000_add_member_roadmaps.sql` with Row Level Security (RLS) enabled. The newest roadmap per member is the active one.
  - Server Actions (`saveMemberRoadmap`, `getMemberRoadmapHistory`, `getActiveRoadmap`) in `src/app/actions/roadmapActions.ts` with strict role-based access control.
  - Admin modal `AdminRoadmapModal.tsx` in Admin Console to evaluate members (Technical Skills, Soft Skills, Learning & Development on a 1–5 scale), write coaching notes, and set 30/60/90 day action milestones.
  - Interactive Roadmap History view in Admin Console allowing administrators to browse past versions and observe progression over time.
  - Member "My Roadmap" dashboard tab (`MemberRoadmapTab.tsx`) with real-time status, skill ratings, feedback notes, milestone breakdown, and network error retry support.
  - In-memory mock store support (`mockStore.memberRoadmaps`) for fast, isolated, zero-network unit tests.
  - 6 new unit tests in Vitest validating authorization, newest-wins activation, error surfacing, and Supabase / mockStore execution paths (41 total tests passing).

## [1.1.0] - 2026-09-22

### Added
- **Member-Based Admin Authentication**:
  - Replaced standalone admin passcode cookie with member-based `is_admin` flag.
  - Access control verified via secure HTTP-only cookies and constant-time token comparison.
  - Dynamic navigation header showing Admin link exclusively for authorized administrators.
- **Database Backup & Export**:
  - Added `exportDatabaseBackup()` server action to export all core tables as structured JSON with full query error validation.
  - Admin console "Database" tab for one-click full system backups.

## [1.0.0] - 2026-08-24

### Added
- Initial release of ScrumTool:
  - Frictionless daily morning task planning and evening decimal hour logging.
  - 4-digit PIN authentication with salted SHA-256 password hashing.
  - Missing hours compliance gate blocking standup if previous working days are unsubmitted.
  - Quick carry-forward of uncompleted tasks from prior working days.
  - Admin dashboard with team standup summaries, Slack/Teams export, CSV timesheet export, and holiday/leave management.
  - Supabase PostgreSQL database integration with Service Role Server Actions.
