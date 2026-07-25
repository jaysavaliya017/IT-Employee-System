# Deploying StaffSync

Three services:

- **Neon** — PostgreSQL database
- **Render** — the Express API (server/)
- **Vercel** — the React app (client/)

The API cannot go on Vercel: it runs Socket.io and a background cron, both of which need
a process that stays alive. Vercel functions do not. So the API goes on Render.

Do the steps in order. The database and API must exist before the frontend can talk to them.

---

## Before you start

Push this project to a GitHub repository. Render and Vercel both deploy from GitHub.

    cd IT-Employee-System-main
    git init
    git add .
    git commit -m "StaffSync"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/staffsync.git
    git push -u origin main

---

## Step 1 - Database (Neon)

1. Go to neon.tech, sign up, create a new project.
   - Name: staffsync
   - Region: **Singapore (ap-southeast-1)** - pick the same region for Render in Step 3.
2. Open Connection Details and copy the connection string. It looks like:

       postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

3. You need two versions of it:
   - **DATABASE_URL** - the one you copied (with -pooler in the host).
   - **DIRECT_URL** - the same string with -pooler **removed** from the host.

   Both are required - the schema declares a directUrl, which Prisma uses for migrations.

If your password contains @ or #, URL-encode them: @ becomes %40, # becomes %23.
An unencoded symbol silently breaks the connection.

---

## Step 2 - Create the database schema (once, from your machine)

Run this locally, not on Render. It creates the migration files that Render will later replay.

    cd server

Create server/.env:

    DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"
    DIRECT_URL="postgresql://neondb_owner:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"
    JWT_SECRET="paste-a-long-random-string"
    JWT_REFRESH_SECRET="paste-a-different-long-random-string"
    PORT=5000
    NODE_ENV=development
    FRONTEND_URL="http://localhost:5173"

Then:

    npm install
    npx prisma migrate dev --name init
    npx prisma db seed
    git add prisma/migrations
    git commit -m "database schema"
    git push

migrate dev creates the tables. db seed fills in the demo company and users.
**Committing prisma/migrations matters** - Render replays those files, and if they are
not in the repo it deploys against an empty database.

Login created by the seed:

- Company code: **STAFFSYNC**
- Email: **admin@staffsync.com**
- Password: **Admin@123**

Change this password before the site is public.

---

## Step 3 - API (Render)

1. render.com -> New -> Web Service -> connect your GitHub repo.
2. Settings:

   | Field | Value |
   |---|---|
   | Root Directory | server |
   | Runtime | Node |
   | Region | Singapore (same as Neon) |
   | Build Command | npm install && npm run build && npx prisma migrate deploy |
   | Start Command | npm run start |
   | Health Check Path | /api/health |

3. Add environment variables (Environment tab):

       DATABASE_URL        <Neon pooled URL, with -pooler>
       DIRECT_URL          <Neon direct URL, without -pooler>
       JWT_SECRET          <a long random string>
       JWT_REFRESH_SECRET  <a different long random string>
       NODE_ENV            production
       FRONTEND_URL        https://your-app.vercel.app
       VERCEL_PROJECT      your-app
       BIOMETRIC_SYNC_ENABLED   true
       BIOMETRIC_TIMEZONE       Asia/Kolkata

   You will not have the real Vercel URL yet. Put a placeholder now and fix it in Step 5.

4. Deploy. When it finishes, note the URL, e.g. https://staffsync-api.onrender.com

Notes:
- FRONTEND_URL has **no trailing slash**. The CORS check is an exact match, so
  https://x.vercel.app/ will not equal https://x.vercel.app
- VERCEL_PROJECT lets Vercel preview deployments through CORS.

---

## Step 4 - Frontend (Vercel)

1. vercel.com -> Add New -> Project -> import the same repo.
2. Settings:

   | Field | Value |
   |---|---|
   | Root Directory | client |
   | Framework Preset | Vite |
   | Build Command | npm run build |
   | Output Directory | dist |

3. Add one environment variable (for Production, Preview and Development):

       VITE_API_URL = https://staffsync-api.onrender.com

   Use your real Render URL, no trailing slash.

4. Deploy. Note the URL, e.g. https://staffsync.vercel.app

Vite bakes env vars in at build time, so **changing VITE_API_URL later needs a redeploy**,
not just a save.

---

## Step 5 - Connect the two and test

1. Render -> FRONTEND_URL = your real Vercel URL -> save (it redeploys).
2. Render -> VERCEL_PROJECT = your Vercel project name -> save.
3. Vercel -> confirm VITE_API_URL is the real Render URL -> Redeploy if you changed it.
4. Open the Vercel URL and sign in:
   - Company: STAFFSYNC
   - Email: admin@staffsync.com
   - Password: Admin@123

---

## If something fails

| What you see | Cause |
|---|---|
| First load takes ~50 seconds | Render free tier cold start. Normal. |
| Network error, nothing in Render logs | VITE_API_URL wrong, or changed without redeploying Vercel |
| CORS error in browser console | FRONTEND_URL mismatch - usually a trailing slash |
| 500, log says "can't reach database" | Unencoded @ or # in the DB password |
| "Company not eligible" on login | Database not seeded, or seeded against a different database |
| Table does not exist | prisma/migrations not committed, so migrate deploy had nothing to run |

---

## Free-tier limits worth knowing

- **Render free** sleeps after 15 minutes idle; the next request waits ~50 seconds. The
  biometric cron does not run while asleep. For a live demo this is usually fine; for a
  real client running a fingerprint machine, use the paid tier.
- **Neon free** auto-suspends after 5 minutes; the next query resumes in about a second.
- **Uploaded files disappear on Render redeploy** - the free tier has no persistent disk,
  so profile pictures and gallery images written to local disk are lost on each deploy.
  Move file storage to Cloudinary for anything that must survive.

## Fingerprint machine against the hosted API

Pull mode cannot reach a device inside an office network from Render. Use push mode (ADMS):
on the device set the cloud server address to your Render host (no https://), port 443,
enable domain name, then add the device in the app with the same serial number and no IP.
