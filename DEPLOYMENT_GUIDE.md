# Deployment Guide for Dormzy

## Recommended: Vercel (Easiest for Next.js)

Vercel is the easiest and best platform for Next.js applications. It offers:
- Free tier with generous limits
- Automatic deployments from GitHub
- Built-in CDN and edge functions
- Zero configuration for Next.js

### Step 1: Prepare Your Code

1. Make sure all changes are committed:
```bash
git add .
git commit -m "Prepare for deployment"
```

2. Push to GitHub:
```bash
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Add Environment Variables (click "Environment Variables"):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
   (Get these from Firebase Console → Project Settings → Your apps → Config)

6. Click "Deploy"
7. Wait for deployment to complete (usually 2-3 minutes)
8. Your app will be live at `your-app-name.vercel.app`

### Step 3: Update Firebase Settings

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Vercel domain: `your-app-name.vercel.app`

## Alternative: Render

Render is also free and easy to use:

### Step 1: Prepare for Render

1. Create a `render.yaml` file in your project root:
```yaml
services:
  - type: web
    name: dormzy
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_FIREBASE_API_KEY
        sync: false
      - key: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
        sync: false
      - key: NEXT_PUBLIC_FIREBASE_PROJECT_ID
        sync: false
      - key: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        sync: false
      - key: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
        sync: false
      - key: NEXT_PUBLIC_FIREBASE_APP_ID
        sync: false
```

2. Commit and push to GitHub

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: dormzy (or your choice)
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables (same as Vercel)
6. Click "Create Web Service"
7. Wait for deployment (~5-10 minutes)
8. Your app will be live at `your-app-name.onrender.com`

## Important Notes

### For Both Platforms:

1. **Firebase Environment Variables**: Make sure all `NEXT_PUBLIC_*` variables are set
2. **Authorized Domains**: Add your deployment URL to Firebase authorized domains
3. **CORS**: Firebase should work automatically, but if you have issues, check Firebase Console → Storage → Rules

### Common Issues:

1. **"No Next.js version detected" Error**:
   - **Solution 1**: Check that your `package.json` is in the root directory of your repository
   - **Solution 2**: In Vercel project settings, ensure **Root Directory** is set to `./` (or leave it empty)
   - **Solution 3**: Make sure `package.json` is committed and pushed to GitHub
   - **Solution 4**: The `vercel.json` file has been added to help with detection - commit and push it
   - **Solution 5**: If using a monorepo, set Root Directory to the folder containing `package.json`

2. **Build Fails**: Check that all dependencies are in `package.json`
3. **Environment Variables Not Working**: Make sure they start with `NEXT_PUBLIC_` for client-side access
4. **Firebase Auth Not Working**: Verify authorized domains in Firebase Console

### Recommended: Vercel

For Next.js apps, **Vercel is highly recommended** because:
- Automatic optimizations
- Better performance
- Easier setup
- Free SSL certificates
- Preview deployments for every PR

