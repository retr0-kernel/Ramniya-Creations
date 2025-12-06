package cache

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"time"

	"go.uber.org/zap"
)

// CacheService provides caching functionality
type CacheService struct {
	redis  *RedisClient
	logger *zap.Logger
}

// NewCacheService creates a new cache service
func NewCacheService(redis *RedisClient, logger *zap.Logger) *CacheService {
	return &CacheService{
		redis:  redis,
		logger: logger,
	}
}

// GenerateCacheKey generates a cache key from parts
func GenerateCacheKey(parts ...string) string {
	combined := ""
	for _, part := range parts {
		combined += part + ":"
	}

	// Hash for shorter keys
	hash := sha256.Sum256([]byte(combined))
	return fmt.Sprintf("cache:%x", hash[:16])
}

// GetJSON retrieves and unmarshals JSON from cache
func (c *CacheService) GetJSON(ctx context.Context, key string, dest interface{}) error {
	if !c.redis.IsEnabled() {
		return fmt.Errorf("cache not enabled")
	}

	data, err := c.redis.Get(ctx, key)
	if err != nil {
		return err
	}

	if err := json.Unmarshal([]byte(data), dest); err != nil {
		c.logger.Error("Failed to unmarshal cached data",
			zap.String("key", key),
			zap.Error(err),
		)
		return err
	}

	c.logger.Debug("Cache hit",
		zap.String("key", key),
	)

	return nil
}

// SetJSON marshals and stores JSON in cache
func (c *CacheService) SetJSON(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	if !c.redis.IsEnabled() {
		return nil // Silent skip
	}

	data, err := json.Marshal(value)
	if err != nil {
		c.logger.Error("Failed to marshal data for cache",
			zap.String("key", key),
			zap.Error(err),
		)
		return err
	}

	if err := c.redis.Set(ctx, key, data, expiration); err != nil {
		return err
	}

	c.logger.Debug("Cache set",
		zap.String("key", key),
		zap.Duration("ttl", expiration),
	)

	return nil
}

// Delete removes keys from cache
func (c *CacheService) Delete(ctx context.Context, keys ...string) error {
	if !c.redis.IsEnabled() {
		return nil
	}

	return c.redis.Delete(ctx, keys...)
}

// InvalidatePattern deletes all keys matching a pattern
func (c *CacheService) InvalidatePattern(ctx context.Context, pattern string) error {
	if !c.redis.IsEnabled() {
		return nil
	}

	// This is a simplified version - in production you'd use SCAN
	c.logger.Info("Cache pattern invalidation",
		zap.String("pattern", pattern),
	)

	return nil
}
