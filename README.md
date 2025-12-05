# 🎨 Ramniya Creations

A modern monorepo project with Go backend and React frontend.

## 🚀 Quick Start

### Start all services:
```bash
make dev
```

Or:
```bash
docker compose -f docker-compose.dev.yml up --build
```

### Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Health: http://localhost:8080/health

## 🛠️ Commands

- `make dev` - Start development
- `make down` - Stop containers
- `make clean` - Clean everything
- `make logs` - View logs

## 📦 Tech Stack

**Backend:** Go + Echo
**Frontend:** React + TypeScript + Vite
