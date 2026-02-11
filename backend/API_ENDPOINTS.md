# 📡 API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

All protected endpoints require JWT authentication via Bearer token:

```http
Authorization: Bearer <your_access_token>
```

---

## 🔐 Authentication Endpoints

### Register

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "role": "user",
      "isactive": true,
      "isverified": false,
      "createdat": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&#)

---

### Login

Authenticate and receive tokens.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

### Refresh Token

Get new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

### Get Current User

Get authenticated user's information.

**Endpoint:** `GET /auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

---

### Logout

Invalidate tokens.

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### Change Password

Change user's password.

**Endpoint:** `POST /auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewSecurePass@456"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

---

## 👤 User Endpoints

All user endpoints require authentication.

### Get Profile

**Endpoint:** `GET /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "role": "user",
      "isactive": true,
      "isverified": false,
      "createdat": "2024-01-01T00:00:00.000Z",
      "updatedat": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Update Profile

**Endpoint:** `PATCH /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newemail@example.com"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

---

### Get User Stats

**Endpoint:** `GET /users/stats`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalConversations": 15,
      "totalMessages": 234,
      "accountAge": 45
    }
  }
}
```

---

### Delete Account

**Endpoint:** `DELETE /users/account`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Account deleted successfully"
}
```

---

## 🤖 Conversation Endpoints

All conversation endpoints require authentication.

### Get Available Providers

Get list of configured AI providers.

**Endpoint:** `GET /conversations/providers`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "providers": [
      "openrouter",
      "openai",
      "anthropic",
      "google",
      "mistral"
    ]
  }
}
```

---

### Create Conversation

Start a new conversation with AI.

**Endpoint:** `POST /conversations`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "My First Chat",
  "initialMessage": "Hello! Tell me about yourself.",
  "provider": "openai",
  "model": "gpt-4-turbo-preview"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "conversation": {
      "id": "uuid",
      "userid": "uuid",
      "title": "My First Chat",
      "isarchived": false,
      "provider": "openai",
      "model": "gpt-4-turbo-preview",
      "createdat": "2024-01-01T00:00:00.000Z",
      "updatedat": "2024-01-01T00:00:00.000Z"
    },
    "message": {
      "id": "uuid",
      "conversationid": "uuid",
      "role": "user",
      "content": "Hello! Tell me about yourself.",
      "createdat": "2024-01-01T00:00:00.000Z"
    },
    "response": {
      "id": "uuid",
      "conversationid": "uuid",
      "role": "assistant",
      "content": "I'm an AI assistant...",
      "tokensused": 150,
      "model": "gpt-4-turbo-preview",
      "provider": "openai",
      "createdat": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### List Conversations

**Endpoint:** `GET /conversations`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `archived` (optional): Include archived (default: false)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "title": "My First Chat",
        "provider": "openai",
        "model": "gpt-4-turbo-preview",
        "createdat": "2024-01-01T00:00:00.000Z",
        "updatedat": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

---

### Get Conversation

Get conversation with all messages.

**Endpoint:** `GET /conversations/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "conversation": { /* conversation object */ },
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "Hello!",
        "createdat": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "role": "assistant",
        "content": "Hi there!",
        "tokensused": 50,
        "model": "gpt-4-turbo-preview",
        "provider": "openai",
        "createdat": "2024-01-01T00:00:01.000Z"
      }
    ]
  }
}
```

---

### Send Message

Send a message in existing conversation.

**Endpoint:** `POST /conversations/:id/messages`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Tell me more about that."
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "userMessage": { /* user message object */ },
    "aiMessage": { /* AI response object */ }
  }
}
```

---

### Delete Conversation

**Endpoint:** `DELETE /conversations/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Conversation deleted successfully"
}
```

---

## 💚 Health & Monitoring

### Health Check

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "environment": "production",
  "services": {
    "database": "up",
    "redis": "up"
  }
}
```

---

### Metrics

**Endpoint:** `GET /metrics`

**Response:** `200 OK` (Prometheus format)

---

## ❌ Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable error message"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing token |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT_ERROR` | 409 | Resource already exists |
| `RATE_LIMIT_ERROR` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `AI_SERVICE_ERROR` | 503 | AI provider error |

---

## 🔒 Rate Limits

| Endpoint | Limit |
|----------|-------|
| Authentication | 5 requests / 15 minutes |
| AI Requests | 20 requests / minute |
| General | 100 requests / 15 minutes |

---

## 🎯 Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (never in localStorage for sensitive apps)
3. **Refresh tokens before expiration**
4. **Handle rate limits gracefully**
5. **Implement exponential backoff for retries**
6. **Log out users on 401 errors**
7. **Validate all inputs on client-side too**