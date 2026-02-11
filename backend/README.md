# air.ai Backend

## 🚀 Production-Ready Express + TypeScript API

### Features

#### 🔒 Authentication & Security
- JWT access & refresh tokens
- Bcrypt password hashing (12 rounds)
- Token blacklisting on logout
- Rate limiting (Redis-backed)
- Security headers (Helmet)
- CORS configuration
- Input validation (Zod)

#### 🤖 Multi-Platform AI Support
**10 AI Provider Integrations:**
1. **OpenRouter** - Universal gateway (100+ models)
2. **OpenAI** - GPT-4, GPT-3.5-turbo
3. **Anthropic** - Claude 3 Opus, Sonnet, Haiku
4. **Google AI** - Gemini Pro, Gemini Ultra
5. **Cohere** - Command, Command-Light
6. **Mistral AI** - Mistral Large, Medium, Small
7. **Groq** - Fast inference (Llama, Mixtral)
8. **Together AI** - Open source models
9. **Replicate** - Various open source models
10. **HuggingFace** - Inference API

#### 📦 Database & Caching
- PostgreSQL with connection pooling
- Redis for caching & sessions
- Database transactions
- Health checks
- Automatic migrations

#### 📊 Monitoring & Observability
- Prometheus metrics
- Winston logging with daily rotation
- Request/response logging
- Performance tracking
- Error tracking

#### 🐛 Production Features
- TypeScript strict mode
- Error handling middleware
- Graceful shutdown
- Health & readiness endpoints
- Docker support
- CI/CD ready
- Jest testing

---

## 🛠️ Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values
```

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/airdb
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=airuser
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=airdb

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-64-char-secret-here
JWT_REFRESH_SECRET=your-64-char-refresh-secret-here

# CORS
CORS_ORIGIN=http://localhost:5173

# AI API Keys (at least one required)
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AI...
```

### Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE airdb;
CREATE USER airuser WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE airdb TO airuser;

# Run migrations
psql -U airuser -d airdb -f src/database/migrations/001_initial.sql
```

### Run Development Server

```bash
npm run dev
```

Server will start on http://localhost:5000

### Run Production

```bash
# Build
npm run build

# Start
npm start
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Environment configuration
│   ├── controllers/         # Route controllers
│   ├── database/            # DB connections & migrations
│   ├── middleware/          # Express middleware
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utilities
│   ├── validators/          # Zod schemas
│   ├── tests/               # Test files
│   ├── app.ts               # Express app
│   └── server.ts            # Server entry
├── .env.example
├── Dockerfile
├── jest.config.js
├── package.json
└── tsconfig.json
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh tokens
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout
- `POST /auth/change-password` - Change password

### User
- `GET /users/profile` - Get profile
- `PATCH /users/profile` - Update profile
- `DELETE /users/account` - Delete account
- `GET /users/stats` - Get user stats

### Conversations
- `GET /conversations/providers` - Get available AI providers
- `POST /conversations` - Create new conversation
- `GET /conversations` - List conversations
- `GET /conversations/:id` - Get conversation with messages
- `POST /conversations/:id/messages` - Send message
- `DELETE /conversations/:id` - Delete conversation

### Health & Monitoring
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /readiness` - Readiness probe
- `GET /liveness` - Liveness probe

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for detailed documentation.

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## 🐳 Docker

```bash
# Build image
docker build -t air-backend .

# Run container
docker run -p 5000:5000 --env-file .env air-backend
```

---

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

---

## 🔑 Demo Credentials

A test user is created automatically:

```
Email: demo@air.ai
Password: Test@1234
```

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5000/api/v1/health
```

### Prometheus Metrics
```bash
curl http://localhost:5000/api/v1/metrics
```

---

## ⚡ Performance

- Connection pooling (PostgreSQL)
- Redis caching for sessions & frequently accessed data
- Gzip compression
- Rate limiting to prevent abuse
- Query optimization with indexes

---

## 🔒 Security

- Password hashing with bcrypt
- JWT with short expiration
- Token blacklisting
- Rate limiting
- Input validation
- Security headers
- CORS protection
- SQL injection prevention

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials
psql -U airuser -d airdb
```

### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

---

## 📝 License

MIT