package main

import (
	"context"
	"fmt"
	"os"

	"github.com/ramniya/ramniya-backend/auth"
	"github.com/ramniya/ramniya-backend/config"
	"github.com/ramniya/ramniya-backend/database"
	"github.com/ramniya/ramniya-backend/logger"
	"go.uber.org/zap"
)

func main() {
	if len(os.Args) < 4 {
		fmt.Println("Usage: go run create_admin.go <email> <password> <name>")
		fmt.Println("Example: go run create_admin.go admin@example.com SecurePass123 'Admin User'")
		os.Exit(1)
	}

	email := os.Args[1]
	password := os.Args[2]
	name := os.Args[3]

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	// Initialize logger
	if err := logger.Init(cfg.Environment); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	// Connect to database
	dbConfig := database.GetDefaultConfig(cfg.DatabaseURL)
	if err := database.Connect(dbConfig, logger.Log); err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	// Create auth repository
	authRepo := auth.NewAuthRepository(database.DB)

	// Create admin user
	ctx := context.Background()
	adminRole := auth.RoleAdmin

	user, err := authRepo.CreateUser(ctx, auth.CreateUserInput{
		Email:    email,
		Name:     &name,
		Password: &password,
		Role:     &adminRole,
	})

	if err != nil {
		logger.Fatal("Failed to create admin user", zap.Error(err))
	}

	// Mark as verified
	if err := authRepo.SetVerified(ctx, user.ID, true); err != nil {
		logger.Fatal("Failed to verify admin user", zap.Error(err))
	}

	fmt.Printf("✅ Admin user created successfully!\n")
	fmt.Printf("Email: %s\n", email)
	fmt.Printf("Password: %s\n", password)
	fmt.Printf("User ID: %s\n", user.ID.String())
	fmt.Printf("Role: admin\n")
	fmt.Printf("\nYou can now login with these credentials.\n")
}
