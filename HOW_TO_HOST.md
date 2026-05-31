# 🌸 TUBA Team — Complete Hosting Guide
# Vercel (frontend) + Render (backend) + Supabase (database) + Cloudinary (photos)
# ALL FREE FOREVER

Your website will be live at: https://tuba-team.vercel.app

---

## OVERVIEW

| Service | What it does | Free forever? |
|---------|-------------|---------------|
| Supabase | Database (stores everything) | ✅ Yes |
| Cloudinary | Photo storage | ✅ Yes |
| Render | Runs the backend API | ✅ Yes |
| Vercel | Serves the React website | ✅ Yes |

---

## STEP 1 — Create Supabase Account & Database (10 min)

1. Go to https://supabase.com → click "Start your project"
2. Sign up with GitHub or email
3. Click "New Project"
4. Fill in:
   - Name: tuba-team
   - Database Password: make a strong password (SAVE IT)
   - Region: pick the closest to Ethiopia
5. Click "Create new project" → wait 2 minutes

### Set up the database tables:
6. In the left menu click "SQL Editor"
7. Click "New query"
8. Open the file SUPABASE_SETUP.sql from your project folder
9. Copy ALL the text inside it
10. Paste it into the SQL Editor box
11. Click the green "RUN" button
12. You should see "Success. No rows returned"

### Get your Supabase keys:
13. In the left menu click "Project Settings" (gear icon)
14. Click "API"
15. Copy these two values and save them:
    - "Project URL" → looks like https://abcdefgh.supabase.co
    - "service_role" key → long text starting with "eyJ..."
    (DO NOT use the "anon" key — use the "service_role" key)

---

## STEP 2 — Create Cloudinary Account (5 min)
(This stores your product photos safely forever)

1. Go to https://cloudinary.com → click "Sign Up Free"
2. After signing in, go to your Dashboard
3. Copy these 3 values and save them:
   - Cloud Name
   - API Key
   - API Secret

---

## STEP 3 — Push Code to GitHub (5 min)

1. Go to https://github.com → create account if you don't have one
2. Click "+" → "New repository" → name it "tuba-team" → Create
3. Open PowerShell inside your tuba-team folder
4. Run these commands:

git init
git add .
git commit -m "TUBA Team"
git branch -M main
git remote add origin https://github.com/bbyordanos/tuba-team.git
git push -u origin main --force

(Use GitHub token as password — see previous instructions)

---

## STEP 4 — Deploy Backend on Render (10 min)

1. Go to https://render.com → sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub account → select "tuba-team" repo
4. Fill in:
   - Name: tuba-team-backend
   - Root Directory: (leave empty)
   - Runtime: Node
   - Build Command: cd frontend && npm install --legacy-peer-deps && CI=false npm run build && cd ../backend && npm install --production
   - Start Command: node backend/server.js
5. Scroll down to "Environment Variables" → add ALL of these:

   SUPABASE_URL          = (paste your Supabase Project URL)
   SUPABASE_SERVICE_KEY  = (paste your service_role key)
   CLOUDINARY_CLOUD_NAME = (paste your Cloudinary cloud name)
   CLOUDINARY_API_KEY    = (paste your Cloudinary API key)
   CLOUDINARY_API_SECRET = (paste your Cloudinary API secret)
   JWT_SECRET            = TubaHermella_SuperSecret_2024
   OWNER_PASSWORD        = Hermella2024
   NODE_ENV              = production

6. Click "Create Web Service"
7. Wait 5-10 minutes for it to build and deploy

### Test it works:
8. Copy your Render URL (looks like https://tuba-team-backend.onrender.com)
9. Open in browser: https://tuba-team-backend.onrender.com/api/health
10. You should see: {"status":"ok","message":"🌸 TUBA Team is running!"}

---

## STEP 5 — Deploy Frontend on Vercel (5 min)

1. Go to https://vercel.com → sign up with GitHub
2. Click "Add New" → "Project"
3. Select your "tuba-team" repository
4. Fill in:
   - Framework Preset: Create React App
   - Root Directory: frontend
5. Click "Environment Variables" and add:
   REACT_APP_API_URL = https://tuba-team-backend.onrender.com/api
   (Replace with your actual Render URL from Step 4)
6. Click "Deploy"
7. Wait 2-3 minutes

### Your website is LIVE! 🎉
Vercel gives you a URL like: https://tuba-team.vercel.app

---

## STEP 6 — Test Everything

1. Open your Vercel URL in the browser
2. You should see the TUBA Team shop
3. Login as owner:
   Email: hermellahenok94@gmail.com
   Password: Hermella2024
4. Post a product and add a photo → should save permanently
5. Sign up as a customer → should work

---

## YOUR LOGINS TO SAVE

| Service | Website | Email/Username |
|---------|---------|---------------|
| Supabase | supabase.com | your email |
| Cloudinary | cloudinary.com | your email |
| Render | render.com | GitHub login |
| Vercel | vercel.com | GitHub login |
| GitHub | github.com | bbyordanos |

---

## AFTER MAKING CHANGES TO THE CODE

1. Make your changes
2. Open PowerShell in the tuba-team folder
3. Run:
   git add .
   git commit -m "Updated"
   git push
4. Render and Vercel both redeploy automatically ✅

---

## IS MY DATA SAFE FOREVER?

YES! Here is why:
- Database (Supabase) → stored in the cloud, never deleted
- Photos (Cloudinary) → stored in the cloud, never deleted
- When Render restarts → data is in Supabase, NOT on Render, so nothing is lost
- Free plan → no expiry date

