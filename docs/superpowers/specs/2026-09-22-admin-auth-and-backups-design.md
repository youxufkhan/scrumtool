# Admin Authentication & Database Backups Design

## Overview
This document outlines the architectural changes required to migrate the ScrumTool application from a separate passcode-based admin system to a member-based admin system, and to implement a manual database backup export feature.

## 1. Admin Authentication Changes

### Database Schema Updates
- Add a new column to the `members` table: `is_admin BOOLEAN DEFAULT false`.
- This requires running an SQL migration on the production Supabase database.
- The `src/types/database.ts` file must be updated to reflect the new `is_admin` property on the `Member` interface.

### Authentication Flow
- The existing `/admin/login` page and the `ADMIN_PASSCODE` environment variable will be deprecated and removed.
- Admins will log in using their standard 4-digit PIN, just like any other member.
- The `requireAdminAuth()` function in `src/app/actions/adminActions.ts` will be rewritten. It will:
  1. Retrieve the existing `scrumtool_member_id` and `scrumtool_member_token` cookies.
  2. Validate the member's session token.
  3. Query the `members` table for the authenticated member.
  4. Return `true` if `member.is_admin === true`, otherwise return `false`.

### UI Changes
- The main navigation bar will conditionally render an "Admin Dashboard" link/button if the authenticated member has `is_admin === true`.
- The Admin Dashboard itself will remain protected by the updated `requireAdminAuth()` server check.

## 2. Database Backup System

### Export Architecture
- A new server action, `exportDatabaseBackup()`, will be created in `src/app/actions/adminActions.ts`.
- The action will securely fetch all data from the following tables using the Service Role key (bypassing RLS):
  - `members`
  - `projects`
  - `daily_submissions`
  - `daily_tasks`
  - `holidays`
- The action will aggregate these into a single JSON object structured by table name.

### UI Integration
- A "Download Full Backup" button will be added to the Admin Dashboard.
- Clicking the button will trigger the server action and construct a `Blob` on the client to initiate a `.json` file download.

### Restoration Strategy
- The exported JSON serves as an offline archive.
- To prevent accidental data loss from malicious or accidental clicks in the UI, there will be no "Restore" button built into the web application.
- If a restoration is ever required, the JSON file will be parsed and re-inserted directly into Supabase via an external script or query.
