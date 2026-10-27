# Website go-live (test on personal accounts)

Decisions so far: Supabase region South Asia (Mumbai), kept by the product owner on 27 Oct. Personal Supabase and Vercel accounts for the test; move to company accounts before real launch. Sign-in by a 6-digit code emailed to work Outlook inboxes.

How it fits together: `app/index.html` is the same app file used on claude.ai. `web/shim.js` answers its database calls from Supabase and adds the sign-in screen. `web/build.mjs` joins them into `web/dist` on every Vercel deploy. So a UI change reaches claude.ai and the website from one file.

## Status on 27 Oct (done by Claude through the Supabase and Vercel APIs, plus the lead by hand)

Test address: **https://valerie-tracker.vercel.app**

| Step | State |
| --- | --- |
| 1. Tables | Done. `docs` and `members` created, 6 access rules, live updates on. Lead `members` row added |
| 2. Sign-in settings | Done. Email OTP Length 6. Magic Link and Confirm signup emails send the code, no link. Site URL `https://valerie-tracker.vercel.app`. Outlook SMTP still to add (2.4) |
| 3. Public values | Done. Project URL `https://qxnmcggavnnzumwkamkk.supabase.co`; publishable key stored only in Vercel |
| 4. Vercel | Done. Project `valerie-tracker` linked to WEB-Tracker, build settings and both values set. Branch `claude/dazzling-bohr-3h53is` deployed to production: Ready, build log "Built web/dist for https://qxnmcggavnnzumwkamkk.supabase.co" |
| 5. Data | Done straight from the live claude.ai tracker, no backup file needed (skip 5.1 and 5.2). 405 records in 11 collections, every one checked equal to the source. Comments and escalations were empty. Private profiles not copied (each person gets a new one on first sign-in) |
| Checks on the real database | Not signed in: blocked. Signed in but not on the list: 0 rows. Lead: 405 rows. View: 405 rows, 0 writes. Test rows rolled back |
| Still to do | Lead signs in on the test address and checks brands, tasks, campaigns, Road to SOW (5.3). Add team members (5.4). Outlook SMTP (2.4). Company accounts (Step 6) |

## Step 1. Supabase: create the tables (2 minutes)

1. supabase.com, open project **Valerie Ecosystem**.
2. Left bar: **SQL Editor** (the `>_` icon). Click **+ New query**.
3. Open `supabase/schema.sql` from GitHub (repo WEB-Tracker, branch `claude/dazzling-bohr-3h53is`), click **Copy raw file**, paste it into the editor.
4. Click **Run**. Expect "Success. No rows returned".
5. New query again, paste this with your own email and your name exactly as it appears in the tracker's Settings > People, then **Run**:
   `insert into public.members (email, person, role) values ('you@example.com', 'Your name', 'lead');`
6. Left bar: **Table Editor**. You should see `docs` (empty) and `members` (1 row).

## Step 2. Supabase: sign-in settings (5 minutes)

1. Left bar: **Authentication** > **Sign In / Providers** > **Email**: Email on. Email OTP Length: **6**. "Allow new users to sign up": **on** (who gets in is decided by the `members` table, not by sign-up). Save.
2. **Authentication** > **Emails** (Email Templates). Open **Magic Link**, replace the body with the text below, Save. Do the same for **Confirm signup**.

```
<h2>Your Valerie tracker sign-in code</h2>
<p>Type this code on the sign-in page:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px">{{ .Token }}</p>
<p>It works once and expires in one hour. If you did not ask for it, ignore this email.</p>
```

   There is no link in the email on purpose: Outlook's link scanner opens links and would use up the sign-in.
3. **Authentication** > **URL Configuration** > Site URL: paste the Vercel address once you have it (Step 4). Save.
4. Known limit while testing: Supabase's own email sender sends only a few emails an hour. Before the team uses it, add your Outlook mailbox under **Authentication** > **Emails** > **SMTP Settings** (host `smtp.office365.com`, port `587`, the mailbox address and its password or app password from IT).

## Step 3. Supabase: copy the two public values (1 minute)

1. Click the green **Connect** button at the top (or Project Settings > **API Keys**).
2. Copy the **Project URL** (`https://....supabase.co`).
3. Copy the **Publishable key** (starts `sb_publishable_`) or, on the Legacy tab, the **anon public** key.
4. Never copy the **secret** or **service_role** key anywhere. Never paste any key into a chat.

## Step 4. Vercel: import the project (5 minutes)

1. vercel.com > **Add New** > **Project** > WEB-Tracker > **Import**.
2. Framework Preset: **Other**. Root Directory: leave as `./`.
3. Open **Build and Output Settings**, switch on Override: Build Command `node web/build.mjs`, Output Directory `web/dist`, Install Command `echo skip`. (This stops anything else in the repo from being served.)
4. Open **Environment Variables**, add two:
   - `SUPABASE_URL` = the Project URL from Step 3
   - `SUPABASE_ANON_KEY` = the publishable or anon key from Step 3
5. Click **Deploy**. The first deploy is of `main`, which does not have the website files yet, so it **fails on purpose**. That is fine.
6. Project > **Deployments**: find the deploy for branch `claude/dazzling-bohr-3h53is` (or press Redeploy on it). When it says Ready, click **Visit**. That is the test address.

## Step 5. Copy the data and test (10 minutes)

1. In the claude.ai tracker: **Settings** > **Export** > **JSON backup**. Save the file.
2. Open `<test address>/import.html`, sign in with your email and the code, pick the file, click **Copy**. Every row should say OK.
3. Open `<test address>/`, check brands, tasks, campaigns, Road to SOW.
4. Add team members for the test: Supabase > Table Editor > `members` > **Insert row**: email (lower case), person (their name as in Settings > People), role `lead`, `member` or `view`.

## Step 6. Going live (later, with company accounts)

Changes are reviewed on a Vercel preview link per branch. Merging into `main` publishes them in about a minute. Vercel > Deployments > **Promote** or **Instant Rollback** undoes a bad release. After the switch, the claude.ai page is set to read only and changes go to the website only, because the two cannot share data.
