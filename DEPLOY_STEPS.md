# Step-by-Step Deployment Guide

## ✅ Step 1: Configure Git (Do this first!)

Open your terminal and run:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Replace with your actual name and GitHub email.

---

## ✅ Step 2: Commit Your Files

After configuring git, run:
```bash
git commit -m "Initial commit: Disaster management app"
```

---

## ✅ Step 3: Push to GitHub

### Option A: If you already have a GitHub repository
```bash
git remote add origin https://github.com/Sathwika-kondoju/Disaster-.git
git branch -M main
git push -u origin main
```

### Option B: Create a new GitHub repository
1. Go to https://github.com/new
2. Create a new repository named "Disaster-" (or any name)
3. Don't initialize with README
4. Copy the repository URL
5. Run:
```bash
git remote add origin <YOUR_REPO_URL>
git branch -M main
git push -u origin main
```

---

## ✅ Step 4: Deploy on Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Click "Add New Project"**
4. **Import your repository**: Select `Sathwika-kondoju/Disaster-`
5. **Configure these settings:**
   - **Root Directory**: Click "Edit" → Change from `./` to `frontend`
   - **Framework Preset**: Create React App (auto-detected)
   - **Build Command**: `yarn build` (or leave empty)
   - **Output Directory**: `build` (relative to frontend/)
   - **Install Command**: `yarn install` (or leave empty)
6. **Click "Deploy"**
7. **Wait 2-3 minutes** for the build to complete
8. **Your site will be live!** 🎉

---

## ✅ Step 5: Deploy on Netlify (Alternative)

1. **Go to Netlify**: https://netlify.com
2. **Sign in** with your GitHub account
3. **Click "Add new site"** → "Import an existing project"
4. **Select your repository**
5. **Configure:**
   - **Base directory**: `frontend`
   - **Build command**: `yarn build`
   - **Publish directory**: `build`
6. **Click "Deploy site"**

---

## 🎯 Quick Checklist

- [ ] Git configured with name and email
- [ ] Files committed to git
- [ ] Repository pushed to GitHub
- [ ] Root Directory set to `frontend` in Vercel/Netlify
- [ ] Build command: `yarn build`
- [ ] Output directory: `build`

---

## ⚠️ Important Notes

- **Root Directory MUST be `frontend`** - This is the most common mistake!
- Make sure `vercel.json` and `netlify.toml` are committed
- Make sure `frontend/yarn.lock` is committed
- The build will take 2-5 minutes

---

## 🆘 If Build Fails

**Error: "Cannot find index.html"**
- Fix: Set Root Directory to `frontend` (not `./`)

**Error: "Cannot find module"**
- Fix: Make sure `frontend/yarn.lock` is committed

**Error: "Build command failed"**
- Check the build logs in Vercel/Netlify dashboard
- Make sure all dependencies are in `package.json`






