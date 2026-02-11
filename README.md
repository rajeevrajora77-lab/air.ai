# 🚀 air.ai - Production AI Platform

A production-ready, full-stack AI chat platform with beautiful themes, real-time streaming, and enterprise-grade security.

## ✨ Features

### Frontend
- 🎨 **Beautiful UI** - Modern, responsive design with dark mode
- 💬 **Real-time Chat** - Streaming AI responses with typing effects
- 📁 **File Uploads** - Attach and analyze files in conversations
- 🤖 **Multiple AI Models** - Support for various LLM providers via OpenRouter
- 📱 **Responsive Design** - Works seamlessly on all devices

### Backend
- 🔐 **JWT Authentication** - Secure login/signup with refresh tokens
- 🗄️ **PostgreSQL Database** - Persistent conversation storage
- ⚡ **Redis Caching** - Fast session and data caching
- 📊 **Prometheus Metrics** - Production monitoring
- 🛡️ **Rate Limiting** - API protection
- ✅ **Unit Tests** - Comprehensive test coverage (70%+)
- 🐳 **Docker Support** - Easy deployment

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   React     │────▶│   Express   │────▶│ PostgreSQL   │
│   (Vite)    │     │  (Node.js)  │     │   Database   │
└─────────────┘     └─────────────┘     └──────────────┘
                             │
                             ▼
                    ┌─────────────┐
                    │    Redis    │
                    │   (Cache)   │
                    └─────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/rajeevrajora77-lab/air.ai.git
cd air.ai

# Install all dependencies
npm run install:all

# Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Start development servers
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/v1
- Health Check: http://localhost:5000/api/v1/health

### Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Docker Deployment](docs/DOCKER.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
cd backend && npm test

# Frontend tests only
cd frontend && npm test
```

## 🔒 Security Features

- ✅ JWT with refresh token rotation
- ✅ Password hashing with bcrypt
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ Input validation (Zod)
- ✅ Token blacklisting

## 📊 Monitoring

- **Prometheus Metrics**: `/api/v1/metrics`
- **Health Check**: `/api/v1/health`
- **Detailed Health**: `/api/v1/health/detailed`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) for AI API
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Express.js](https://expressjs.com) for backend framework
- [React](https://react.dev) for frontend library

---

⭐ Star this repo if you find it helpful!