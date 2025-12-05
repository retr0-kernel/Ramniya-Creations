package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// TokenPurpose defines the purpose of a JWT token
type TokenPurpose string

const (
	PurposeAccess        TokenPurpose = "access"
	PurposeRefresh       TokenPurpose = "refresh"
	PurposeVerifyEmail   TokenPurpose = "verify_email"
	PurposeResetPassword TokenPurpose = "reset_password"
)

// Claims represents the JWT claims
type Claims struct {
	UserID  string       `json:"user_id"`
	Email   string       `json:"email"`
	Purpose TokenPurpose `json:"purpose"`
	jwt.RegisteredClaims
}

// TokenService handles JWT token operations
type TokenService struct {
	secret             string
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
}

// NewTokenService creates a new token service
func NewTokenService(secret string, accessExpiry, refreshExpiry time.Duration) *TokenService {
	return &TokenService{
		secret:             secret,
		accessTokenExpiry:  accessExpiry,
		refreshTokenExpiry: refreshExpiry,
	}
}

// GenerateAccessToken generates a new access token
func (s *TokenService) GenerateAccessToken(userID uuid.UUID, email string) (string, time.Time, error) {
	expiresAt := time.Now().Add(s.accessTokenExpiry)

	claims := Claims{
		UserID:  userID.String(),
		Email:   email,
		Purpose: PurposeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "ramniya-creations",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.secret))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, expiresAt, nil
}

// GenerateRefreshToken generates a new refresh token
func (s *TokenService) GenerateRefreshToken(userID uuid.UUID, email string) (string, time.Time, error) {
	expiresAt := time.Now().Add(s.refreshTokenExpiry)

	claims := Claims{
		UserID:  userID.String(),
		Email:   email,
		Purpose: PurposeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "ramniya-creations",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.secret))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, expiresAt, nil
}

// GenerateEmailVerificationToken generates a token for email verification
func (s *TokenService) GenerateEmailVerificationToken(userID uuid.UUID, email string) (string, error) {
	expiresAt := time.Now().Add(24 * time.Hour) // 24 hour expiry for email verification

	claims := Claims{
		UserID:  userID.String(),
		Email:   email,
		Purpose: PurposeVerifyEmail,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "ramniya-creations",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// GeneratePasswordResetToken generates a token for password reset
func (s *TokenService) GeneratePasswordResetToken(userID uuid.UUID, email string) (string, error) {
	expiresAt := time.Now().Add(1 * time.Hour) // 1 hour expiry for password reset

	claims := Claims{
		UserID:  userID.String(),
		Email:   email,
		Purpose: PurposeResetPassword,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "ramniya-creations",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// VerifyToken verifies and parses a JWT token
func (s *TokenService) VerifyToken(tokenString string, expectedPurpose TokenPurpose) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	// Verify purpose matches
	if claims.Purpose != expectedPurpose {
		return nil, fmt.Errorf("invalid token purpose: expected %s, got %s", expectedPurpose, claims.Purpose)
	}

	// Verify expiration
	if time.Now().After(claims.ExpiresAt.Time) {
		return nil, fmt.Errorf("token has expired")
	}

	return claims, nil
}

// ExtractUserID extracts user ID from claims
func (c *Claims) GetUserID() (uuid.UUID, error) {
	return uuid.Parse(c.UserID)
}
