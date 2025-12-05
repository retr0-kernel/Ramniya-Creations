package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/ramniya/ramniya-backend/auth"
	"github.com/ramniya/ramniya-backend/database"
	"github.com/ramniya/ramniya-backend/email"
	"github.com/ramniya/ramniya-backend/jwt"
	"github.com/ramniya/ramniya-backend/oauth"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func setupTestHandler(t *testing.T) (*AuthHandler, *auth.AuthRepository, func()) {
	// Skip if DATABASE_URL is not set
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	// Initialize logger
	testLogger, _ := zap.NewDevelopment()

	// Connect to database
	cfg := database.GetDefaultConfig(databaseURL)
	if err := database.Connect(cfg, testLogger); err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	// Create repositories and services
	authRepo := auth.NewAuthRepository(database.DB)
	tokenService := jwt.NewTokenService("test-secret", 7*24*time.Hour, 30*24*time.Hour)
	emailSender, _ := email.NewFileEmailSender("/tmp/test-emails", testLogger)
	oauthService := oauth.NewGoogleOAuthService(oauth.GoogleOAuthConfig{
		ClientID:     "test-client-id",
		ClientSecret: "test-client-secret",
		RedirectURL:  "http://localhost:8080/api/auth/oauth/google/callback",
	})

	handler := NewAuthHandler(
		authRepo,
		tokenService,
		emailSender,
		oauthService,
		testLogger,
		"http://localhost:8080",
		"http://localhost:3000",
	)

	cleanup := func() {
		database.Close()
	}

	return handler, authRepo, cleanup
}

func cleanupTestUser(t *testing.T, repo *auth.AuthRepository, email string) {
	ctx := context.Background()
	user, err := repo.GetUserByEmail(ctx, email)
	if err == nil {
		database.DB.Exec("DELETE FROM users WHERE id = $1", user.ID)
	}
}

func TestRegisterAndVerify(t *testing.T) {
	handler, authRepo, cleanup := setupTestHandler(t)
	defer cleanup()

	testEmail := "test-register-verify@example.com"
	defer cleanupTestUser(t, authRepo, testEmail)

	e := echo.New()

	// Test Registration
	t.Run("Register User", func(t *testing.T) {
		reqBody := `{"name":"Test User","email":"` + testEmail + `","password":"testpass123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(reqBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		if assert.NoError(t, handler.Register(c)) {
			assert.Equal(t, http.StatusCreated, rec.Code)

			var response map[string]interface{}
			json.Unmarshal(rec.Body.Bytes(), &response)

			assert.Contains(t, response, "message")
			assert.Contains(t, response, "user")

			user := response["user"].(map[string]interface{})
			assert.Equal(t, testEmail, user["email"])
			assert.Equal(t, false, user["is_verified"])
		}
	})

	// Get user and generate verification token
	ctx := context.Background()
	user, err := authRepo.GetUserByEmail(ctx, testEmail)
	assert.NoError(t, err)
	assert.False(t, user.IsVerified)

	tokenService := jwt.NewTokenService("test-secret", 7*24*time.Hour, 30*24*time.Hour)
	verificationToken, err := tokenService.GenerateEmailVerificationToken(user.ID, user.Email)
	assert.NoError(t, err)

	// Test Email Verification
	t.Run("Verify Email", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/auth/verify?token="+verificationToken, nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		if assert.NoError(t, handler.VerifyEmail(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)

			var response map[string]interface{}
			json.Unmarshal(rec.Body.Bytes(), &response)

			assert.Equal(t, true, response["verified"])
		}

		// Verify user is now verified in database
		verifiedUser, err := authRepo.GetUserByEmail(ctx, testEmail)
		assert.NoError(t, err)
		assert.True(t, verifiedUser.IsVerified)
	})

	// Test Login After Verification
	t.Run("Login After Verification", func(t *testing.T) {
		reqBody := `{"email":"` + testEmail + `","password":"testpass123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(reqBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		if assert.NoError(t, handler.Login(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)

			var response AuthResponse
			json.Unmarshal(rec.Body.Bytes(), &response)

			assert.NotEmpty(t, response.AccessToken)
			assert.Equal(t, "Bearer", response.TokenType)
			assert.NotNil(t, response.User)
			assert.Equal(t, testEmail, response.User.Email)
			assert.True(t, response.User.IsVerified)
		}
	})
}

