# 📋 Project Structure

## Overview

```
air.ai/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   │   └── index.ts      # Config with Zod validation
│   │   ├── controllers/     # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── conversation.controller.ts
│   │   ├── database/        # Database connections
│   │   │   ├── postgres.ts   # PostgreSQL pool
│   │   │   ├── redis.ts      # Redis client
│   │   │   └── migrations/   # SQL migration files
│   │   ├── middleware/      # Express middleware
│   │   │   ├── auth.ts       # JWT authentication
│   │   │   ├── errorHandler.ts
│   │   │   ├── validator.ts  # Zod validation
│   │   │   ├── rateLimiter.ts
│   │   │   └── metrics.ts    # Prometheus metrics
│   │   ├── routes/          # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── conversation.routes.ts
│   │   │   ├── health.routes.ts
│   │   │   └── index.ts      # Main router
│   │   ├── services/        # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── conversation.service.ts
│   │   ├── utils/           # Utility functions
│   │   │   ├── logger.ts     # Winston logger
│   │   │   ├── errors.ts     # Custom error classes
│   │   │   └── metrics.ts    # Prometheus metrics
│   │   ├── validators/      # Zod schemas
│   │   │   ├── auth.validator.ts
│   │   │   ├── user.validator.ts
│   │   │   └── conversation.validator.ts
│   │   ├── tests/           # Test files
│   │   │   ├── setup.ts
│   │   │   └── auth.service.test.ts
│   │   ├── app.ts           # Express app configuration
│   │   └── server.ts        # Server entry point
│   ├── .env.example
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Authentication components
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   └── chat/        # Chat interface components
│   │   │       ├── ChatInterface.tsx
│   │   │       ├── Message.tsx
│   │   │       ├── ChatInput.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── stores/          # Zustand state management
│   │   │   ├── authStore.ts
│   │   │   └── chatStore.ts
│   │   ├── lib/             # Utilities
│   │   │   ├── api.ts       # Axios client with interceptors
│   │   │   └── utils.ts     # Helper functions
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── useTheme.tsx
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── .env.example
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # GitHub Actions CI/CD
├── docs/                   # Documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   ├── QUICK_START.md      # Quick start guide
│   ├── PROJECT_STRUCTURE.md # This file
│   ├── API.md              # API documentation
│   └── ARCHITECTURE.md     # Architecture overview
├── .gitignore
├── docker-compose.yml
├── LICENSE
├── package.json
└── README.md
```

## Key Components

### Backend Architecture

#### Config Layer
- **Environment validation** with Zod schemas
- **Type-safe configuration** throughout the app

#### Database Layer
- **PostgreSQL**: Main data store
- **Redis**: Session management and caching
- **Connection pooling** for optimal performance
- **Health checks** for monitoring

#### Service Layer
- **AuthService**: User registration, login, JWT management
- **UserService**: Profile management, user stats
- **ConversationService**: Chat management, AI integration

#### Controller Layer
- **Request validation** with Zod
- **Error handling** with custom error classes
- **Async/await** patterns with proper error catching

#### Middleware
- **Authentication**: JWT verification and token refresh
- **Authorization**: Role-based access control
- **Rate limiting**: Redis-backed rate limiters
- **Validation**: Zod schema validation
- **Error handling**: Global error handler
- **Metrics**: Prometheus instrumentation

#### Routes
- **RESTful API** design
- **Versioned endpoints** (`/api/v1`)
- **Health checks** for monitoring
- **Metrics endpoint** for Prometheus

### Frontend Architecture

#### State Management
- **Zustand**: Lightweight state management
- **Persistent storage**: Local storage integration
- **Type-safe stores**: Full TypeScript support

#### Components
- **Auth components**: Login, Register
- **Chat components**: Interface, Messages, Input, Sidebar
- **Reusable UI components**

#### API Client
- **Axios instance** with interceptors
- **Automatic token refresh**
- **Error handling** with toast notifications
- **Request/response logging**

#### Styling
- **Tailwind CSS**: Utility-first CSS
- **Dark mode support**
- **Responsive design**
- **Custom scrollbar styles**

### CI/CD Pipeline

#### GitHub Actions Workflow
1. **Backend tests**: Unit tests with Jest
2. **Frontend tests**: Build validation
3. **Docker builds**: Multi-stage optimized builds
4. **Deployment**: Automated deployment to production

### Docker Setup

#### Services
- **PostgreSQL**: Database with persistent volumes
- **Redis**: Cache with persistent volumes
- **Backend**: Node.js API server
- **Frontend**: Nginx-served React app

#### Features
- **Health checks** for all services
- **Automatic restarts**
- **Network isolation**
- **Volume management**

## Development Workflow

### 1. Feature Development
```bash
git checkout -b feature/new-feature
# Make changes
npm run dev
```

### 2. Testing
```bash
npm test
npm run lint
```

### 3. Commit
```bash
git add .
git commit -m "feat: add new feature"
```

### 4. Push & PR
```bash
git push origin feature/new-feature
# Create PR on GitHub
```

### 5. CI/CD
- GitHub Actions runs tests
- On merge to main, deploys to production

## Best Practices

### Backend
- ✅ Use TypeScript for type safety
- ✅ Validate all inputs with Zod
- ✅ Handle errors properly
- ✅ Log important events
- ✅ Write tests for services
- ✅ Use transactions for multi-step operations
- ✅ Implement caching for frequently accessed data

### Frontend
- ✅ Use TypeScript
- ✅ Component composition
- ✅ State management with Zustand
- ✅ Error boundaries
- ✅ Loading states
- ✅ Responsive design
- ✅ Accessibility (a11y)

### Security
- ✅ Never commit `.env` files
- ✅ Use strong JWT secrets
- ✅ Implement rate limiting
- ✅ Validate all inputs
- ✅ Use HTTPS in production
- ✅ Regular dependency updates

## Next Steps

1. Implement source code following the structure
2. Add comprehensive tests
3. Setup monitoring and alerting
4. Deploy to production
5. Monitor and iterate

## Resources

- [Backend Documentation](../backend/README.md)
- [Frontend Documentation](../frontend/README.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)