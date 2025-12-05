#!/bin/bash
set -e

echo "🚀 Setting up Ramniya Creations Backend..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${GREEN}📦 Installing Go dependencies...${NC}"
go mod download
go mod tidy

# Step 2: Create PostgreSQL database
echo -e "${GREEN}🗄️  Setting up PostgreSQL database...${NC}"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Please install PostgreSQL.${NC}"
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Database configuration
DB_NAME="ramniya_creations"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Create database (if it doesn't exist)
echo "Creating database: $DB_NAME"

# Try to create database (ignore error if it already exists)
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

echo -e "${GREEN}✅ Database created/exists${NC}"

# Step 3: Set up environment variables
echo -e "${GREEN}📝 Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  .env file created from .env.example. Please update with your actual values.${NC}"
else
    echo "✅ .env file already exists"
fi

# Step 4: Run migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
export DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable"
go run main.go migrate up

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "🎯 Next steps:"
echo "  1. Update .env file with your actual configuration values"
echo "  2. Run the server: go run main.go"
echo "  3. Or build and run: go build && ./ramniya-backend"
echo ""
echo "📚 Available commands:"
echo "  go run main.go              - Start the server"
echo "  go run main.go migrate up   - Run migrations"
echo "  go test ./...               - Run tests"
echo ""