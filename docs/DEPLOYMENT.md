# Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

**Cost:** Free tier available  
**Time:** 15-20 minutes  
**Difficulty:** Easy

---

## 🚀 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Ensure `frontend/package.json` has build script:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

2. Create `vercel.json` in frontend folder:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. **Import Project** → Select `air.ai` repository
4. **Configure:**
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Environment Variables:**
```bash
VITE_API_BASE_URL=https://your-backend.up.railway.app/api/v1
```

6. Click **Deploy**

7. After deployment, get your URL: `https://air-ai-xyz.vercel.app`

---

## 🚂 Backend Deployment (Railway)

### Step 1: Sign Up & Create Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Select `air.ai` repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Railway auto-generates `DATABASE_URL`

### Step 3: Add Redis

1. Click **+ New** again
2. Select **Database** → **Redis**
3. Railway auto-generates `REDIS_URL`

### Step 4: Configure Backend Service

1. Click on your `air.ai` service
2. Go to **Settings**:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

3. Go to **Variables** tab and add:

```bash
# Auto-provided by Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Generate these (see below)
JWT_SECRET=<your-64-char-secret>
JWT_REFRESH_SECRET=<your-different-64-char-secret>

# AI Provider (at least one)
OPENROUTER_API_KEY=sk-or-v1-...

# Security
NODE_ENV=production
CORS_ORIGIN=https://air-ai-xyz.vercel.app
PORT=5000
```

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 5: Run Database Migration

1. In Railway, open your backend service
2. Go to **Settings** → **Deploy**
3. Add **Init Command:** `npm run migrate`

**Or manually via CLI:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migration
railway run npm run migrate
```

### Step 6: Deploy

1. Railway will auto-deploy on push to `main`
2. Get your backend URL: `https://air-backend.up.railway.app`
3. Test health: `curl https://air-backend.up.railway.app/api/v1/health`

### Step 7: Update Frontend

Go back to Vercel:
1. **Settings** → **Environment Variables**
2. Update `VITE_API_BASE_URL` with Railway backend URL
3. **Redeploy**

---

## ✅ Verification Checklist

- [ ] Frontend loads at Vercel URL
- [ ] Backend health check responds: `/api/v1/health`
- [ ] Can register new user
- [ ] Can login
- [ ] Can create conversation
- [ ] Can send message and get AI response
- [ ] Metrics endpoint works: `/api/v1/metrics`

---

## 🔧 Post-Deployment Setup

### 1. Custom Domain (Optional)

**Vercel:**
- Settings → Domains → Add Domain
- Follow DNS instructions

**Railway:**
- Settings → Networking → Custom Domain
- Add CNAME record

### 2. Monitoring

**Railway:**
- Built-in metrics dashboard
- View logs in real-time

**External (Recommended):**
- [Better Stack](https://betterstack.com) - Free tier
- [Sentry](https://sentry.io) - Error tracking

### 3. Backups

**PostgreSQL:**
```bash
# Export from Railway
railway run pg_dump $DATABASE_URL > backup.sql

# Restore
railway run psql $DATABASE_URL < backup.sql
```

---

## 💰 Cost Estimates

### Free Tier Limits

**Vercel:**
- 100GB bandwidth/month
- Unlimited deployments
- Free SSL

**Railway:**
- $5 free credit/month
- Shared CPU
- 512MB RAM
- 1GB storage

**Estimated Monthly Cost:** $0-5

### Production Tier

**Vercel Pro:** $20/month
**Railway Pro:** ~$10-20/month (usage-based)

**Total:** ~$30-40/month

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Check Railway logs
railway logs

# Common issues:
# 1. Missing dependencies - check package.json
# 2. TypeScript errors - run `npm run typecheck` locally
# 3. Environment variables - verify all are set
```

### Database Connection Issues

```bash
# Test connection
railway run psql $DATABASE_URL -c "SELECT 1"

# Check migrations
railway run npm run migrate
```

### CORS Errors

Ensure backend `CORS_ORIGIN` matches frontend URL exactly:
```bash
CORS_ORIGIN=https://air-ai-xyz.vercel.app
```

---

## 📚 Alternative Deployment Options

### Option 2: Render.com (All-in-One)
- Free PostgreSQL database
- Free Redis
- Free web service (with sleep after inactivity)

### Option 3: Fly.io
- Docker-based deployment
- Global CDN
- Free tier: 3 VMs

### Option 4: AWS (Advanced)
- ECS Fargate
- RDS PostgreSQL
- ElastiCache Redis
- More complex but scalable

---

## 🔐 Security Checklist

- [ ] JWT secrets are strong (64+ characters)
- [ ] Environment variables are not in code
- [ ] CORS is properly configured
- [ ] HTTPS is enabled (automatic on Vercel/Railway)
- [ ] Database has strong password
- [ ] API rate limiting is enabled

---

## 📞 Support

If you encounter issues:
1. Check Railway/Vercel logs
2. Verify environment variables
3. Test health endpoint
4. Open an issue on GitHub

---

**Last Updated:** February 12, 2026
