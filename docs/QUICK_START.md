# ⚡ Quick Start Guide

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/rajeevrajora77-lab/air.ai.git
cd air.ai
```

### 2. Install Dependencies

```bash
npm run install:all
```

This will install dependencies for:
- Root workspace
- Backend
- Frontend

### 3. Setup Environment Variables

#### Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and configure:

```env
# Database (use Docker or local PostgreSQL)
DATABASE_URL=postgresql://airuser:airpass@localhost:5432/airdb

# Redis (use Docker or local Redis)
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate new ones)
JWT_SECRET=your-secret-key-here-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-chars

# OpenRouter API (get from https://openrouter.ai)
OPENROUTER_API_KEY=your-openrouter-api-key
```

#### Frontend

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 4. Start Services

#### Option A: Start Everything at Once

```bash
npm run dev
```

This starts both backend and frontend concurrently.

#### Option B: Start Services Separately

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

### 5. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/api/v1/health
- **Metrics**: http://localhost:5000/api/v1/metrics

## Using Docker (Easiest)

### 1. Install Docker

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Mac/Windows)
- [Docker Engine](https://docs.docker.com/engine/install/) (Linux)

### 2. Start All Services

```bash
# Create .env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your OpenRouter API key

# Start everything
docker-compose up -d
```

### 3. Check Status

```bash
docker-compose ps
```

### 4. View Logs

```bash
docker-compose logs -f
```

### 5. Stop Services

```bash
docker-compose down
```

## Database Setup

### Local PostgreSQL

```bash
# Create database
creatdb airdb

# Or using psql
psql -U postgres
CREATE DATABASE airdb;
```

### Run Migrations

```bash
cd backend
npm run migrate
```

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Run All Tests

```bash
npm test
```

## Development Commands

### Backend

```bash
cd backend

# Start development server
npm run dev

# Run tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production
npm run build

# Start production server
npm start
```

### Frontend

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Common Issues

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Database Connection Error

1. Check PostgreSQL is running
2. Verify `DATABASE_URL` in `.env`
3. Check database exists: `psql -l`

### Redis Connection Error

1. Check Redis is running: `redis-cli ping`
2. Verify `REDIS_URL` in `.env`
3. Start Redis: `redis-server`

## Next Steps

1. Read [API Documentation](./API.md)
2. Check [Architecture Overview](./ARCHITECTURE.md)
3. Review [Deployment Guide](./DEPLOYMENT.md)
4. Explore [Frontend Components](../frontend/src/components)
5. Review [Backend Services](../backend/src/services)

## Getting Help

- **Documentation**: Check `/docs` folder
- **Issues**: https://github.com/rajeevrajora77-lab/air.ai/issues
- **Discussions**: https://github.com/rajeevrajora77-lab/air.ai/discussions