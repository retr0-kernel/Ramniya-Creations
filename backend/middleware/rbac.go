package middleware

import (
	"database/sql"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

// RequireRole creates middleware that requires a specific user role
func RequireRole(db *sql.DB, logger *zap.Logger, requiredRole string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Get user ID from context (set by auth middleware)
			userIDStr, ok := c.Get("user_id").(string)
			if !ok {
				logger.Warn("User ID not found in context")
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "User not authenticated",
				})
			}

			userID, err := uuid.Parse(userIDStr)
			if err != nil {
				logger.Warn("Invalid user ID in context",
					zap.String("user_id", userIDStr),
					zap.Error(err),
				)
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Invalid user ID",
				})
			}

			// Query user role from database
			var role string
			query := "SELECT role FROM users WHERE id = $1"
			err = db.QueryRowContext(c.Request().Context(), query, userID).Scan(&role)
			if err != nil {
				if err == sql.ErrNoRows {
					logger.Warn("User not found",
						zap.String("user_id", userID.String()),
					)
					return c.JSON(http.StatusUnauthorized, map[string]string{
						"error": "User not found",
					})
				}
				logger.Error("Failed to query user role",
					zap.String("user_id", userID.String()),
					zap.Error(err),
				)
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": "Failed to verify user role",
				})
			}

			// Check if user has required role
			if role != requiredRole {
				logger.Warn("Insufficient permissions",
					zap.String("user_id", userID.String()),
					zap.String("user_role", role),
					zap.String("required_role", requiredRole),
				)
				return c.JSON(http.StatusForbidden, map[string]string{
					"error": "Insufficient permissions",
				})
			}

			// Set role in context for use in handlers
			c.Set("user_role", role)

			logger.Info("User authorized",
				zap.String("user_id", userID.String()),
				zap.String("role", role),
			)

			return next(c)
		}
	}
}

// RequireAdmin creates middleware that requires admin role
func RequireAdmin(db *sql.DB, logger *zap.Logger) echo.MiddlewareFunc {
	return RequireRole(db, logger, "admin")
}
