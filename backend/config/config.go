package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	// Server
	Port string

	// Database
	DatabaseURL string

	// Authentication
	JWTSecret      string
	JWTExpiryHours int

	// OAuth - Google
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// Payment - Razorpay
	RazorpayKeyID     string
	RazorpayKeySecret string

	// Email - SMTP
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	SMTPFrom     string

	// Environment
	Environment string
}

// Load reads configuration from environment variables with sensible defaults
func Load() (*Config, error) {
	cfg := &Config{
		// Server defaults
		Port: getEnv("PORT", "8080"),

		// Database
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/ramniya_creations?sslmode=disable"),

		// Authentication
		JWTSecret:      getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		JWTExpiryHours: getEnvAsInt("JWT_EXPIRY_HOURS", 24),

		// OAuth - Google
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/auth/google/callback"),

		// Payment - Razorpay
		RazorpayKeyID:     getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret: getEnv("RAZORPAY_KEY_SECRET", ""),

		// Email - SMTP
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnvAsInt("SMTP_PORT", 587),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     getEnv("SMTP_FROM", "noreply@ramniyacreations.com"),

		// Environment
		Environment: getEnv("ENVIRONMENT", "development"),
	}

	// Validate required fields in production
	if cfg.Environment == "production" {
		if err := cfg.Validate(); err != nil {
			return nil, err
		}
	}

	return cfg, nil
}

// Validate checks if required configuration values are set
func (c *Config) Validate() error {
	if c.JWTSecret == "your-secret-key-change-in-production" {
		return fmt.Errorf("JWT_SECRET must be set in production")
	}

	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL must be set")
	}

	// Warn about missing optional configs
	if c.GoogleClientID == "" {
		fmt.Println("WARNING: GOOGLE_CLIENT_ID not set - Google OAuth will not work")
	}

	if c.RazorpayKeyID == "" {
		fmt.Println("WARNING: RAZORPAY_KEY_ID not set - Payment integration will not work")
	}

	if c.SMTPUsername == "" {
		fmt.Println("WARNING: SMTP_USERNAME not set - Email sending will not work")
	}

	return nil
}

// IsDevelopment returns true if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction returns true if running in production mode
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

// Helper functions

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}
