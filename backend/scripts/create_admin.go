package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/ramniya/ramniya-backend/config"
	"github.com/ramniya/ramniya-backend/database"
	"github.com/ramniya/ramniya-backend/logger"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// CreateAdminUser creates an admin user
func CreateAdminUser(name, email, password string) error {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load configuration: %w", err)
	}

	// Initialize logger
	if err := logger.Init(cfg.Environment); err != nil {
		return fmt.Errorf("failed to initialize logger: %w", err)
	}
	defer logger.Sync()

	// Connect to database
	dbConfig := database.GetDefaultConfig(cfg.DatabaseURL)
	if err := database.Connect(dbConfig, logger.Log); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer database.Close()

	ctx := context.Background()

	// Check if user already exists
	var exists bool
	err = database.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", email).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check user existence: %w", err)
	}

	if exists {
		// Update existing user to admin
		_, err = database.DB.ExecContext(ctx, "UPDATE users SET role = 'admin', is_verified = TRUE WHERE email = $1", email)
		if err != nil {
			return fmt.Errorf("failed to update user to admin: %w", err)
		}

		logger.Log.Info("Updated existing user to admin",
			zap.String("email", email),
		)

		fmt.Printf("✅ User '%s' updated to admin role\n", email)
		return nil
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Create new admin user
	userID := uuid.New()
	query := `
		INSERT INTO users (id, name, email, password_hash, role, is_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, TRUE, $6, $6)
	`

	_, err = database.DB.ExecContext(
		ctx, query,
		userID, name, email, string(hashedPassword), "admin", time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	logger.Log.Info("Created new admin user",
		zap.String("user_id", userID.String()),
		zap.String("email", email),
		zap.String("name", name),
	)

	fmt.Printf("✅ Admin user created successfully\n")
	fmt.Printf("   ID:    %s\n", userID.String())
	fmt.Printf("   Name:  %s\n", name)
	fmt.Printf("   Email: %s\n", email)
	fmt.Printf("   Role:  admin\n")

	return nil
}

func main() {
	// Default values
	name := "Admin User"
	email := "admin@ramniyacreations.com"
	password := "admin123"

	// Get values from environment or command line
	if envName := os.Getenv("ADMIN_NAME"); envName != "" {
		name = envName
	}
	if envEmail := os.Getenv("ADMIN_EMAIL"); envEmail != "" {
		email = envEmail
	}
	if envPassword := os.Getenv("ADMIN_PASSWORD"); envPassword != "" {
		password = envPassword
	}

	// Parse command line arguments
	if len(os.Args) > 1 {
		email = os.Args[1]
	}
	if len(os.Args) > 2 {
		password = os.Args[2]
	}
	if len(os.Args) > 3 {
		name = os.Args[3]
	}

	fmt.Println("🔧 Creating admin user...")
	fmt.Printf("   Email: %s\n", email)
	fmt.Printf("   Name:  %s\n", name)
	fmt.Println()

	if err := CreateAdminUser(name, email, password); err != nil {
		fmt.Fprintf(os.Stderr, "❌ Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("⚠️  IMPORTANT: Change the default password immediately!")
	fmt.Println("   Login at: POST /api/auth/login")
	fmt.Printf("   Email: %s\n", email)
	fmt.Printf("   Password: %s\n", password)
}
