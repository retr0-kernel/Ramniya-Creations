package database

import (
	"context"
	"os"
	"testing"
	"time"

	"go.uber.org/zap"
)

func TestConnect(t *testing.T) {
	// Skip if DATABASE_URL is not set
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	logger, err := zap.NewDevelopment()
	if err != nil {
		t.Fatalf("Failed to create logger: %v", err)
	}

	cfg := GetDefaultConfig(databaseURL)

	// Test connection
	err = Connect(cfg, logger)
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}
	defer Close()

	// Test ping
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = Ping(ctx)
	if err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}
}

func TestPing(t *testing.T) {
	// Skip if DATABASE_URL is not set
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	logger, err := zap.NewDevelopment()
	if err != nil {
		t.Fatalf("Failed to create logger: %v", err)
	}

	cfg := GetDefaultConfig(databaseURL)
	err = Connect(cfg, logger)
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}
	defer Close()

	// Test ping with context
	ctx := context.Background()
	err = Ping(ctx)
	if err != nil {
		t.Errorf("Ping failed: %v", err)
	}

	// Test ping with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	err = Ping(ctx)
	if err != nil {
		t.Errorf("Ping with timeout failed: %v", err)
	}
}

func TestGetDefaultConfig(t *testing.T) {
	testURL := "postgres://user:pass@localhost:5432/testdb"
	cfg := GetDefaultConfig(testURL)

	if cfg.URL != testURL {
		t.Errorf("Expected URL %s, got %s", testURL, cfg.URL)
	}

	if cfg.MaxOpenConns != 25 {
		t.Errorf("Expected MaxOpenConns 25, got %d", cfg.MaxOpenConns)
	}

	if cfg.MaxIdleConns != 5 {
		t.Errorf("Expected MaxIdleConns 5, got %d", cfg.MaxIdleConns)
	}

	if cfg.ConnMaxLifetime != 5*time.Minute {
		t.Errorf("Expected ConnMaxLifetime 5m, got %v", cfg.ConnMaxLifetime)
	}
}

func TestClose(t *testing.T) {
	// Test closing when DB is nil
	DB = nil
	err := Close()
	if err != nil {
		t.Errorf("Close should not error when DB is nil, got: %v", err)
	}

	// Test closing with actual connection
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	logger, err := zap.NewDevelopment()
	if err != nil {
		t.Fatalf("Failed to create logger: %v", err)
	}

	cfg := GetDefaultConfig(databaseURL)
	err = Connect(cfg, logger)
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	err = Close()
	if err != nil {
		t.Errorf("Close failed: %v", err)
	}
}
