# air.ai - AI-Powered Chat Application

Production-ready full-stack AI chat application built with TypeScript, React, Node.js, PostgreSQL, and Redis.

## 🚀 Features

- ✅ **Secure Authentication** - JWT-based auth with refresh tokens
- ✅ **AI Integration** - OpenRouter API for multiple AI models
- ✅ **Real-time Chat** - Conversation management with message history
- ✅ **Rate Limiting** - Redis-backed rate limiting
- ✅ **Monitoring** - Prometheus metrics and Winston logging
- ✅ **Dark Mode** - Theme switching support
- ✅ **Type Safety** - Full TypeScript coverage
- ✅ **Production Ready** - Docker, CI/CD, health checks

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose (optional)
- PostgreSQL 16+ (if running locally)
- Redis 7+ (if running locally)

## 🛠️ Installation

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/rajeevrajora77-lab/air.ai.git
cd air.ai

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env and add:
# - Your OpenRouter API key
# - Generate JWT secrets: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Start with Docker
docker-compose up -d

# Run migrations
docker exec -it air-backend npm run migrate
```

### Option 2: Local Development

```bash
# Clone repository
git clone https://github.com/rajeevrajora77-lab/air.ai.git
cd air.ai

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start PostgreSQL and Redis (Docker)
docker-compose up -d postgres redis

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run migrations
cd ../backend && npm run migrate

# Start development servers
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173 (dev) or http://localhost:3000 (docker)
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/api/v1/health
- **Metrics**: http://localhost:5000/api/v1/metrics

## 📚 API Documentation

### Authentication

```bash
# Register
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Refresh Token
POST /api/v1/auth/refresh
{
  "refreshToken": "your-refresh-token"
}
```

### Conversations

```bash
# Create conversation
POST /api/v1/conversations
Authorization: Bearer <token>
{
  "title": "My Chat"
}

# Send message
POST /api/v1/conversations/:id/messages
Authorization: Bearer <token>
{
  "content": "Hello AI!",
  "model": "openai/gpt-3.5-turbo"
}

# List conversations
GET /api/v1/conversations
Authorization: Bearer <token>
```

## 🏗️ Project Structure

```
air.ai/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── database/        # DB connections & migrations
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   ├── validators/      # Zod schemas
│   │   ├── app.ts          # Express app
│   │   └── server.ts       # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # API client & utils
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app
│   │   └── main.tsx        # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
npm run lint:fix
```

## 🚀 Deployment

### Environment Variables (Production)

**Backend:**
- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Strong secret (64+ chars)
- `JWT_REFRESH_SECRET` - Different strong secret
- `OPENROUTER_API_KEY` - Your API key
- `CORS_ORIGIN` - Frontend URL

**Frontend:**
- `VITE_API_BASE_URL` - Backend API URL

### Docker Production

```bash
# Build and push images
docker-compose build
docker tag air-backend your-registry/air-backend:latest
docker tag air-frontend your-registry/air-frontend:latest
docker push your-registry/air-backend:latest
docker push your-registry/air-frontend:latest

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

- **Health Check**: `GET /api/v1/health`
- **Prometheus Metrics**: `GET /api/v1/metrics`
- **Logs**: `backend/logs/` directory

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting (Redis-backed)
- Helmet.js security headers
- CORS protection
- Input validation (Zod)
- SQL injection prevention (parameterized queries)
- XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file

## 👨‍💻 Author

**Rajeev Rajora**
- GitHub: [@rajeevrajora77-lab](https://github.com/rajeevrajora77-lab)

## 🙏 Acknowledgments

- OpenRouter for AI API
- All open-source contributors

---

**Built with ❤️ using TypeScript, React, Node.js, PostgreSQL, and Redis**