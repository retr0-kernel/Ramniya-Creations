package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"go.uber.org/zap"
)

// RedisClient wraps redis client with fallback support
type RedisClient struct {
	client  *redis.Client
	enabled bool
	logger  *zap.Logger
}

// NewRedisClient creates a new Redis client with optional fallback
func NewRedisClient(redisURL string, logger *zap.Logger) (*RedisClient, error) {
	if redisURL == "" {
		logger.Info("Redis not configured - running without cache")
		return &RedisClient{
			enabled: false,
			logger:  logger,
		}, nil
	}

	// Parse Redis URL
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	client := redis.NewClient(opt)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		logger.Warn("Failed to connect to Redis - running without cache",
			zap.Error(err),
		)
		return &RedisClient{
			enabled: false,
			logger:  logger,
		}, nil
	}

	logger.Info("Redis connected successfully",
		zap.String("addr", opt.Addr),
	)

	return &RedisClient{
		client:  client,
		enabled: true,
		logger:  logger,
	}, nil
}

// IsEnabled returns whether Redis is enabled
func (r *RedisClient) IsEnabled() bool {
	return r.enabled
}

// Get retrieves a value from cache
func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	if !r.enabled {
		return "", fmt.Errorf("redis not enabled")
	}

	val, err := r.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("key not found")
	}
	if err != nil {
		r.logger.Error("Redis GET error",
			zap.String("key", key),
			zap.Error(err),
		)
		return "", err
	}

	return val, nil
}

// Set stores a value in cache with expiration
func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	if !r.enabled {
		return nil // Silently skip if Redis not enabled
	}

	err := r.client.Set(ctx, key, value, expiration).Err()
	if err != nil {
		r.logger.Error("Redis SET error",
			zap.String("key", key),
			zap.Error(err),
		)
		return err
	}

	return nil
}

// Delete removes a key from cache
func (r *RedisClient) Delete(ctx context.Context, keys ...string) error {
	if !r.enabled {
		return nil
	}

	err := r.client.Del(ctx, keys...).Err()
	if err != nil {
		r.logger.Error("Redis DELETE error",
			zap.Strings("keys", keys),
			zap.Error(err),
		)
		return err
	}

	return nil
}

// Exists checks if a key exists
func (r *RedisClient) Exists(ctx context.Context, key string) (bool, error) {
	if !r.enabled {
		return false, nil
	}

	val, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		r.logger.Error("Redis EXISTS error",
			zap.String("key", key),
			zap.Error(err),
		)
		return false, err
	}

	return val > 0, nil
}

// Increment increments a counter
func (r *RedisClient) Increment(ctx context.Context, key string) (int64, error) {
	if !r.enabled {
		return 0, fmt.Errorf("redis not enabled")
	}

	val, err := r.client.Incr(ctx, key).Result()
	if err != nil {
		r.logger.Error("Redis INCR error",
			zap.String("key", key),
			zap.Error(err),
		)
		return 0, err
	}

	return val, nil
}

// Expire sets expiration on a key
func (r *RedisClient) Expire(ctx context.Context, key string, expiration time.Duration) error {
	if !r.enabled {
		return nil
	}

	err := r.client.Expire(ctx, key, expiration).Err()
	if err != nil {
		r.logger.Error("Redis EXPIRE error",
			zap.String("key", key),
			zap.Error(err),
		)
		return err
	}

	return nil
}

// TTL returns time to live for a key
func (r *RedisClient) TTL(ctx context.Context, key string) (time.Duration, error) {
	if !r.enabled {
		return 0, fmt.Errorf("redis not enabled")
	}

	ttl, err := r.client.TTL(ctx, key).Result()
	if err != nil {
		r.logger.Error("Redis TTL error",
			zap.String("key", key),
			zap.Error(err),
		)
		return 0, err
	}

	return ttl, nil
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	if !r.enabled {
		return nil
	}

	return r.client.Close()
}

// FlushAll clears all keys (use with caution)
func (r *RedisClient) FlushAll(ctx context.Context) error {
	if !r.enabled {
		return nil
	}

	err := r.client.FlushAll(ctx).Err()
	if err != nil {
		r.logger.Error("Redis FLUSHALL error", zap.Error(err))
		return err
	}

	r.logger.Warn("Redis FLUSHALL executed - all keys deleted")
	return nil
}
