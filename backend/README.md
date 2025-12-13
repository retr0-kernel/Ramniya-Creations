# Ramniya Creations Backend

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)

---

## 🎯 Overview

Ramniya Creations Backend is a REST API built with Go for an e-commerce platform. It features JWT authentication, Google OAuth, Razorpay payment integration, Redis caching, and comprehensive admin capabilities.

**Key Features:**
- 🔐 JWT-based authentication with refresh tokens
- 🌐 Google OAuth 2.0 integration
- 💳 Razorpay payment gateway integration
- 📦 Product catalog with variants and images
- 🛒 Shopping cart and order management
- 👨‍💼 Role-based access control (Customer/Admin)
- ⚡ Redis caching for improved performance
- 📧 Email verification system
- 🔒 Rate limiting and security middleware
- 📊 Admin dashboard with analytics

---

## 🛠 Tech Stack

- **Language:** Go 1.21+
- **Web Framework:** Echo v4
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Authentication:** JWT (golang-jwt)
- **Payment:** Razorpay Go SDK
- **Email:** SMTP (development: file-based)
- **File Upload:** Local storage (production: S3-compatible)
- **Logging:** Zap
- **Migration:** golang-migrate

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Go** 1.21 or higher
- **PostgreSQL** 16
- **Redis** 7
- **Docker** & **Docker Compose** (optional, recommended)
- **Make** (optional, for convenience commands)

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/retr0-kernel/Ramniya-Creations.git
cd backend
```

### 2. Install Go Dependencies

```bash
go mod download
go mod verify
```

---

## ⚙️ Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Configure `.env`

```env
# Server Configuration
PORT=8080
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8080

# Database Configuration
DATABASE_URL=postgres://ramniya:ramniya_password@localhost:5432/ramniya?sslmode=disable

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY_HOURS=24
REFRESH_TOKEN_EXPIRY_DAYS=30

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Configuration (Development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@ramniyacreations.com
SMTP_FROM_NAME=Ramniya Creations

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
```

---

## 🗄️ Database Setup

### Option 1: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL and Redis
cd ..  # Go to project root
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Verify services are running
docker ps
```

### Option 2: Manual Installation

**PostgreSQL Setup:**
```bash
# Create database and user
psql postgres
CREATE DATABASE ramniya;
CREATE USER ramniya WITH ENCRYPTED PASSWORD 'ramniya_password';
GRANT ALL PRIVILEGES ON DATABASE ramniya TO ramniya;
\q
```

**Redis Setup:**
```bash
# Start Redis server
redis-server
```

### Run Migrations

```bash
cd backend

# Run all migrations
go run main.go migrate up

# Check migration status
go run main.go migrate version

# Rollback last migration (if needed)
go run main.go migrate down 1
```

---

## 🚀 Running the Application

### Development Mode

```bash
# Start the server
go run main.go

# Server starts on http://localhost:8080
```

### Production Build

```bash
# Build binary
go build -o ramniya-backend

# Run binary
./ramniya-backend
```

### With Live Reload (Optional)

```bash
# Run with air
air
```

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:8080
```

---

## 📞 Support

For issues, questions, or contributions:

- **Email:** ramniyacreations@gmail.com
- **GitHub Issues:** https://github.com/retr0-kernel/Ramniya-Creations/issues

---

## 🙏 Acknowledgments

- [Echo Framework](https://echo.labstack.com/)
- [Razorpay](https://razorpay.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [golang-jwt](https://github.com/golang-jwt/jwt)

---

**Made with ❤️ for Ramniya Creations**