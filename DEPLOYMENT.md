# Deployment Guide

## For Vercel Deployment

### Step 1: Push to GitHub
Make sure all files are committed and pushed:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository: `Sathwika-kondoju/Disaster-`
4. **IMPORTANT - Configure these settings:**
   - **Root Directory**: Click "Edit" and set to `frontend`
   - **Framework Preset**: Create React App (auto-detected)
   - **Build Command**: `yarn build` (or leave empty for auto)
   - **Output Directory**: `build` (relative to frontend/)
   - **Install Command**: `yarn install` (or leave empty for auto)

5. Click "Deploy"

### Step 3: Wait for Build
Vercel will:
- Install dependencies from `frontend/package.json`
- Run `yarn build` in the `frontend/` directory
- Deploy the `build/` folder

---

## For Netlify Deployment

### Step 1: Push to GitHub
Same as above - commit and push all files.

### Step 2: Deploy on Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. **Configure build settings:**
   - **Base directory**: `frontend`
   - **Build command**: `yarn build`
   - **Publish directory**: `build` (relative to base, so `frontend/build`)

5. Click "Deploy site"

The `netlify.toml` file is already configured and will be used automatically.

---

## Troubleshooting

### Build fails with "Cannot find index.html"
- **Fix**: Make sure Root Directory is set to `frontend` (not `./`)

### Build fails with "Cannot find module"
- **Fix**: Ensure `frontend/yarn.lock` is committed to git

### Build succeeds but site shows blank page
- **Fix**: Check that Output Directory is set to `build` (not `frontend/build` when Root Directory is `frontend`)

---

## Current Configuration Files

- ✅ `vercel.json` - Configured for Vercel
- ✅ `netlify.toml` - Configured for Netlify
- ✅ `.gitignore` - Properly excludes node_modules and build folders






