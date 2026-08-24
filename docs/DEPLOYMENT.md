# ScrumTool Deployment Guide (100% Free Hosting & Domain)

ScrumTool is designed to be hosted permanently for **$0 / month** on Vercel's Hobby tier with a Supabase PostgreSQL free database.

---

## 1. Database Setup (Supabase)

1. Create a free account at [Supabase.com](https://supabase.com).
2. Click **New Project**, choose a project name (e.g. `scrumtool`) and database password, and pick a region near your team.
3. Once created, go to the **SQL Editor** tab in your Supabase dashboard.
4. Copy the contents of `supabase/schema.sql` and click **Run**.
5. Go to **Project Settings → API** and note down:
   - **Project URL:** `https://<your-project-id>.supabase.co`
   - **Project API Keys (`anon` / `public`):** `eyJhbGci...`

---

## 2. Deploy to Vercel (Free Hosting & Free Domain)

### Option A: 1-Click GitHub Import
1. Push this repository to your GitHub account (`git push origin main`).
2. Log into [Vercel.com](https://vercel.com) (free hobby tier).
3. Click **Add New... → Project**, then select your `scrumtool` GitHub repository.
4. In the **Configure Project** screen, add the following **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<your-project-id>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - `ADMIN_PASSCODE`: `1234` (or any custom PIN you choose for admin access)
   - `ADMIN_JWT_SECRET`: `<random-32-character-secret>`
5. Click **Deploy**.
6. Within 60 seconds, Vercel will assign you a permanent, free SSL domain:
   ```
   https://your-team-scrumtool.vercel.app
   ```

### Option B: Deploy via Vercel CLI
```bash
# 1. Install Vercel CLI (if not already installed)
pnpm add -g vercel

# 2. Deploy
vercel
```

---

## 3. Team Member Onboarding (Zero Friction)

1. Share your `https://your-team-scrumtool.vercel.app` URL with your team.
2. Team members open the URL and click their name.
3. Their browser remembers them via `localStorage` — no passwords or login codes needed!
4. **Morning (Start of Day):** Type planned tasks and press Enter.
5. **Evening (End of Day):** Enter hours worked against each task (e.g. `2`, `1.5`, `0`) and click **Submit & Lock Hours**.
6. **Admin:** Visit `/admin`, enter your PIN, view today's team standup cards, and click **Copy for Slack / Teams** or **Export CSV**.
