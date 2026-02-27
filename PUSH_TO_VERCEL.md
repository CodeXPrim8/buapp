# Push to GitHub → Deploy on Vercel

When you **push to GitHub**, Vercel should automatically build and deploy **only if** the project is connected correctly. If nothing happens, follow these steps.

---

## 1. Check that your repo is connected to Vercel

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)** and log in.
2. Open the project that should deploy (e.g. **buapp** or **bisonnoteapp**).
3. Go to **Settings** → **Git**.
4. Under **Connected Git Repository** you should see:
   - **Repository:** `CodeXPrim8/buapp` (or your GitHub username/repo).
   - If it says "No Git Repository connected", connect it:
     - Click **Connect Git Repository**.
     - Choose **GitHub** and authorize if needed.
     - Select the **buapp** (or correct) repo.
     - Leave **Production Branch** as `main` (or the branch you push to).

---

## 2. Confirm you’re pushing to the same repo

On your PC, in the project folder, run:

```bash
git remote -v
```

You should see something like:

```
origin  https://github.com/CodeXPrim8/buapp.git (fetch)
origin  https://github.com/CodeXPrim8/buapp.git (push)
```

The repo name and account must match the one connected in Vercel (step 1). If you use a different remote (e.g. a fork), connect **that** repo in Vercel, or push to the repo that’s already connected.

---

## 3. Push to the production branch

Vercel usually deploys the **Production Branch** (often `main`). Push your changes to that branch:

```bash
git add .
git commit -m "Your message"
git push origin main
```

If your default branch has another name (e.g. `master`), use that name instead of `main`, and make sure in Vercel **Settings → Git** the **Production Branch** is set to that same name.

---

## 4. Check deployments in Vercel

1. In the Vercel dashboard, open your project.
2. Open the **Deployments** tab.
3. After a push you should see a new deployment (e.g. "Building" then "Ready" or "Error").
   - If there is **no new deployment** after a push, the Git connection or branch is wrong (re-check steps 1–3).
   - If the deployment **fails**, open it and read the **Build Logs** to fix the error (e.g. missing env vars, build script failure).

---

## 5. Trigger a deploy manually (if needed)

If the repo is connected but a recent push didn’t deploy:

1. Vercel project → **Deployments**.
2. Click the **⋯** on the latest deployment.
3. Click **Redeploy** (optional: check "Use existing Build Cache" or leave unchecked).

Or from the **Overview** tab, use **Redeploy** if the button is there.

---

## 6. Summary checklist

| Check | Done |
|--------|------|
| Vercel project **Settings → Git** shows your GitHub repo (e.g. `CodeXPrim8/buapp`) | ☐ |
| **Production Branch** in Vercel = branch you push to (e.g. `main`) | ☐ |
| You run `git push origin main` (or your production branch) | ☐ |
| **Deployments** tab shows a new deployment after the push | ☐ |
| If build fails, you checked **Build Logs** and fixed the error | ☐ |

---

**Common causes of “not pushing to Vercel”:**

- Repo not connected in Vercel, or connected to a different repo/fork.
- Pushing to a branch that isn’t the Production Branch.
- Build failing on Vercel (check Deployments → failed deployment → Build Logs).
- Wrong Git remote on your machine (run `git remote -v` and compare with Vercel).
