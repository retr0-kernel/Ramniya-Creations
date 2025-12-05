package auth

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	_ "github.com/lib/pq"
)

func setupTestDB(t *testing.T) *sql.DB {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}

	return db
}

func cleanupTestUser(t *testing.T, db *sql.DB, email string) {
	_, err := db.Exec("DELETE FROM users WHERE email = $1", email)
	if err != nil {
		t.Logf("Warning: Failed to cleanup test user: %v", err)
	}
}

func TestCreateUser(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewAuthRepository(db)
	ctx := context.Background()

	testEmail := "test@example.com"
	testName := "Test User"
	testPassword := "password123"

	defer cleanupTestUser(t, db, testEmail)

	input := CreateUserInput{
		Email:    testEmail,
		Name:     &testName,
		Password: &testPassword,
	}

	user, err := repo.CreateUser(ctx, input)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	if user.Email != testEmail {
		t.Errorf("Expected email %s, got %s", testEmail, user.Email)
	}

	if user.Name == nil || *user.Name != testName {
		t.Errorf("Expected name %s, got %v", testName, user.Name)
	}

	if user.IsVerified {
		t.Error("Expected user to not be verified by default")
	}

	if user.ID.String() == "" {
		t.Error("Expected user ID to be set")
	}
}

func TestCreateUserWithGoogleID(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewAuthRepository(db)
	ctx := context.Background()

	testEmail := "google@example.com"
	testName := "Google User"
	testGoogleID := "google123"

	defer cleanupTestUser(t, db, testEmail)

	input := CreateUserInput{
		Email:    testEmail,
		Name:     &testName,
		GoogleID: &testGoogleID,
	}

	user, err := repo.CreateUser(ctx, input)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Google OAuth users should be verified by default
	if !user.IsVerified {
		t.Error("Expected Google OAuth user to be verified by default")
	}
}

func TestGetUserByEmail(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewAuthRepository(db)
	ctx := context.Background()

	testEmail := "getuser@example.com"
	testName := "Get User"
	testPassword := "password123"

	defer cleanupTestUser(t, db, testEmail)

	// Create user
	input := CreateUserInput{
		Email:    testEmail,
		Name:     &testName,
		Password: &testPassword,
	}

	createdUser, err := repo.CreateUser(ctx, input)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Get user by email
	user, err := repo.GetUserByEmail(ctx, testEmail)
	if err != nil {
		t.Fatalf("Failed to get user by email: %v", err)
	}

	if user.ID != createdUser.ID {
		t.Errorf("Expected user ID %s, got %s", createdUser.ID, user.ID)
	}

	if user.Email != testEmail {
		t.Errorf("Expected email %s, got %s", testEmail, user.Email)
	}
}

func TestGetUserByEmailNotFound(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewAuthRepository(db)
	ctx := context.Background()

	_, err := repo.GetUserByEmail(ctx, "nonexistent@example.com")
	if err == nil {
		t.Error("Expected error when getting non-existent user")
	}
}

func TestSetVerified(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewAuthRepository(db)
	ctx := context.Background()

	testEmail := "verify@example.com"
	testName := "Verify User"
	testPassword := "password123"

	defer cleanupTestUser(t, db, testEmail)

	// Create user
	input := CreateUserInput{
		Email:    testEmail,
		Name:     &testName,
		Password: &testPassword,
	}

	user, err := repo.CreateUser(ctx, input)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Verify user is not verified
	if user.IsVerified {
		t.Error("Expected user to not be verified initially")
	}

	// Set verified
	err = repo.SetVerified(ctx, user.ID, true)
	if err != nil {
		t.Fatalf("Failed to set user as verified: %v", err)
	}

	// Get user and check
	verifiedUser, err := repo.GetUserByEmail(ctx, testEmail)
	if err != nil {
		t.Fatalf("Failed to get user: %v", err)
	}

	if !verifiedUser.IsVerified {
		t.Error("Expected user to be verified")
	}
}

func TestVerifyPassword(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewAuthRepository(db)
	ctx := context.Background()

	testEmail := "password@example.com"
	testName := "Password User"
	testPassword := "correctpassword"

	defer cleanupTestUser(t, db, testEmail)

	// Create user
	input := CreateUserInput{
		Email:    testEmail,
		Name:     &testName,
		Password: &testPassword,
	}

	_, err := repo.CreateUser(ctx, input)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Test correct password
	user, err := repo.VerifyPassword(ctx, testEmail, testPassword)
	if err != nil {
		t.Fatalf("Failed to verify correct password: %v", err)
	}

	if user.Email != testEmail {
		t.Errorf("Expected email %s, got %s", testEmail, user.Email)
	}

	// Test incorrect password
	_, err = repo.VerifyPassword(ctx, testEmail, "wrongpassword")
	if err == nil {
		t.Error("Expected error when verifying incorrect password")
	}
}
