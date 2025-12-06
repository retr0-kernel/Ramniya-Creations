package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/ramniya/ramniya-backend/cache"
	"go.uber.org/zap"
)

// RateLimiterConfig holds rate limiter configuration
type RateLimiterConfig struct {
	RequestsPerWindow int
	WindowDuration    time.Duration
	KeyPrefix         string
}

// RedisRateLimiter creates a rate limiter middleware using Redis
func RedisRateLimiter(redis *cache.RedisClient, logger *zap.Logger, config RateLimiterConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Skip if Redis not enabled
			if !redis.IsEnabled() {
				return next(c)
			}

			// Get client IP
			clientIP := c.RealIP()

			// Generate rate limit key
			key := fmt.Sprintf("%s:%s", config.KeyPrefix, clientIP)

			ctx := c.Request().Context()

			// Increment counter
			count, err := redis.Increment(ctx, key)
			if err != nil {
				logger.Error("Rate limiter error",
					zap.String("ip", clientIP),
					zap.Error(err),
				)
				// Continue on error (fail open)
				return next(c)
			}

			// Set expiration on first request
			if count == 1 {
				if err := redis.Expire(ctx, key, config.WindowDuration); err != nil {
					logger.Error("Failed to set rate limit expiration",
						zap.String("ip", clientIP),
						zap.Error(err),
					)
				}
			}

			// Check if limit exceeded
			if count > int64(config.RequestsPerWindow) {
				// Get TTL for Retry-After header
				ttl, _ := redis.TTL(ctx, key)

				c.Response().Header().Set("Retry-After", fmt.Sprintf("%d", int(ttl.Seconds())))
				c.Response().Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", config.RequestsPerWindow))
				c.Response().Header().Set("X-RateLimit-Remaining", "0")
				c.Response().Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(ttl).Unix()))

				logger.Warn("Rate limit exceeded",
					zap.String("ip", clientIP),
					zap.Int64("requests", count),
					zap.Int("limit", config.RequestsPerWindow),
				)

				return c.JSON(http.StatusTooManyRequests, map[string]string{
					"error": "Too many requests. Please try again later.",
				})
			}

			// Set rate limit headers
			remaining := config.RequestsPerWindow - int(count)
			ttl, _ := redis.TTL(ctx, key)

			c.Response().Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", config.RequestsPerWindow))
			c.Response().Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
			c.Response().Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(ttl).Unix()))

			return next(c)
		}
	}
}

// LoginRateLimiter creates a rate limiter for login attempts
func LoginRateLimiter(redis *cache.RedisClient, logger *zap.Logger) echo.MiddlewareFunc {
	return RedisRateLimiter(redis, logger, RateLimiterConfig{
		RequestsPerWindow: 5,                // 5 attempts
		WindowDuration:    15 * time.Minute, // per 15 minutes
		KeyPrefix:         "rate_limit:login",
	})
}

// APIRateLimiter creates a general API rate limiter
func APIRateLimiter(redis *cache.RedisClient, logger *zap.Logger) echo.MiddlewareFunc {
	return RedisRateLimiter(redis, logger, RateLimiterConfig{
		RequestsPerWindow: 100,             // 100 requests
		WindowDuration:    1 * time.Minute, // per minute
		KeyPrefix:         "rate_limit:api",
	})
}
