package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/ramniya/ramniya-backend/auth"
	"github.com/ramniya/ramniya-backend/email"
	"github.com/ramniya/ramniya-backend/jwt"
	"github.com/ramniya/ramniya-backend/oauth"
	"go.uber.org/zap"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authRepo     *auth.AuthRepository
	tokenService *jwt.TokenService
	emailSender  email.EmailSender
	oauthService *oauth.GoogleOAuthService
	logger       *zap.Logger
	baseURL      string
	frontendURL  string
	oauthStates  map[string]time.Time // Production: use Redis/database
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(
	authRepo *auth.AuthRepository,
	tokenService *jwt.TokenService,
	emailSender email.EmailSender,
	oauthService *oauth.GoogleOAuthService,
	logger *zap.Logger,
	baseURL string,
	frontendURL string,
) *AuthHandler {
	return &AuthHandler{
		authRepo:     authRepo,
		tokenService: tokenService,
		emailSender:  emailSender,
		oauthService: oauthService,
		logger:       logger,
		baseURL:      baseURL,
		frontendURL:  frontendURL,
		oauthStates:  make(map[string]time.Time),
	}
}

// RegisterRequest represents registration request
type RegisterRequest struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token,omitempty"`
	ExpiresIn    int64       `json:"expires_in"`
	TokenType    string      `json:"token_type"`
	User         *UserDetail `json:"user"`
}

// UserDetail represents user details in response
type UserDetail struct {
	ID         string `json:"id"`
	Email      string `json:"email"`
	Name       string `json:"name,omitempty"`
	Role       string `json:"role"`
	IsVerified bool   `json:"is_verified"`
	CreatedAt  string `json:"created_at,omitempty"`
}

// Register handles user registration
func (h *AuthHandler) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
	}

	// Validate input
	if req.Name == "" || req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Name, email, and password are required",
		})
	}

	if len(req.Password) < 8 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Password must be at least 8 characters long",
		})
	}

	// Create user
	user, err := h.authRepo.CreateUser(c.Request().Context(), auth.CreateUserInput{
		Email:    req.Email,
		Name:     &req.Name,
		Password: &req.Password,
	})

	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return c.JSON(http.StatusConflict, map[string]string{
				"error": "Email already registered",
			})
		}

		h.logger.Error("Failed to create user",
			zap.String("email", req.Email),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to create user",
		})
	}

	// Generate email verification token
	verificationToken, err := h.tokenService.GenerateEmailVerificationToken(user.ID, user.Email)
	if err != nil {
		h.logger.Error("Failed to generate verification token",
			zap.String("user_id", user.ID.String()),
			zap.Error(err),
		)
		// User is created but email won't be sent - still return success
	} else {
		// Send verification email
		verificationURL := fmt.Sprintf("%s/auth/verify?token=%s", h.frontendURL, verificationToken)
		if err := h.emailSender.SendVerificationEmail(user.Email, *user.Name, verificationURL); err != nil {
			h.logger.Error("Failed to send verification email",
				zap.String("user_id", user.ID.String()),
				zap.Error(err),
			)
			// Continue anyway - user can request another verification email
		}
	}

	h.logger.Info("User registered successfully",
		zap.String("user_id", user.ID.String()),
		zap.String("email", user.Email),
	)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Registration successful. Please check your email to verify your account.",
		"user": UserDetail{
			ID:         user.ID.String(),
			Email:      user.Email,
			Name:       *user.Name,
			IsVerified: user.IsVerified,
		},
	})
}

// VerifyEmail handles email verification
func (h *AuthHandler) VerifyEmail(c echo.Context) error {
	token := c.QueryParam("token")
	if token == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Verification token is required",
		})
	}

	// Verify token
	claims, err := h.tokenService.VerifyToken(token, jwt.PurposeVerifyEmail)
	if err != nil {
		h.logger.Warn("Invalid verification token",
			zap.Error(err),
		)
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid or expired verification token",
		})
	}

	// Get user ID from claims
	userID, err := claims.GetUserID()
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid token",
		})
	}

	// Set user as verified
	if err := h.authRepo.SetVerified(c.Request().Context(), userID, true); err != nil {
		h.logger.Error("Failed to verify user",
			zap.String("user_id", userID.String()),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to verify email",
		})
	}

	// Get updated user
	user, err := h.authRepo.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		h.logger.Error("Failed to get user after verification",
			zap.String("user_id", userID.String()),
			zap.Error(err),
		)
	} else {
		// Send welcome email
		userName := "User"
		if user.Name != nil {
			userName = *user.Name
		}
		if err := h.emailSender.SendWelcomeEmail(user.Email, userName); err != nil {
			h.logger.Error("Failed to send welcome email",
				zap.String("user_id", userID.String()),
				zap.Error(err),
			)
		}
	}

	h.logger.Info("Email verified successfully",
		zap.String("user_id", userID.String()),
		zap.String("email", claims.Email),
	)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":  "Email verified successfully! You can now log in.",
		"verified": true,
	})
}

