# 🚀 Production Deployment Guide

## Prerequisites

- Domain name with SSL certificate
- PostgreSQL database (AWS RDS / Railway / Supabase)
- Redis instance (AWS ElastiCache / Railway / Upstash)
- Server (AWS EC2 / DigitalOcean / Railway)

## Option 1: Deploy to Railway (Easiest)

### 1. Create Railway Account

```bash
npm install -g @railway/cli
railway login
```

### 2. Initialize Project

```bash
railway init
```

### 3. Add PostgreSQL & Redis

Go to Railway dashboard:
- Click "New" → "Database" → "PostgreSQL"
- Click "New" → "Database" → "Redis"

### 4. Deploy Backend

```bash
cd backend
railway up
```

### 5. Deploy Frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel --prod
```

## Option 2: Deploy to AWS (Production Scale)

### 1. Setup RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier air-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword \
  --allocated-storage 20
```

### 2. Setup ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id air-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### 3. Deploy with Docker Compose

On your EC2 instance:

```bash
# Clone repository
git clone https://github.com/rajeevrajora77-lab/air.ai.git
cd air.ai

# Create .env file with production values
cp backend/.env.example backend/.env
nano backend/.env

# Start services
docker-compose up -d
```

### 4. Setup Nginx Reverse Proxy

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/air
```

```nginx
# HTTP - redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
    }
}
```

## Option 3: Docker Deployment (Any Server)

### 1. Setup Environment

```bash
# Clone repository
git clone https://github.com/rajeevrajora77-lab/air.ai.git
cd air.ai

# Copy and configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with your production values
nano backend/.env
nano frontend/.env
```

### 2. Generate JWT Secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Check Status

```bash
docker-compose ps
docker-compose logs -f
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable SSL/TLS (Let's Encrypt)
- [ ] Setup firewall (only ports 80, 443, 22)
- [ ] Enable database backups
- [ ] Setup monitoring (Sentry, Grafana)
- [ ] Configure rate limiting
- [ ] Enable CORS only for your domain
- [ ] Regular security updates

## Monitoring Setup

### Prometheus + Grafana

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

Access Grafana: `http://your-server:3000`

## Backup Strategy

### Automated Daily Backups

```bash
# Add to crontab
0 2 * * * /usr/local/bin/backup-db.sh
```

### Backup Script

```bash
#!/bin/bash
pg_dump -h localhost -U airuser airdb > backup-$(date +%Y%m%d).sql
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-backup-bucket/
```

## Performance Optimization

1. **Database**:
   - Query optimization
   - Connection pooling
   - Indexes on frequently queried columns

2. **Caching**:
   - Redis for sessions
   - API response caching
   - Cache invalidation strategy

3. **Frontend**:
   - Use CDN for static assets
   - Enable gzip compression
   - Code splitting

## Troubleshooting

### Backend not starting

```bash
docker-compose logs backend
```

### Database connection failed

Check `DATABASE_URL` in `.env` and verify PostgreSQL is running.

### Redis connection failed

Check `REDIS_URL` in `.env` and verify Redis is running.

## Scaling

### Horizontal Scaling

1. Use load balancer (AWS ALB / Nginx)
2. Run multiple backend instances
3. Configure sticky sessions
4. Use database read replicas

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Implement caching strategy

## Support

For issues or questions:
- GitHub Issues: https://github.com/rajeevrajora77-lab/air.ai/issues
- Documentation: https://github.com/rajeevrajora77-lab/air.ai/docs