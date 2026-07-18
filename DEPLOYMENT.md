# Deployment Guide — IncidentIQ

This guide covers deploying IncidentIQ to production on **Vercel's free tier** and optionally configuring CI/CD with **GitHub Actions**.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option A: Manual Deploy via Vercel Dashboard](#option-a-manual-deploy-via-vercel-dashboard)
- [Option B: Deploy via Vercel CLI](#option-b-deploy-via-vercel-cli)
- [Environment Variables](#environment-variables)
- [Custom Domain](#custom-domain)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)
- [Upgrading](#upgrading)

---

## Prerequisites

- A **GitHub** account with your repository pushed to `origin/main`
- A **Vercel** account ([sign up free](https://vercel.com/signup))
- An **OpenRouter** API key ([get one free](https://openrouter.ai/keys))

---

## Option A: Manual Deploy via Vercel Dashboard

### Step 1: Push to GitHub

```bash
# Make sure your code is committed
git add .
git commit -m "Ready for deployment"
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `incidentiq` repository
4. Vercel auto-detects:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

### Step 3: Configure Environment Variables

Click **"Environment Variables"** and add:

| Name | Value | Scope |
|------|-------|-------|
| `OPENROUTER_API_KEY` | `sk-or-v1-...` (your key) | Production, Preview, Development |
| `NODE_ENV` | `production` | Production only |

### Step 4: Deploy

Click **"Deploy"**. Vercel will:

1. Install dependencies (`npm ci`)
2. Type-check and build (`npm run build`)
3. Deploy serverless functions to `api/`
4. Deploy static assets to `dist/`

✅ Your app is live at `https://incidentiq.vercel.app` (or your Vercel-assigned URL)

---

## Option B: Deploy via Vercel CLI

For automated or local deployments:

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy to Preview

```bash
vercel --env OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Promote to Production

```bash
vercel --prod --env OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Or set environment variables once and link:

```bash
vercel link
vercel env add OPENROUTER_API_KEY
vercel --prod
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | ✅ Yes | — | API key for AI-powered RCA via OpenRouter |
| `NODE_ENV` | ❌ No | `development` | Set to `production` on Vercel (auto-set in dashboard) |
| `PUBLIC_URL` | ❌ No | `http://localhost:5173` | Public URL of the app (used for redirects) |

### Setting Environment Variables on Vercel

**Dashboard**:
1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable
3. Choose scope: Production, Preview, Development

**CLI**:
```bash
vercel env add OPENROUTER_API_KEY
# Prompts: Production, Preview, Development (select all)
```

---

## Custom Domain

1. In Vercel dashboard → your project → **Settings** → **Domains**
2. Enter your domain (e.g., `incidentiq.example.com`)
3. Follow DNS configuration instructions (add CNAME record to `cname.vercel-dns.com`)
4. Wait for propagation (usually < 5 minutes)

SSL/TLS certificates are automatically provisioned by Vercel.

---

## CI/CD with GitHub Actions

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Code Quality Checks
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Format check
        run: npm run format:check

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Build
        run: npm run build
```

### Auto-Deploy to Vercel

For automatic deployments on every push to `main`, use the [Vercel GitHub Integration](https://vercel.com/docs/deployments/git#vercel-for-github) (no separate workflow needed):

1. In Vercel dashboard → your project → **Settings** → **Git**
2. Ensure **"Auto-deploy on Push"** is enabled
3. Vercel automatically:
   - Deploys **Preview** for every PR
   - Deploys **Production** for every push to `main`/`master`

---

## Monitoring & Health Checks

After deployment, verify your app is healthy:

```bash
# Health check endpoint (returns JSON)
curl https://incidentiq.vercel.app/api/health
# (Replace with your actual Vercel URL after deployment)

# Expected response:
# {"success":true,"data":{"status":"healthy","timestamp":"..."}}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Build fails with TypeScript errors** | Run `npm run typecheck` locally and fix errors |
| **API returns 500 "OPENROUTER_API_KEY is not configured"** | Verify environment variable is set in Vercel dashboard |
| **API returns 504 Gateway Timeout** | The LLM analysis may take >10s. Upgrade to Vercel Pro for 60s timeout |
| **Blank page after deploy** | Check browser console for errors. Ensure `dist/` is set as output directory |
| **CSS not loading / broken layout** | Verify Tailwind config is valid. Run `npm run build` locally to test |
| **Login doesn't work** | Use credentials: `admin` / `admin` (mock auth) |

### Vercel Free Tier Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Serverless Functions | 100 GB-hours/month | IncidentIQ uses minimal compute |
| Function Duration | 10s (max) | AI analysis may be slower — upgrade to Pro |
| Bandwidth | 100 GB/month | Well within typical usage |
| Build Minutes | 6,000 min/month | CI + deployments |
| Team Members | Unlimited | Free for personal accounts |

---

## Upgrading

### Apply Updates

```bash
git pull origin main
npm ci
npm run check    # Verify quality
npm run build    # Verify build
git push origin main  # Auto-deploys to Vercel
```

### Rollback

In Vercel dashboard → **Deployments** → find the last working deployment → click **"..."** → **"Promote to Production"**

---

## Checklist Before Launch

- [ ] `OPENROUTER_API_KEY` set in Vercel environment variables
- [ ] Custom domain configured (if using)
- [ ] Health check endpoint returns `200 OK`
- [ ] App loads without console errors
- [ ] Login works (`admin`/`admin`)
- [ ] Incidents simulate correctly
- [ ] AI analysis button triggers investigation
- [ ] Responsive layout works on mobile/tablet
- [ ] Dark mode toggle works
- [ ] ESLint passes (`npm run lint`)
- [ ] TypeScript check passes (`npm run typecheck`)
- [ ] Production build succeeds (`npm run build`)