// Login handles user login
func (h *AuthHandler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Email and password are required",
		})
	}

	// Verify credentials
	user, err := h.authRepo.VerifyPassword(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		h.logger.Warn("Failed login attempt",
			zap.String("email", req.Email),
		)
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Invalid email or password",
		})
	}

	// Check if email is verified
	if !user.IsVerified {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Please verify your email before logging in. Check your inbox for the verification link.",
		})
	}

	// Generate tokens
	accessToken, expiresAt, err := h.tokenService.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		h.logger.Error("Failed to generate access token",
			zap.String("user_id", user.ID.String()),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to generate token",
		})
	}

	refreshToken, _, err := h.tokenService.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		h.logger.Error("Failed to generate refresh token",
			zap.String("user_id", user.ID.String()),
			zap.Error(err),
		)
		// Continue without refresh token
		refreshToken = ""
	}

	h.logger.Info("User logged in successfully",
		zap.String("user_id", user.ID.String()),
		zap.String("email", user.Email),
	)

	userName := ""
	if user.Name != nil {
		userName = *user.Name
	}

	// Calculate expires_in (seconds until expiry)
	expiresIn := int64(time.Until(expiresAt).Seconds())

	return c.JSON(http.StatusOK, AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		TokenType:    "Bearer",
		User: &UserDetail{
			ID:         user.ID.String(),
			Email:      user.Email,
			Name:       userName,
			Role:       string(user.Role),
			IsVerified: user.IsVerified,
			CreatedAt:  user.CreatedAt.Format(time.RFC3339),
		},
	})
}

