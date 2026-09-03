# Graph Report - scrumtool  (2026-09-04)

## Corpus Check
- Corpus is ~44,192 words - fits in a single context window. You may not need a graph.

## Summary
- 477 nodes · 798 edges · 46 communities (35 shown, 8 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin Server Actions
- Composite & Query Indexing
- Auth & Standup Actions
- Dashboard & UI Components
- Full-Text & JSONB Search
- Supabase Core Principles
- Build Tools & DevDependencies
- TypeScript & Next.js Types
- Supabase Schema & Rules
- UI & Utility Dependencies
- Batch Data & N+1 Queries
- Advisory Locks & Deadlocks
- Query Diagnostics & Stat Statements
- Database Connection Management
- Row Level Security Performance
- Database Concurrency Best Practices
- Covering & Multicolumn Indexes
- Index Selection & Partitioning
- Foreign Keys & JOIN Optimization
- Data Types & Primary Keys
- Supabase Skill Feedback System
- Postgres Rule Guidelines
- Postgres Contribution Standards
- Date Utilities & Working Days
- Supabase Skill Changelogs
- Full-Text & JSONB Indexing
- Batch Loading & Insert Patterns
- Covering Indexes & Index-Only Scans
- B-tree & GIN Index Types
- Partial Index Optimization
- Schema Constraints & Migrations
- Data Type Sizing Guidelines
- Table Partitioning & Time Ranges
- Primary Key & Identity Strategy
- Database Security & Privileges
- Filtered Partial Indexes
- Database Identifier Conventions
- Next.js Root Layout
- Schema Migration Changelogs
- Cursor-Based Keyset Pagination
- Atomic UPSERT Operations
- Next.js Build Configuration
- Tailwind CSS Configuration

## God Nodes (most connected - your core abstractions)
1. `getServerSupabaseClient()` - 27 edges
2. `requireAdminAuth()` - 16 edges
3. `compilerOptions` - 16 edges
4. `Member` - 14 edges
5. `ScrumTool Technical Design Specification` - 14 edges
6. `HolidayAndTeamManager()` - 13 edges
7. `Project` - 13 edges
8. `getDailyTasks()` - 12 edges
9. `DailyTask` - 12 edges
10. `verifyMemberPasscode()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Subquery Function Wrapping in RLS Policies` --semantically_similar_to--> `Supabase Security Anti-Pattern Checklist`  [INFERRED] [semantically similar]
  .agents/skills/supabase-postgres-best-practices/references/security-rls-performance.md → agent/skills/supabase/SKILL.md
- `Controlled Security Definer Function Pattern` --semantically_similar_to--> `Supabase Security Anti-Pattern Checklist`  [INFERRED] [semantically similar]
  .agents/skills/supabase-postgres-best-practices/references/security-rls-performance.md → agent/skills/supabase/SKILL.md
- `Daily Tasks Table Schema` --conceptually_related_to--> `Lowercase Snake Case Identifier Convention`  [INFERRED]
  docs/superpowers/specs/2026-08-24-scrumtool-standup-tracker-design.md → agent/skills/supabase-postgres-best-practices/references/schema-lowercase-identifiers.md
- `ScrumTool` --conceptually_related_to--> `supabase SKILL.md`  [INFERRED]
  README.md → .agents/skills/supabase/SKILL.md
- `SKIP LOCKED Non-Blocking Worker Queue Pattern` --conceptually_related_to--> `Supabase Core Engineering Principles`  [INFERRED]
  .agents/skills/supabase-postgres-best-practices/references/lock-skip-locked.md → agent/skills/supabase/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Postgres Connection Management Strategy** — agents_skills_supabase_postgres_best_practices_references_conn_idle_timeout_config, agents_skills_supabase_postgres_best_practices_references_conn_limits_sizing, agents_skills_supabase_postgres_best_practices_references_conn_pooling_pgbouncer, agents_skills_supabase_postgres_best_practices_references_conn_prepared_statements_pooling [INFERRED 0.85]
- **Postgres Concurrency & Locking Best Practices** — agents_skills_supabase_postgres_best_practices_references_lock_advisory_locks, agents_skills_supabase_postgres_best_practices_references_lock_deadlock_prevention_ordering, agents_skills_supabase_postgres_best_practices_references_lock_short_transactions_duration [INFERRED 0.85]
- **ScrumTool Standup & Compliance Architecture** — readme_scrumtool, readme_morning_standup, readme_evening_standup, readme_missing_hours_compliance_gate, readme_immutable_timesheets [INFERRED 0.85]
- **PostgreSQL Query Performance Monitoring Trio** — agents_skills_supabase_postgres_best_practices_references_monitor_explain_analyze_explain_analyze_diagnostics, agents_skills_supabase_postgres_best_practices_references_monitor_pg_stat_statements_pg_stat_statements_tracking, agents_skills_supabase_postgres_best_practices_references_monitor_vacuum_analyze_planner_statistics_maintenance [INFERRED 0.85]
- **PostgreSQL Index Optimization Suite** — agents_skills_supabase_postgres_best_practices_references_query_composite_indexes_composite_index_rule, agents_skills_supabase_postgres_best_practices_references_query_covering_indexes_covering_index_rule, agents_skills_supabase_postgres_best_practices_references_query_index_types_specialized_index_selection, agents_skills_supabase_postgres_best_practices_references_query_missing_indexes_where_join_indexing, agents_skills_supabase_postgres_best_practices_references_query_partial_indexes_partial_index_rule, agents_skills_supabase_postgres_best_practices_references_schema_foreign_key_indexes_index_foreign_keys [INFERRED 0.85]
- **Supabase Database Security Defense-in-Depth** — agents_skills_supabase_postgres_best_practices_references_security_privileges_least_privilege_roles, agents_skills_supabase_postgres_best_practices_references_security_rls_basics_database_enforced_isolation, agents_skills_supabase_postgres_best_practices_references_security_rls_performance_subquery_wrapping, agent_skills_supabase_skill_security_checklist [INFERRED 0.85]
- **PostgreSQL Connection Management & Scaling Pattern** — agent_skills_supabase_postgres_best_practices_references_conn_pooling_connection_pooling_rule, agent_skills_supabase_postgres_best_practices_references_conn_limits_connection_limits_rule, agent_skills_supabase_postgres_best_practices_references_conn_idle_timeout_idle_timeout_rule, agent_skills_supabase_postgres_best_practices_references_conn_prepared_statements_prepared_statements_rule [EXTRACTED 1.00]
- **PostgreSQL Concurrency Control & Lock Contention Avoidance Pattern** — agent_skills_supabase_postgres_best_practices_references_lock_short_transactions_short_transactions_rule, agent_skills_supabase_postgres_best_practices_references_lock_deadlock_prevention_deadlock_prevention_rule, agent_skills_supabase_postgres_best_practices_references_lock_skip_locked_skip_locked_rule, agent_skills_supabase_postgres_best_practices_references_lock_advisory_advisory_locks_rule [EXTRACTED 1.00]
- **PostgreSQL Query Diagnostics & Maintenance Lifecycle** — agent_skills_supabase_postgres_best_practices_references_monitor_pg_stat_statements_pg_stat_statements_rule, agent_skills_supabase_postgres_best_practices_references_monitor_explain_analyze_explain_analyze_rule, agent_skills_supabase_postgres_best_practices_references_monitor_vacuum_analyze_vacuum_analyze_rule [EXTRACTED 1.00]
- **PostgreSQL Index Optimization Suite** — agent_skills_supabase_postgres_best_practices_references_query_composite_indexes_composite_index_rule, agent_skills_supabase_postgres_best_practices_references_query_covering_indexes_covering_index_rule, agent_skills_supabase_postgres_best_practices_references_query_index_types_index_type_selection, agent_skills_supabase_postgres_best_practices_references_query_missing_indexes_where_join_indexing, agent_skills_supabase_postgres_best_practices_references_query_partial_indexes_partial_index_rule, agent_skills_supabase_postgres_best_practices_references_schema_foreign_key_indexes_index_foreign_keys [INFERRED 0.85]
- **PostgreSQL Multi-Tenant Security & Privilege Hardening** — agent_skills_supabase_postgres_best_practices_references_security_privileges_least_privilege_roles, agent_skills_supabase_postgres_best_practices_references_security_rls_basics_row_level_security_enforcement, agent_skills_supabase_postgres_best_practices_references_security_rls_performance_rls_optimization_pattern [INFERRED 0.85]
- **ScrumTool Standup & Timesheet Lifecycle Enforcement** — docs_superpowers_specs_2026_08_24_scrumtool_standup_tracker_design_missing_hours_gate, docs_superpowers_specs_2026_08_24_scrumtool_standup_tracker_design_decimal_hours_rule, docs_superpowers_specs_2026_08_24_scrumtool_standup_tracker_design_submission_immutability, docs_superpowers_specs_2026_08_24_scrumtool_standup_tracker_design_idempotency_mechanisms, docs_superpowers_specs_2026_08_24_scrumtool_standup_tracker_design_anti_exploit_security [EXTRACTED 1.00]

## Communities (46 total, 8 thin omitted)

### Community 0 - "Admin Server Actions"
Cohesion: 0.16
Nodes (33): addHoliday(), addMember(), addProject(), adminCancelMemberLeave(), adminGetMemberLeaves(), adminLogout(), adminMarkMemberLeaveRange(), adminResetMemberPasscode() (+25 more)

### Community 1 - "Composite & Query Indexing"
Cohesion: 0.06
Nodes (37): Composite Index Ordering Rule, Composite Indexes Reference Guide, PostgreSQL Multicolumn Indexes Documentation, Missing Indexes on WHERE and JOIN Guide, Supabase Query Optimization Guide, WHERE and JOIN Column Indexing Rule, Foreign Key Indexing Guide, Foreign Key Indexing Pattern (+29 more)

### Community 2 - "Auth & Standup Actions"
Cohesion: 0.14
Nodes (29): checkInitialMemberAuth(), ActionResult, carryForwardYesterdayTasks(), changeMemberPasscode(), GateCheckResult, markDayOnLeave(), memberLogout(), requireMemberAuth() (+21 more)

### Community 3 - "Dashboard & UI Components"
Cohesion: 0.14
Nodes (25): getDailyTasks(), AdminAnalyticsView(), DailyStandupLoggerProps, Header(), HeaderProps, LockedStandupCard(), LockedStandupCardProps, MemberPasscodeModal() (+17 more)

### Community 4 - "Full-Text & JSONB Search"
Cohesion: 0.07
Nodes (35): Full-Text Search Reference Guide, Supabase Full Text Search Documentation, tsvector Full-Text Search with GIN Indexing Rule, JSONB Indexing Reference Guide, JSONB GIN and Expression Indexing Rule, PostgreSQL JSONB Indexing Documentation, Idle Connection Timeouts Reference Guide, Idle Connection Timeouts Configuration Rule (+27 more)

### Community 5 - "Supabase Core Principles"
Cohesion: 0.07
Nodes (31): Supabase Skill Release History, Supabase Agent Skill Changelog, Supabase CLI and MCP Server Operations, Supabase Core Engineering Principles, Data API Exposure and RLS Distinction, Supabase Monitoring and Debugging Protocol, Supabase Agent Skill Guide, Declarative Schemas vs Imperative Migrations Workflow (+23 more)

### Community 6 - "Build Tools & DevDependencies"
Cohesion: 0.07
Nodes (26): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom (+18 more)

### Community 7 - "TypeScript & Next.js Types"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 8 - "Supabase Schema & Rules"
Cohesion: 0.09
Nodes (23): supabase CHANGELOG.md, Supabase Debugging Workflows, Declarative Schema Section, Security Checklist Update, Rule Section Definitions, supabase-postgres-best-practices SKILL.md, Postgres Rule Categories, Postgres Rule Structure (+15 more)

### Community 9 - "UI & Utility Dependencies"
Cohesion: 0.11
Nodes (19): clsx, date-fns, lucide-react, dependencies, clsx, date-fns, lucide-react, next (+11 more)

### Community 10 - "Batch Data & N+1 Queries"
Cohesion: 0.18
Nodes (13): Batch INSERT and COPY Bulk Loading Rule, Batch INSERT Statements Reference Guide, PostgreSQL COPY Command Documentation, N+1 Queries Elimination Reference Guide, N+1 Query Elimination with Batch Loading Rule, Supabase Query Optimization Guide, Cursor Keyset Pagination vs OFFSET Rule, Cursor-Based Pagination Reference Guide (+5 more)

### Community 11 - "Advisory Locks & Deadlocks"
Cohesion: 0.18
Nodes (13): Application Advisory Locks Rule, Advisory Locks Reference Guide, PostgreSQL Advisory Locks Documentation, Consistent Lock Ordering Deadlock Prevention Rule, Deadlock Prevention Reference Guide, PostgreSQL Deadlocks Documentation, Short Transactions Reference Guide, PostgreSQL Transactions Documentation (+5 more)

### Community 12 - "Query Diagnostics & Stat Statements"
Cohesion: 0.17
Nodes (12): EXPLAIN ANALYZE Diagnostics Guide, Execution Plan Bottleneck Identification, Query Diagnostics with EXPLAIN ANALYZE, Supabase Query Inspection Guide, pg_stat_statements Query Analysis Guide, High-Latency Query Optimization Strategy, Query Execution Statistics Tracking, Supabase pg_stat_statements Documentation (+4 more)

### Community 13 - "Database Connection Management"
Cohesion: 0.25
Nodes (4): Configure Idle Connection Timeouts, Set Appropriate Connection Limits, Use Connection Pooling for All Applications, Use Prepared Statements Correctly with Pooling

### Community 14 - "Row Level Security Performance"
Cohesion: 0.33
Nodes (6): Row Level Security Basics Guide, Row Level Security Multi-Tenant Isolation, Supabase Row Level Security Documentation, RLS Performance Optimization Guide, RLS Subquery Wrapping and Security Definer Pattern, Supabase RLS Performance Recommendations

### Community 15 - "Database Concurrency Best Practices"
Cohesion: 0.33
Nodes (3): Use Advisory Locks for Application-Level Locking, Prevent Deadlocks with Consistent Lock Ordering, Keep Transactions Short to Reduce Lock Contention

### Community 16 - "Covering & Multicolumn Indexes"
Cohesion: 0.33
Nodes (6): Composite Index Column Ordering Rule, Composite Indexes Reference Guide, PostgreSQL Multicolumn Indexes Documentation, Covering Index with INCLUDE Clause, Covering Indexes Reference Guide, PostgreSQL Index-Only Scans Documentation

### Community 17 - "Index Selection & Partitioning"
Cohesion: 0.33
Nodes (6): PostgreSQL Index Types Guide, PostgreSQL Index Types Documentation, Index Type Selection (B-tree, GIN, GiST, BRIN, Hash), Table Partitioning Strategy Guide, PostgreSQL Table Partitioning Documentation, Range Partitioning for Time-Series Data

### Community 18 - "Foreign Keys & JOIN Optimization"
Cohesion: 0.33
Nodes (6): WHERE and JOIN Column Indexing Guide, Supabase Query Optimization Documentation, WHERE and JOIN Predicate Indexing Rule, Foreign Key Indexing Guide, Foreign Key Indexing for JOINs and Cascades, PostgreSQL Foreign Keys Documentation

### Community 19 - "Data Types & Primary Keys"
Cohesion: 0.33
Nodes (6): PostgreSQL Data Types Best Practices Guide, Optimal Data Type Selection, PostgreSQL Data Types Documentation, Primary Key Strategy Guide, PostgreSQL Identity Columns Documentation, Optimal Primary Key Strategy (Identity vs UUIDv7)

### Community 20 - "Supabase Skill Feedback System"
Cohesion: 0.40
Nodes (5): Supabase Skill Feedback Issue Template, Skill Feedback Issue Structure, Skill Feedback Workflow Reference, Agent Skill Feedback Reporting Protocol, Supabase Agent Skills Issue Tracker

### Community 21 - "Postgres Rule Guidelines"
Cohesion: 0.40
Nodes (5): Postgres References Writing Guidelines, Error-First Reference Structure, Quantified Impact Level Framework, Postgres Best Practices Rule Template, Rule Reference Document Specification

### Community 22 - "Postgres Contribution Standards"
Cohesion: 0.40
Nodes (3): Impact Scale Guidelines, Postgres Reference Key Principles, Postgres Best Practice Rule Template

### Community 23 - "Date Utilities & Working Days"
Cohesion: 0.80
Nodes (3): formatDateIso(), getPriorWorkingDay(), isValidDateString()

### Community 24 - "Supabase Skill Changelogs"
Cohesion: 0.50
Nodes (4): Supabase Postgres Best Practices Changelog, Supabase Agent Skills GitHub Repository, Release v1.5.0 Agent Skills Baseline, Release v1.6.0 Safe Migration Patterns & Security Additions

### Community 27 - "Covering Indexes & Index-Only Scans"
Cohesion: 0.67
Nodes (3): Covering Index with INCLUDE Clause, Covering Indexes Reference Guide, PostgreSQL Index-Only Scans Documentation

### Community 28 - "B-tree & GIN Index Types"
Cohesion: 0.67
Nodes (3): PostgreSQL Index Types Guide, Index Type Selection (B-tree, GIN, GiST, BRIN, Hash), PostgreSQL Index Types Documentation

### Community 29 - "Partial Index Optimization"
Cohesion: 0.67
Nodes (3): Partial Indexes Reference Guide, Partial Index Optimization Rule, PostgreSQL Partial Indexes Documentation

### Community 30 - "Schema Constraints & Migrations"
Cohesion: 0.67
Nodes (3): Safe Schema Constraints Migration Guide, Idempotent Constraint Creation via DO Block, PostgreSQL DDL Constraints Documentation

### Community 31 - "Data Type Sizing Guidelines"
Cohesion: 0.67
Nodes (3): Data Types Selection Guide, PostgreSQL Data Type Selection Guidelines, PostgreSQL Data Types Documentation

### Community 32 - "Table Partitioning & Time Ranges"
Cohesion: 0.67
Nodes (3): Table Partitioning Guide, PostgreSQL Partitioning Documentation, Range Partitioning for Large Tables

### Community 33 - "Primary Key & Identity Strategy"
Cohesion: 0.67
Nodes (3): Primary Key Strategy Guide, PostgreSQL Identity Columns Documentation, Optimal Primary Key Selection Strategy

### Community 34 - "Database Security & Privileges"
Cohesion: 0.67
Nodes (3): Principle of Least Privilege Guide, Least Privilege Database Roles Strategy, Supabase Roles and Privileges Guide

### Community 35 - "Filtered Partial Indexes"
Cohesion: 0.67
Nodes (3): Partial Indexes Reference Guide, Partial Index Optimization Rule, PostgreSQL Partial Indexes Documentation

### Community 36 - "Database Identifier Conventions"
Cohesion: 0.67
Nodes (3): Lowercase Identifiers Guide, Lowercase Snake_Case Identifiers Convention, PostgreSQL Identifiers and Keywords Documentation

## Knowledge Gaps
- **158 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+153 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 204 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Postgres Rule Section Definitions` connect `Full-Text & JSONB Search` to `Batch Data & N+1 Queries`, `Advisory Locks & Deadlocks`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `dependencies` connect `UI & Utility Dependencies` to `Build Tools & DevDependencies`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `Concurrency & Locking Section Definition (lock)` connect `Advisory Locks & Deadlocks` to `Full-Text & JSONB Search`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ScrumTool Technical Design Specification` (e.g. with `ScrumTool Deployment Guide` and `100% Free Hosting Architecture`) actually correct?**
  _`ScrumTool Technical Design Specification` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _158 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Composite & Query Indexing` be split into smaller, more focused modules?**
  _Cohesion score 0.06456456456456457 - nodes in this community are weakly interconnected._
- **Should `Auth & Standup Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.13663663663663664 - nodes in this community are weakly interconnected._