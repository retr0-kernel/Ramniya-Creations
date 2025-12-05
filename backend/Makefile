.PHONY: help setup build run test test-coverage migrate-up migrate-down clean deps lint

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Run initial setup
	@chmod +x setup.sh
	@./setup.sh

deps: ## Download dependencies
	@echo "📦 Downloading dependencies..."
	@go mod download
	@go mod tidy

build: ## Build the application
	@echo "🔨 Building..."
	@go build -o bin/ramniya-backend main.go
	@echo "✅ Build complete: bin/ramniya-backend"

build-prod: ## Build for production (static binary)
	@echo "🔨 Building for production..."
	@CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o bin/ramniya-backend main.go
	@echo "✅ Production build complete: bin/ramniya-backend"

run: ## Run the application
	@echo "🚀 Starting server..."
	@go run main.go

test: ## Run tests
	@echo "🧪 Running tests..."
	@go test ./... -v

test-coverage: ## Run tests with coverage
	@echo "🧪 Running tests with coverage..."
	@go test ./... -coverprofile=coverage.out
	@go tool cover -html=coverage.out -o coverage.html
	@echo "✅ Coverage report: coverage.html"

migrate-up: ## Run database migrations
	@echo "🔄 Running migrations..."
	@go run main.go migrate up

migrate-down: ## Rollback last migration (requires golang-migrate)
	@echo "⏪ Rolling back migration..."
	@migrate -path migrations -database "$(DATABASE_URL)" down 1

migrate-status: ## Check migration status (requires golang-migrate)
	@migrate -path migrations -database "$(DATABASE_URL)" version

lint: ## Run linter
	@echo "🔍 Running linter..."
	@golangci-lint run

format: ## Format code
	@echo "💅 Formatting code..."
	@go fmt ./...
	@goimports -w .

clean: ## Clean build artifacts
	@echo "🧹 Cleaning..."
	@rm -rf bin/
	@rm -f coverage.out coverage.html
	@echo "✅ Clean complete"

docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	@docker build -t ramniya-backend:latest .

docker-run: ## Run Docker container
	@echo "🐳 Running Docker container..."
	@docker run -p 8080:8080 --env-file .env ramniya-backend:latest

install-tools: ## Install development tools
	@echo "🔧 Installing development tools..."
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install golang.org/x/tools/cmd/goimports@latest
	@go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	@echo "✅ Tools installed"