func TestLoginFailsIfNotVerified(t *testing.T) {
	handler, authRepo, cleanup := setupTestHandler(t)
	defer cleanup()

	testEmail := "test-unverified@example.com"
	defer cleanupTestUser(t, authRepo, testEmail)

	// Create unverified user
	ctx := context.Background()
	password := "testpass123"
	name := "Unverified User"
	_, err := authRepo.CreateUser(ctx, auth.CreateUserInput{
		Email:    testEmail,
		Name:     &name,
		Password: &password,
	})
	assert.NoError(t, err)

	// Try to login
	e := echo.New()
	reqBody := `{"email":"` + testEmail + `","password":"testpass123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if assert.NoError(t, handler.Login(c)) {
		assert.Equal(t, http.StatusForbidden, rec.Code)

		var response map[string]string
		json.Unmarshal(rec.Body.Bytes(), &response)

		assert.Contains(t, response["error"], "verify your email")
	}
}

func TestRegisterDuplicateEmail(t *testing.T) {
	handler, authRepo, cleanup := setupTestHandler(t)
	defer cleanup()

	testEmail := "test-duplicate@example.com"
	defer cleanupTestUser(t, authRepo, testEmail)

	e := echo.New()

	// First registration
	reqBody := `{"name":"First User","email":"` + testEmail + `","password":"testpass123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.Register(c))
	assert.Equal(t, http.StatusCreated, rec.Code)

	// Second registration with same email
	reqBody = `{"name":"Second User","email":"` + testEmail + `","password":"anotherpass123"}`
	req = httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec = httptest.NewRecorder()
	c = e.NewContext(req, rec)

	if assert.NoError(t, handler.Register(c)) {
		assert.Equal(t, http.StatusConflict, rec.Code)

		var response map[string]string
		json.Unmarshal(rec.Body.Bytes(), &response)

		assert.Contains(t, response["error"], "already registered")
	}
}

func TestLoginWithInvalidCredentials(t *testing.T) {
	handler, authRepo, cleanup := setupTestHandler(t)
	defer cleanup()

	testEmail := "test-invalid-creds@example.com"
	defer cleanupTestUser(t, authRepo, testEmail)

	// Create and verify user
	ctx := context.Background()
	password := "correctpass123"
	name := "Test User"
	user, err := authRepo.CreateUser(ctx, auth.CreateUserInput{
		Email:    testEmail,
		Name:     &name,
		Password: &password,
	})
	assert.NoError(t, err)

	// Verify user
	err = authRepo.SetVerified(ctx, user.ID, true)
	assert.NoError(t, err)

	e := echo.New()

	// Try to login with wrong password
	reqBody := `{"email":"` + testEmail + `","password":"wrongpassword"}`
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if assert.NoError(t, handler.Login(c)) {
		assert.Equal(t, http.StatusUnauthorized, rec.Code)

		var response map[string]string
		json.Unmarshal(rec.Body.Bytes(), &response)

		assert.Contains(t, response["error"], "Invalid email or password")
	}
}

func TestVerifyEmailWithInvalidToken(t *testing.T) {
	handler, _, cleanup := setupTestHandler(t)
	defer cleanup()

	e := echo.New()

	// Try to verify with invalid token
	req := httptest.NewRequest(http.MethodGet, "/api/auth/verify?token=invalid-token", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if assert.NoError(t, handler.VerifyEmail(c)) {
		assert.Equal(t, http.StatusBadRequest, rec.Code)

		var response map[string]string
		json.Unmarshal(rec.Body.Bytes(), &response)

		assert.Contains(t, response["error"], "Invalid or expired")
	}
}

func TestRegisterValidation(t *testing.T) {
	handler, _, cleanup := setupTestHandler(t)
	defer cleanup()

	e := echo.New()

	tests := []struct {
		name       string
		body       string
		wantStatus int
	}{
		{
			name:       "Missing name",
			body:       `{"email":"test@example.com","password":"testpass123"}`,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "Missing email",
			body:       `{"name":"Test","password":"testpass123"}`,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "Missing password",
			body:       `{"name":"Test","email":"test@example.com"}`,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "Short password",
			body:       `{"name":"Test","email":"test@example.com","password":"short"}`,
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(tt.body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			handler.Register(c)
			assert.Equal(t, tt.wantStatus, rec.Code)
		})
	}
}
