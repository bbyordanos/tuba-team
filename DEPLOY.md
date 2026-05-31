# 🚀 Deploy TUBA Team to Fly.io — Free Hosting

Your live URLs will be:
- **Shop** → https://tuba-team-frontend.fly.dev
- **API**  → https://tuba-team-backend.fly.dev

---

## Step 1 — Install Fly CLI

**Windows** (run in PowerShell as Administrator):
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Mac/Linux**:
```bash
curl -L https://fly.io/install.sh | sh
```

---

## Step 2 — Create a free Fly.io account

Go to https://fly.io → Sign Up (free, no credit card needed for basic use)

Then log in from your terminal:
```bash
flyctl auth login
```
A browser window opens → log in → come back to terminal.

---

## Step 3 — Deploy the Backend

```bash
cd tuba-team/backend
flyctl launch --name tuba-team-backend --no-deploy
flyctl volumes create tuba_data --size 1 --region jnb
flyctl secrets set JWT_SECRET=TubaTeam_Hermella_2024_SuperSecret OWNER_PASSWORD=Hermella2024
flyctl deploy
```

✅ Done! Test it: https://tuba-team-backend.fly.dev/api/health

---

## Step 4 — Deploy the Frontend

```bash
cd ../frontend
flyctl launch --name tuba-team-frontend --no-deploy
flyctl deploy --build-arg REACT_APP_API_URL=https://tuba-team-backend.fly.dev/api
```

✅ Your shop is live at: https://tuba-team-frontend.fly.dev

---

## 🎉 That's it! Your app is live forever.

---

## Useful commands after deployment

| Command | What it does |
|---------|-------------|
| `flyctl logs -a tuba-team-backend` | See backend logs |
| `flyctl logs -a tuba-team-frontend` | See frontend logs |
| `flyctl status -a tuba-team-backend` | Check if backend is running |
| `flyctl deploy` | Redeploy after changes (run inside backend/ or frontend/) |
| `flyctl ssh console -a tuba-team-backend` | SSH into the server |

---

## Redeploying after code changes

**Backend changes:**
```bash
cd tuba-team/backend
flyctl deploy
```

**Frontend changes:**
```bash
cd tuba-team/frontend
flyctl deploy --build-arg REACT_APP_API_URL=https://tuba-team-backend.fly.dev/api
```

---

## ⚠️ Important Notes

1. **App names must be globally unique** on Fly.io — if `tuba-team-backend` is taken, use something like `tuba-hermella-backend`
2. **Update fly.toml** if you change the app name — change `app = "tuba-team-backend"` to your new name
3. **Update the frontend API URL** — if you renamed the backend app, update the `REACT_APP_API_URL` in the deploy command and in `frontend/fly.toml`
4. **Your data is safe** — the SQLite database and uploaded photos are stored in a persistent volume (`tuba_data`) that survives restarts and redeployments
5. **Free tier** — Fly.io free tier includes 3 shared VMs and 3GB of storage. Your app will sleep after inactivity and wake up when someone visits (first load may take ~5 seconds)

---

## If you renamed the app

If you used a different name like `hermella-shop-backend`, update two places:

1. In `backend/fly.toml`:
   ```
   app = "hermella-shop-backend"
   ```

2. In your frontend deploy command and `frontend/fly.toml`:
   ```
   REACT_APP_API_URL=https://hermella-shop-backend.fly.dev/api
   ```
