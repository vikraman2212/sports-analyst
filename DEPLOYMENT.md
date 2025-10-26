# Deployment Guide

## Quick Start Options

### Option 1: Docker Compose (Recommended for Full Stack)

**Prerequisites:**

- Docker & Docker Compose installed
- Node.js 20+ (for local dev)
- Python 3.11+ (for local dev)

**Steps:**

1. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Build and run:**

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

3. **Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Nginx (if enabled): http://localhost

---

### Option 2: Vercel (Frontend Only - Serverless)

**Best for**: Fast deployment without backend setup

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Deploy frontend:**

```bash
cd frontend
vercel
```

3. **Configure environment:**

```bash
# Set production API URL
vercel env add NEXT_PUBLIC_API_URL
```

4. **Deploy backend separately** (choose one):
   - **Railway**: https://railway.app
   - **Render**: https://render.com
   - **Fly.io**: https://fly.io
   - **AWS Lambda** (serverless)

---

### Option 3: Manual Deployment (VPS/Cloud)

#### Frontend (Next.js):

```bash
cd frontend

# Install dependencies
npm ci --production

# Build
npm run build

# Start production server
npm start
```

#### Backend (FastAPI):

```bash
# Install dependencies
pip install -e ".[dev]"
pip install fastapi uvicorn[standard]

# Run production server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Platform-Specific Guides

### Vercel + Railway

**Frontend on Vercel:**

1. Connect GitHub repo
2. Set root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `.next`
5. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`

**Backend on Railway:**

1. Create new project from GitHub
2. Select `Dockerfile.backend`
3. Set port: `8000`
4. Deploy

### AWS (EC2 + S3)

**Frontend:**

- Build static export: `npm run build`
- Upload to S3 with CloudFront
- Or run on EC2 with PM2

**Backend:**

- Deploy FastAPI on EC2
- Use Nginx as reverse proxy
- Set up SSL with Let's Encrypt

### DigitalOcean App Platform

1. Create new app from GitHub
2. Configure two components:
   - **Web Service** (frontend): `frontend/` directory
   - **Web Service** (backend): Root directory, use `Dockerfile.backend`

---

## Production Checklist

### Frontend:

- [ ] Enable `output: 'standalone'` in `next.config.ts` ✅
- [ ] Set `NEXT_PUBLIC_API_URL` environment variable
- [ ] Configure CORS for API requests
- [ ] Add error monitoring (Sentry)
- [ ] Enable analytics (optional)
- [ ] Optimize images and assets
- [ ] Set up CDN for static files

### Backend:

- [ ] Create FastAPI app structure
- [ ] Configure CORS origins
- [ ] Add authentication/API keys
- [ ] Set up database (if needed)
- [ ] Enable request logging
- [ ] Add rate limiting
- [ ] Configure health check endpoint
- [ ] Set up monitoring

### Security:

- [ ] Use HTTPS (SSL/TLS certificates)
- [ ] Set secure headers
- [ ] Validate all inputs
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Sanitize error messages
- [ ] Use environment variables for secrets

### Performance:

- [ ] Enable gzip/brotli compression
- [ ] Configure caching headers
- [ ] Optimize bundle size
- [ ] Use image optimization
- [ ] Enable CDN
- [ ] Set up database connection pooling

---

## Monitoring & Logging

### Recommended Tools:

- **Frontend**: Vercel Analytics, Sentry
- **Backend**: Prometheus + Grafana, Datadog
- **Logs**: CloudWatch, LogRocket, Papertrail

### Health Checks:

```bash
# Frontend
curl http://localhost:3000/

# Backend
curl http://localhost:8000/health
```

---

## Troubleshooting

### Frontend build fails:

```bash
# Clear cache
rm -rf frontend/.next
rm -rf frontend/node_modules
npm ci
npm run build
```

### Backend not connecting:

```bash
# Check if running
curl http://localhost:8000/health

# View logs
docker-compose logs backend
```

### CORS errors:

- Add frontend URL to backend CORS origins
- Check `NEXT_PUBLIC_API_URL` is set correctly

---

## Cost Estimates

### Free Tier Options:

- **Vercel**: Free for hobby projects
- **Railway**: $5/month (500 hours free)
- **Render**: Free tier available
- **Fly.io**: Free allowance included

### Paid Options:

- **AWS**: ~$20-50/month (EC2 t3.micro + RDS)
- **DigitalOcean**: $12-24/month (droplet)
- **Vercel Pro**: $20/month

---

## Next Steps

1. Choose deployment platform
2. Set up CI/CD (GitHub Actions)
3. Configure environment variables
4. Deploy and test
5. Set up monitoring
6. Configure custom domain
7. Enable SSL certificate

For detailed platform guides, see:

- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
