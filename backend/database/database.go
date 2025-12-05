package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
	"go.uber.org/zap"
)

var DB *sql.DB

// Config holds database configuration
type Config struct {
	URL             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}

// Connect establishes a connection to the database and sets up the connection pool
func Connect(cfg Config, logger *zap.Logger) error {
	var err error

	// Open database connection
	DB, err = sql.Open("postgres", cfg.URL)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	DB.SetMaxOpenConns(cfg.MaxOpenConns)
	DB.SetMaxIdleConns(cfg.MaxIdleConns)
	DB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	DB.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)

	// Verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := DB.PingContext(ctx); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Database connection established",
		zap.String("max_open_conns", fmt.Sprintf("%d", cfg.MaxOpenConns)),
		zap.String("max_idle_conns", fmt.Sprintf("%d", cfg.MaxIdleConns)),
	)

	return nil
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// Ping verifies the database connection is alive
func Ping(ctx context.Context) error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}
	return DB.PingContext(ctx)
}

// GetDefaultConfig returns default database configuration
func GetDefaultConfig(databaseURL string) Config {
	return Config{
		URL:             databaseURL,
		MaxOpenConns:    25,
		MaxIdleConns:    5,
		ConnMaxLifetime: 5 * time.Minute,
		ConnMaxIdleTime: 5 * time.Minute,
	}
}
