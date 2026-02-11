# air.ai - AI Chat Platform

**Production-Ready Full-Stack Application**

- 🤖 Multi-provider AI integration (10+ providers)
- 🔐 Secure authentication with JWT + token versioning
- 💬 Conversation management with message history
- ⚡ Redis caching with graceful degradation
- 📊 Prometheus metrics & health checks
- 🐳 Docker deployment ready
- 🔒 Production-grade security

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- At least one AI provider API key

### Local Development

```bash
# Clone repository
git clone https://github.com/rajeevrajora77-lab/air.ai.git
cd air.ai

# Backend setup
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run migrate
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Docker Deployment

```bash
# Create .env file
cp .env.example .env
# Edit .env with production values

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

---

## 🔧 Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-different-random-string>

# AI Provider (at least one)
OPENROUTER_API_KEY=sk-or-v1-...
```

### Optional AI Providers

- **OpenRouter** (recommended): Access to 100+ models
- **OpenAI**: GPT-4, GPT-3.5
- **Anthropic**: Claude 3 Opus/Sonnet/Haiku
- **Google AI**: Gemini Pro
- **Cohere, Mistral, Groq, Together AI, Replicate, HuggingFace**

See `.env.example` for all options.

---

## 📁 Project Structure

```
air.ai/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, validation, rate limiting
│   │   ├── routes/           # API routes
│   │   ├── database/         # Postgres & Redis clients
│   │   ├── validators/       # Zod schemas
│   │   ├── utils/            # Errors, logger, metrics
│   │   ├── app.ts            # Express app
│   │   ├── server.ts         # Server startup
│   │   └── config/           # Configuration
│   ├── scripts/              # Migration scripts
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── stores/           # Zustand state
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # API client
│   │   └── App.tsx
│   ├── nginx.conf
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## 🔐 Security Features

- ✅ **Token versioning** - Immediate token invalidation on password change
- ✅ **Rate limiting** - Protection against brute-force attacks
- ✅ **Helmet.js** - Security headers
- ✅ **CORS** - Configurable origin
- ✅ **Bcrypt** - Password hashing (12 rounds)
- ✅ **Request timeout** - 30-second limit
- ✅ **SQL injection protection** - Parameterized queries
- ✅ **XSS protection** - Content Security Policy

---

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh tokens
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/change-password` - Change password

### Users
- `GET /api/v1/users/me` - Get profile
- `PATCH /api/v1/users/me` - Update profile
- `GET /api/v1/users/me/stats` - Get usage stats
- `GET /api/v1/users` - List users (admin)

### Conversations
- `POST /api/v1/conversations` - Create conversation
- `GET /api/v1/conversations` - List conversations
- `GET /api/v1/conversations/:id` - Get conversation
- `PATCH /api/v1/conversations/:id` - Update conversation
- `DELETE /api/v1/conversations/:id` - Delete conversation
- `GET /api/v1/conversations/:id/messages` - Get messages
- `POST /api/v1/conversations/:id/messages` - Send message

### Monitoring
- `GET /api/v1/health` - Health check
- `GET /api/v1/metrics` - Prometheus metrics
- `GET /ping` - Simple ping

---

## 🧪 Testing

```bash
# Backend
cd backend
npm run test
npm run test:coverage
npm run lint
npm run typecheck

# Frontend
cd frontend
npm run test
npm run lint
npm run type-check
```

---

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:5000/api/v1/health
```

### Metrics (Prometheus)
```bash
curl http://localhost:5000/api/v1/metrics
```

Metrics include:
- HTTP request duration
- Active connections
- AI request latency
- Database query performance

---

## 🐛 Troubleshooting

### App won't start
```bash
# Check environment variables
cat backend/.env

# Test database connection
psql $DATABASE_URL

# Test Redis connection
redis-cli -u $REDIS_URL ping
```

### TypeScript errors
```bash
cd backend
npm run typecheck
```

### Migration issues
```bash
cd backend
npm run migrate:rollback
npm run migrate
```

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

- OpenRouter for multi-model API access
- All the amazing open-source packages used

---

**Status:** ✅ Production Ready

**Last Audit:** February 12, 2026
