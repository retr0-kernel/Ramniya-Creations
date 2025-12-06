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
	echomiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/ramniya/ramniya-backend/auth"
	"github.com/ramniya/ramniya-backend/cache"
	"github.com/ramniya/ramniya-backend/config"
	"github.com/ramniya/ramniya-backend/database"
	"github.com/ramniya/ramniya-backend/email"
	"github.com/ramniya/ramniya-backend/handlers"
	"github.com/ramniya/ramniya-backend/jwt"
	"github.com/ramniya/ramniya-backend/logger"
	"github.com/ramniya/ramniya-backend/middleware"
	"github.com/ramniya/ramniya-backend/migrate"
	"github.com/ramniya/ramniya-backend/oauth"
	"github.com/ramniya/ramniya-backend/orders"
	"github.com/ramniya/ramniya-backend/products"
	"github.com/ramniya/ramniya-backend/razorpay"
	"github.com/ramniya/ramniya-backend/upload"
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
		handleCLICommands(os.Args[1:], cfg)
		return
	}

	// Initialize Redis (optional, with fallback)
	redisClient, err := cache.NewRedisClient(cfg.RedisURL, logger.Log)
	if err != nil {
		logger.Fatal("Failed to initialize Redis client", zap.Error(err))
	}
	defer redisClient.Close()

	// Initialize cache service
	cacheService := cache.NewCacheService(redisClient, logger.Log)

	// Initialize repositories
	authRepo := auth.NewAuthRepository(database.DB)
	productRepo := products.NewProductRepository(database.DB)
	orderRepo := orders.NewOrderRepository(database.DB)

	// Initialize JWT token service
	tokenService := jwt.NewTokenService(
		cfg.JWTSecret,
		time.Duration(cfg.JWTExpiryHours)*time.Hour,
		30*24*time.Hour, // 30 days for refresh token
	)

	// Initialize email sender
	var emailSender email.EmailSender
	if cfg.SMTPUsername != "" && cfg.SMTPPassword != "" {
		emailSender = email.NewSMTPEmailSender(email.SMTPConfig{
			Host:     cfg.SMTPHost,
			Port:     cfg.SMTPPort,
			Username: cfg.SMTPUsername,
			Password: cfg.SMTPPassword,
			From:     cfg.SMTPFrom,
		}, logger.Log)
		logger.Info("SMTP email sender initialized")
	} else {
		fileEmailSender, err := email.NewFileEmailSender("./dev-emails", logger.Log)
		if err != nil {
			logger.Fatal("Failed to create file email sender", zap.Error(err))
		}
		emailSender = fileEmailSender
		logger.Warn("Using file-based email sender (dev mode) - emails will be written to ./dev-emails/")
	}

	// Initialize OAuth service
	var oauthService *oauth.GoogleOAuthService
	//oauthService := oauth.NewGoogleOAuthService(
	//	cfg.GoogleClientID,
	//	cfg.GoogleClientSecret,
	//	"http://localhost:8080/api/auth/oauth/google/callback", // Backend callback
	//	logger.Log,
	//)
	if cfg.GoogleClientID != "" && cfg.GoogleClientSecret != "" {
		oauthService = oauth.NewGoogleOAuthService(oauth.GoogleOAuthConfig{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURL,
		})
		logger.Info("Google OAuth initialized")
	} else {
		logger.Warn("Google OAuth not configured - OAuth endpoints will not work")
	}

	// Initialize upload service with environment-based directory
	uploadDir := "./uploads"
	if cfg.IsProduction() {
		uploadDir = "/var/www/ramniya/uploads"
	}
	uploadService, err := upload.NewUploadService(uploadDir, logger.Log)
	if err != nil {
		logger.Fatal("Failed to create upload service", zap.Error(err))
	}
	logger.Info("Upload service initialized",
		zap.String("directory", uploadDir),
		zap.String("environment", cfg.Environment),
	)

	// Initialize Razorpay service
	var razorpayService *razorpay.RazorpayService
	if cfg.RazorpayKeyID != "" && cfg.RazorpayKeySecret != "" {
		razorpayService = razorpay.NewRazorpayService(razorpay.RazorpayConfig{
			KeyID:     cfg.RazorpayKeyID,
			KeySecret: cfg.RazorpayKeySecret,
		}, logger.Log)
		logger.Info("Razorpay service initialized")
	} else {
		logger.Fatal("Razorpay credentials not configured - add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env")
	}

	// Determine base URLs
	baseURL := fmt.Sprintf("http://localhost:%s", cfg.Port)
	frontendURL := "http://localhost:3000"
	if cfg.IsProduction() {
		baseURL = "https://api.ramniya.com"
		frontendURL = "https://ramniya.com"
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(
		authRepo,
		tokenService,
		emailSender,
		oauthService,
		logger.Log,
		baseURL,
		frontendURL,
	)

	productHandler := handlers.NewProductHandler(
		productRepo,
		uploadService,
		logger.Log,
		baseURL,
		cacheService, // Pass cache service
	)

	orderHandler := handlers.NewOrderHandler(
		orderRepo,
		razorpayService,
		logger.Log,
		cfg.RazorpayKeyID,
	)

	adminOrderHandler := handlers.NewAdminOrderHandler(
		orderRepo,
		logger.Log,
	)

	// Initialize Echo
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// Middleware
	//e.Use(echomiddleware.RequestLoggerWithConfig(echomiddleware.RequestLoggerConfig{
	//	LogURI:    true,
	//	LogStatus: true,
	//	LogError:  true,
	//	LogValuesFunc: func(c echo.Context, v echomiddleware.RequestLoggerValues) error {
	//		logger.Info("Request",
	//			zap.String("method", c.Request().Method),
	//			zap.String("uri", v.URI),
	//			zap.Int("status", v.Status),
	//			zap.Error(v.Error),
	//		)
	//		return nil
	//	},
	//}))
	//e.Use(echomiddleware.Recover())
	//e.Use(echomiddleware.CORS())

	// Middleware
	e.Use(echomiddleware.RequestLoggerWithConfig(echomiddleware.RequestLoggerConfig{
		LogURI:    true,
		LogStatus: true,
		LogError:  true,
		LogValuesFunc: func(c echo.Context, v echomiddleware.RequestLoggerValues) error {
			logger.Info("Request",
				zap.String("method", c.Request().Method),
				zap.String("uri", v.URI),
				zap.Int("status", v.Status),
				zap.Error(v.Error),
			)
			return nil
		},
	}))
	e.Use(echomiddleware.Recover())
	// CORS configuration
	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001"},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
	}))

	// Global API rate limiting (if Redis enabled)
	if redisClient.IsEnabled() {
		e.Use(middleware.APIRateLimiter(redisClient, logger.Log))
		logger.Info("Redis rate limiting enabled")
	}

	// Serve uploaded files in development
	if !cfg.IsProduction() {
		e.Static("/uploads", "./uploads")
		logger.Info("Serving uploads directory", zap.String("path", "/uploads"))
	}

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		ctx, cancel := context.WithTimeout(c.Request().Context(), 2*time.Second)
		defer cancel()

		dbStatus := "connected"
		if err := database.Ping(ctx); err != nil {
			logger.Error("Database health check failed", zap.Error(err))
			dbStatus = "disconnected"
		}

		redisStatus := "disabled"
		if redisClient.IsEnabled() {
			redisStatus = "connected"
		}

		status := "ok"
		statusCode := http.StatusOK
		if dbStatus == "disconnected" {
			status = "unhealthy"
			statusCode = http.StatusServiceUnavailable
		}

		return c.JSON(statusCode, map[string]string{
			"status":   status,
			"database": dbStatus,
			"redis":    redisStatus,
		})
	})

	// Auth endpoints (public)
	authGroup := e.Group("/api/auth")

	// Apply login rate limiting only to login endpoint
	if redisClient.IsEnabled() {
		authGroup.POST("/login", authHandler.Login, middleware.LoginRateLimiter(redisClient, logger.Log))
	} else {
		authGroup.POST("/login", authHandler.Login)
	}

	authGroup.POST("/register", authHandler.Register)
	authGroup.GET("/verify", authHandler.VerifyEmail)

	// OAuth endpoints (if configured)
	if oauthService != nil {
		authGroup.GET("/oauth/google", authHandler.GetGoogleAuthURL)
		authGroup.GET("/oauth/google/callback", authHandler.GoogleOAuthCallback)
	}

	// Public product endpoints (cached)
	e.GET("/api/products", productHandler.ListProducts)
	e.GET("/api/products/:id", productHandler.GetProduct)

	// Protected user endpoints (require authentication)
	userGroup := e.Group("/api")
	userGroup.Use(AuthMiddleware(tokenService))

	// Order endpoints for users
	userGroup.GET("/orders", orderHandler.ListOrders)
	userGroup.GET("/orders/:id", orderHandler.GetOrder)

	// Checkout endpoints
	checkoutGroup := e.Group("/api/checkout")
	checkoutGroup.Use(AuthMiddleware(tokenService))
	checkoutGroup.POST("/create-order", orderHandler.CreateOrder)
	checkoutGroup.POST("/verify-payment", orderHandler.VerifyPayment)

	// Webhook endpoint (public, but signature verified)
	e.POST("/api/webhooks/razorpay", orderHandler.RazorpayWebhook)

	// Admin endpoints (protected - require admin role)
	adminGroup := e.Group("/api/admin")
	adminGroup.Use(AuthMiddleware(tokenService))
	adminGroup.Use(middleware.RequireAdmin(database.DB, logger.Log))

	// Admin product endpoints
	adminGroup.POST("/products", productHandler.CreateProduct)
	adminGroup.POST("/products/:id/images", productHandler.UploadProductImages)
	adminGroup.PUT("/products/:id", productHandler.UpdateProduct)
	adminGroup.DELETE("/products/:id", productHandler.DeleteProduct)

	// Admin order endpoints
	adminGroup.GET("/orders", adminOrderHandler.ListAllOrders)
	adminGroup.GET("/orders/:id", adminOrderHandler.GetOrderAdmin)
	adminGroup.PUT("/orders/:id/status", adminOrderHandler.UpdateOrderStatusAdmin)
	adminGroup.GET("/orders/stats", adminOrderHandler.GetOrderStats)

	// OAuth endpoints (if configured)
	//auth.GET("/oauth/google", authHandler.GetGoogleAuthURL)
	//auth.GET("/oauth/google/callback", authHandler.GoogleOAuthCallback)

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

// AuthMiddleware validates JWT tokens for protected routes
func AuthMiddleware(tokenService *jwt.TokenService) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Get token from Authorization header
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Missing authorization header",
				})
			}

			// Extract token (format: "Bearer <token>")
			tokenString := ""
			if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				tokenString = authHeader[7:]
			} else {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Invalid authorization header format",
				})
			}

			// Verify token
			claims, err := tokenService.VerifyToken(tokenString, jwt.PurposeAccess)
			if err != nil {
				logger.Log.Warn("Invalid token",
					zap.Error(err),
				)
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Invalid or expired token",
				})
			}

			// Set user info in context
			c.Set("user_id", claims.UserID)
			c.Set("user_email", claims.Email)

			return next(c)
		}
	}
}

func handleCLICommands(args []string, cfg *config.Config) {
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
		logger.Warn("Down migrations not implemented yet. Use golang-migrate for down migrations.")
	}
}