// GoogleOAuthCallback handles Google OAuth callback
func (h *AuthHandler) GoogleOAuthCallback(c echo.Context) error {
	code := c.QueryParam("code")
	state := c.QueryParam("state")

	if code == "" {
		// Redirect to frontend with error
		return c.Redirect(http.StatusTemporaryRedirect,
			fmt.Sprintf("%s/login?error=missing_code", h.frontendURL))
	}

	if state == "" {
		return c.Redirect(http.StatusTemporaryRedirect,
			fmt.Sprintf("%s/login?error=missing_state", h.frontendURL))
	}

	// Verify state parameter
	if !h.verifyOAuthState(state) {
		h.logger.Warn("Invalid OAuth state parameter",
			zap.String("state", state),
		)
		return c.Redirect(http.StatusTemporaryRedirect,
			fmt.Sprintf("%s/login?error=invalid_state", h.frontendURL))
	}

	// Exchange code for user info
	userInfo, err := h.oauthService.ExchangeCode(c.Request().Context(), code)
	if err != nil {
		h.logger.Error("Failed to exchange OAuth code",
			zap.Error(err),
		)
		return c.Redirect(http.StatusTemporaryRedirect,
			fmt.Sprintf("%s/login?error=exchange_failed", h.frontendURL))
	}

	if !userInfo.VerifiedEmail {
		return c.Redirect(http.StatusTemporaryRedirect,
			fmt.Sprintf("%s/login?error=email_not_verified", h.frontendURL))
	}

	// Try to find existing user by Google ID
	user, err := h.authRepo.GetUserByGoogleID(c.Request().Context(), userInfo.ID)
	if err != nil {
		// User doesn't exist with this Google ID, try by email
		user, err = h.authRepo.GetUserByEmail(c.Request().Context(), userInfo.Email)
		if err != nil {
			// User doesn't exist at all, create new user
			user, err = h.authRepo.CreateUser(c.Request().Context(), auth.CreateUserInput{
				Email:    userInfo.Email,
				Name:     &userInfo.Name,
				GoogleID: &userInfo.ID,
			})
			if err != nil {
				h.logger.Error("Failed to create user from Google OAuth",
					zap.String("email", userInfo.Email),
					zap.Error(err),
				)
				return c.Redirect(http.StatusTemporaryRedirect,
					fmt.Sprintf("%s/login?error=user_creation_failed", h.frontendURL))
			}

			h.logger.Info("New user created via Google OAuth",
				zap.String("user_id", user.ID.String()),
				zap.String("email", user.Email),
			)
		} else {
			// User exists by email but not linked to Google, link it
			if err := h.authRepo.LinkGoogleID(c.Request().Context(), user.ID, userInfo.ID); err != nil {
				h.logger.Error("Failed to link Google ID",
					zap.String("user_id", user.ID.String()),
					zap.Error(err),
				)
				// Continue anyway
			}

			// Ensure user is verified since Google email is verified
			if !user.IsVerified {
				if err := h.authRepo.SetVerified(c.Request().Context(), user.ID, true); err != nil {
					h.logger.Error("Failed to verify user",
						zap.String("user_id", user.ID.String()),
						zap.Error(err),
					)
				}
				user.IsVerified = true
			}

			h.logger.Info("Existing user logged in via Google OAuth",
				zap.String("user_id", user.ID.String()),
				zap.String("email", user.Email),
			)
		}
	}

	// Generate tokens
	accessToken, expiresAt, err := h.tokenService.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		h.logger.Error("Failed to generate access token",
			zap.String("user_id", user.ID.String()),
			zap.Error(err),
		)
		return c.Redirect(http.StatusTemporaryRedirect,
			fmt.Sprintf("%s/login?error=token_generation_failed", h.frontendURL))
	}

	// Generate refresh token (but we won't use it in redirect)
	_, _, err = h.tokenService.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		h.logger.Error("Failed to generate refresh token",
			zap.String("user_id", user.ID.String()),
			zap.Error(err),
		)
		// Continue anyway
	}

	userName := ""
	if user.Name != nil {
		userName = *user.Name
	}

	userEmail := user.Email
	userID := user.ID.String()
	userRole := string(user.Role)

	expiresIn := int64(time.Until(expiresAt).Seconds())

	// Redirect to frontend callback with tokens
	redirectURL := fmt.Sprintf(
		"%s/auth/callback/google?access_token=%s&user_id=%s&user_name=%s&user_email=%s&user_role=%s&expires_in=%d",
		h.frontendURL,
		accessToken,
		url.QueryEscape(userID),
		url.QueryEscape(userName),
		url.QueryEscape(userEmail),
		url.QueryEscape(userRole),
		expiresIn,
	)

	return c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// GetGoogleAuthURL returns the Google OAuth authorization URL
func (h *AuthHandler) GetGoogleAuthURL(c echo.Context) error {
	state := h.generateSecureState()

	// Store state for verification (Production: use Redis with expiry)
	h.storeOAuthState(state)

	authURL := h.oauthService.GetAuthURL(state)

	return c.JSON(http.StatusOK, map[string]string{
		"auth_url": authURL,
		"state":    state,
	})
}

// generateSecureState generates a cryptographically secure random state token
func (h *AuthHandler) generateSecureState() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		h.logger.Error("Failed to generate secure random state", zap.Error(err))
		// Fallback to timestamp-based (less secure but functional)
		return fmt.Sprintf("state-%d", time.Now().UnixNano())
	}
	return base64.URLEncoding.EncodeToString(b)
}

// storeOAuthState stores state token for verification
// Production: Replace with Redis/database with TTL
func (h *AuthHandler) storeOAuthState(state string) {
	h.oauthStates[state] = time.Now().Add(10 * time.Minute)

	// Clean up expired states
	go h.cleanExpiredStates()
}

// verifyOAuthState verifies the state parameter
// Production: Check Redis/database
func (h *AuthHandler) verifyOAuthState(state string) bool {
	expiry, exists := h.oauthStates[state]
	if !exists {
		return false
	}

	if time.Now().After(expiry) {
		delete(h.oauthStates, state)
		return false
	}

	// Remove state after verification (single use)
	delete(h.oauthStates, state)
	return true
}

// cleanExpiredStates removes expired state tokens
// Production: Not needed if using Redis with TTL
func (h *AuthHandler) cleanExpiredStates() {
	now := time.Now()
	for state, expiry := range h.oauthStates {
		if now.After(expiry) {
			delete(h.oauthStates, state)
		}
	}
}
