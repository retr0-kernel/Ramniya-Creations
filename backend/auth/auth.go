package auth

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	Name         *string   `json:"name,omitempty"`
	PasswordHash *string   `json:"-"`
	GoogleID     *string   `json:"-"`
	IsVerified   bool      `json:"is_verified"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// CreateUserInput represents input for creating a new user
type CreateUserInput struct {
	Email    string
	Name     *string
	Password *string
	GoogleID *string
}

// AuthRepository handles user authentication operations
type AuthRepository struct {
	db *sql.DB
}

// NewAuthRepository creates a new auth repository
func NewAuthRepository(db *sql.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

// CreateUser creates a new user in the database
func (r *AuthRepository) CreateUser(ctx context.Context, input CreateUserInput) (*User, error) {
	var passwordHash *string

	// Hash password if provided
	if input.Password != nil && *input.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(*input.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, fmt.Errorf("failed to hash password: %w", err)
		}
		hashStr := string(hash)
		passwordHash = &hashStr
	}

	// Validate that at least one auth method is provided
	if passwordHash == nil && input.GoogleID == nil {
		return nil, fmt.Errorf("either password or google_id must be provided")
	}

	user := &User{}

	query := `
		INSERT INTO users (email, name, password_hash, google_id, is_verified)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, email, name, is_verified, created_at, updated_at
	`

	// Google OAuth users are verified by default
	isVerified := input.GoogleID != nil

	err := r.db.QueryRowContext(
		ctx,
		query,
		input.Email,
		input.Name,
		passwordHash,
		input.GoogleID,
		isVerified,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.IsVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

// GetUserByEmail retrieves a user by email
func (r *AuthRepository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	user := &User{}

	query := `
		SELECT id, email, name, password_hash, google_id, is_verified, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.PasswordHash,
		&user.GoogleID,
		&user.IsVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (r *AuthRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	user := &User{}

	query := `
		SELECT id, email, name, password_hash, google_id, is_verified, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.PasswordHash,
		&user.GoogleID,
		&user.IsVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// GetUserByGoogleID retrieves a user by Google ID
func (r *AuthRepository) GetUserByGoogleID(ctx context.Context, googleID string) (*User, error) {
	user := &User{}

	query := `
		SELECT id, email, name, password_hash, google_id, is_verified, created_at, updated_at
		FROM users
		WHERE google_id = $1
	`

	err := r.db.QueryRowContext(ctx, query, googleID).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.PasswordHash,
		&user.GoogleID,
		&user.IsVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// SetVerified marks a user as verified
func (r *AuthRepository) SetVerified(ctx context.Context, userID uuid.UUID, verified bool) error {
	query := `
		UPDATE users
		SET is_verified = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := r.db.ExecContext(ctx, query, verified, userID)
	if err != nil {
		return fmt.Errorf("failed to update user verification status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// VerifyPassword checks if the provided password matches the user's password hash
func (r *AuthRepository) VerifyPassword(ctx context.Context, email, password string) (*User, error) {
	user, err := r.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if user.PasswordHash == nil {
		return nil, fmt.Errorf("user does not have a password set")
	}

	err = bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(password))
	if err != nil {
		return nil, fmt.Errorf("invalid password")
	}

	return user, nil
}

// UpdatePassword updates a user's password
func (r *AuthRepository) UpdatePassword(ctx context.Context, userID uuid.UUID, newPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	query := `
		UPDATE users
		SET password_hash = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := r.db.ExecContext(ctx, query, string(hash), userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// LinkGoogleID links a Google ID to an existing user
func (r *AuthRepository) LinkGoogleID(ctx context.Context, userID uuid.UUID, googleID string) error {
	query := `
		UPDATE users
		SET google_id = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := r.db.ExecContext(ctx, query, googleID, userID)
	if err != nil {
		return fmt.Errorf("failed to link Google ID: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
