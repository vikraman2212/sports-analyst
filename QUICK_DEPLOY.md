# 🚀 Quick Deployment Guide

## Choose Your Deployment Method

### 1️⃣ **Fastest: Vercel (Frontend Only)** ⚡

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

**Pros:** Free tier, automatic SSL, global CDN, zero config  
**Cons:** Backend requires separate deployment  
**Time:** ~5 minutes

---

### 2️⃣ **Full Stack: Docker Compose** 🐳

```bash
# Quick start
./deploy.sh

# Or manually
docker-compose up --build -d
```

**Pros:** Frontend + Backend together, runs anywhere  
**Cons:** Requires Docker knowledge  
**Time:** ~10 minutes

**Access:**

- Frontend: http://localhost:3000
- Backend: http://localhost:8000/docs

---

### 3️⃣ **Production: Cloud Platform** ☁️

#### **Vercel (Frontend) + Railway (Backend)**

**Frontend:**

1. Push to GitHub
2. Import to Vercel
3. Set root directory: `frontend`
4. Deploy

**Backend:**

1. Create Railway project
2. Connect GitHub repo
3. Select `Dockerfile.backend`
4. Deploy

**Cost:** ~$5/month  
**Time:** ~15 minutes

---

## Environment Variables

Create `.env` in project root:

```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

For production, set these in your hosting platform:

**Vercel:**

```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-backend.railway.app
```

**Railway:**

```bash
railway variables set BACKEND_HOST=0.0.0.0
```

---

## Current Architecture

```
┌─────────────────────┐
│   Next.js Frontend  │  ← Runs in browser
│   (Port 3000)       │  ← ONNX Runtime Web (client-side ML)
│                     │  ← All inference happens here
└──────────┬──────────┘
           │
           │ (Optional API calls)
           │
           ▼
┌─────────────────────┐
│  FastAPI Backend    │  ← Optional (for training/storage)
│  (Port 8000)        │  ← Currently minimal starter
└─────────────────────┘
```

**Important:** Your app currently runs **entirely in the browser**. The backend is optional and only needed for:

- Model training
- Data storage
- Heavy computation
- Advanced analytics

---

## Quick Commands

```bash
# Local development
cd frontend && npm run dev          # Frontend dev server
python backend/main.py              # Backend dev server

# Docker
docker-compose up                   # Start all services
docker-compose logs -f              # View logs
docker-compose down                 # Stop services

# Deployment
vercel --prod                       # Deploy to Vercel
./deploy.sh                         # Docker deployment

# Health checks
curl http://localhost:3000          # Frontend
curl http://localhost:8000/health   # Backend
```

---

## Platform-Specific Guides

### Vercel

- **Docs:** https://vercel.com/docs
- **Build:** `npm run build`
- **Framework:** Next.js (auto-detected)

### Railway

- **Docs:** https://docs.railway.app
- **Config:** Uses `Dockerfile.backend`
- **Port:** 8000 (auto-detected)

### Docker

- **Docs:** See `DEPLOYMENT.md`
- **Compose:** `docker-compose.yml`
- **Images:** Node 20 Alpine, Python 3.11 Slim

---

## Troubleshooting

**Frontend won't build:**

```bash
rm -rf frontend/.next frontend/node_modules
cd frontend && npm ci && npm run build
```

**Backend won't start:**

```bash
pip install -r backend/requirements.txt
python backend/main.py
```

**CORS errors:**

- Check `NEXT_PUBLIC_API_URL` is set
- Add frontend URL to backend CORS origins

**Port already in use:**

```bash
# Kill process on port 3000 or 8000
lsof -ti:3000 | xargs kill -9
```

---

## Next Steps

1. ✅ Choose deployment method above
2. ✅ Set environment variables
3. ✅ Deploy frontend
4. ⭐ (Optional) Deploy backend
5. ⭐ Configure custom domain
6. ⭐ Set up monitoring

For detailed guides, see `DEPLOYMENT.md`

---

## Cost Comparison

| Platform         | Frontend | Backend  | Total/mo |
| ---------------- | -------- | -------- | -------- |
| Vercel + Railway | Free     | $5       | **$5**   |
| Vercel + Render  | Free     | Free\*   | **Free** |
| DigitalOcean     | $12      | Included | **$12**  |
| AWS (EC2)        | $5       | $15      | **$20**  |
| Self-hosted      | Free     | Free     | **Free** |

\*Render free tier has limitations (spins down after inactivity)

---

## Support

- 📖 Full guide: `DEPLOYMENT.md`
- 🐛 Issues: Create GitHub issue
- 💬 Questions: Check project README
