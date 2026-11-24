# Supabase setup

Accounts, profiles (and later social posts and scrapbooks) use [Supabase](https://supabase.com) on the free tier.
Without it the app still runs; account features are just hidden.

## 1. Create the project
1. Create a free project at supabase.com.
2. **Project Settings → API**: copy the **Project URL** and the **anon public** key into your `.env`:
   ```
   VITE_SUPABASE_URL="https://xxxx.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJ..."
   ```
   The anon key is safe to ship to the browser. Row Level Security in the migrations controls what each user can do.

## 2. Run the migrations
Open **SQL Editor** in the dashboard and run each file in `supabase/migrations/` in order (`0001_…`, `0002_…`, …).
They're safe to run more than once.

## 3. Auth settings
**Authentication → URL Configuration**
- **Site URL**: your deployed URL (or `http://localhost:5173` while developing)
- **Redirect URLs**: add `http://localhost:5173/**` and `https://<your-deployed-site>/**`
  (password reset emails link to `/reset-password`)

**Authentication → Providers → Email**
- "Confirm email" is on by default: new users must click a link before they can sign in. The app handles both,
  but turning it off makes local testing quicker.
- The built-in email sender is rate-limited (a few emails per hour). Fine for a class project.

## 4. Deploying
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the hosting provider's environment variables, along with
`VITE_OPENTRIPMAP_API_KEY`.
