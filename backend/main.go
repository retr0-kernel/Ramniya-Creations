package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/ramniya/ramniya-backend/auth"
	"github.com/ramniya/ramniya-backend/config"
	"github.com/ramniya/ramniya-backend/database"
	"github.com/ramniya/ramniya-backend/logger"
	"github.com/ramniya/ramniya-backend/migrate"
	"go.uber.org/zap"
)

func main() {
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

	logger.Info("Starting Ramniya Creations Backend",
		zap.String("environment", cfg.Environment),
		zap.String("port", cfg.Port),
	)

	// Connect to database
	dbConfig := database.GetDefaultConfig(cfg.DatabaseURL)
	if err := database.Connect(dbConfig, logger.Log); err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	// Check for CLI commands
	if len(os.Args) > 1 {
		handleCLICommands(os.Args[1:])
		return
	}

	// Initialize Echo
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// Middleware
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogURI:    true,
		LogStatus: true,
		LogError:  true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			logger.Info("Request",
				zap.String("method", c.Request().Method),
				zap.String("uri", v.URI),
				zap.Int("status", v.Status),
				zap.Error(v.Error),
			)
			return nil
		},
	}))
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Initialize repositories
	authRepo := auth.NewAuthRepository(database.DB)

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		// Check database connection
		ctx, cancel := context.WithTimeout(c.Request().Context(), 2*time.Second)
		defer cancel()

		if err := database.Ping(ctx); err != nil {
			logger.Error("Database health check failed", zap.Error(err))
			return c.JSON(http.StatusServiceUnavailable, map[string]string{
				"status":   "unhealthy",
				"database": "disconnected",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"status":   "ok",
			"database": "connected",
		})
	})

	// Example auth endpoints (to be expanded)
	e.POST("/auth/register", func(c echo.Context) error {
		var req struct {
			Email    string  `json:"email"`
			Name     *string `json:"name"`
			Password string  `json:"password"`
		}

		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		user, err := authRepo.CreateUser(c.Request().Context(), auth.CreateUserInput{
			Email:    req.Email,
			Name:     req.Name,
			Password: &req.Password,
		})

		if err != nil {
			logger.Error("Failed to create user", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create user"})
		}

		return c.JSON(http.StatusCreated, user)
	})

	// Start server with graceful shutdown
	go func() {
		logger.Info("Server starting", zap.String("port", cfg.Port))
		if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed to start", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	logger.Info("Server shutting down...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server stopped gracefully")
}

func handleCLICommands(args []string) {
	if len(args) == 0 {
		return
	}

	command := args[0]

	switch command {
	case "migrate":
		if len(args) < 2 {
			fmt.Println("Usage: backend migrate [up|down]")
			os.Exit(1)
		}

		direction := args[1]
		if direction != "up" && direction != "down" {
			fmt.Println("Direction must be 'up' or 'down'")
			os.Exit(1)
		}

		runMigrations(direction)

	default:
		fmt.Printf("Unknown command: %s\n", command)
		fmt.Println("Available commands:")
		fmt.Println("  migrate up   - Run pending migrations")
		fmt.Println("  migrate down - Rollback last migration")
		os.Exit(1)
	}
}

func runMigrations(direction string) {
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

	// Run migrations
	migrator := migrate.NewMigrator(database.DB, logger.Log, "migrations")

	switch direction {
	case "up":
		logger.Info("Running migrations...")
		if err := migrator.Up(); err != nil {
			logger.Fatal("Migration failed", zap.Error(err))
		}
		logger.Info("Migrations completed successfully")
	case "down":
		// Down migrations not implemented in simple migrator
		logger.Warn("Down migrations not implemented yet. Use golang-migrate for down migrations.")
	}
}
