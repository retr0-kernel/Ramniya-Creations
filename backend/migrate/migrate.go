package migrate

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"sort"
	"strings"

	"go.uber.org/zap"
)

// Migrator handles database migrations
type Migrator struct {
	db            *sql.DB
	logger        *zap.Logger
	migrationsDir string
}

// NewMigrator creates a new migrator instance
func NewMigrator(db *sql.DB, logger *zap.Logger, migrationsDir string) *Migrator {
	return &Migrator{
		db:            db,
		logger:        logger,
		migrationsDir: migrationsDir,
	}
}

// Up runs all pending migrations
func (m *Migrator) Up() error {
	// Create migrations table if it doesn't exist
	if err := m.createMigrationsTable(); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get list of migration files
	files, err := m.getMigrationFiles("up")
	if err != nil {
		return fmt.Errorf("failed to get migration files: %w", err)
	}

	// Get applied migrations
	applied, err := m.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Run pending migrations
	for _, file := range files {
		version := m.getVersionFromFilename(file)
		if applied[version] {
			m.logger.Debug("Migration already applied", zap.String("version", version))
			continue
		}

		m.logger.Info("Running migration", zap.String("file", file))

		content, err := ioutil.ReadFile(filepath.Join(m.migrationsDir, file))
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", file, err)
		}

		// Execute migration in a transaction
		tx, err := m.db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %w", err)
		}

		if _, err := tx.Exec(string(content)); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to execute migration %s: %w", file, err)
		}

		// Record migration
		if _, err := tx.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", version); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %s: %w", file, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration %s: %w", file, err)
		}

		m.logger.Info("Migration applied successfully", zap.String("version", version))
	}

	m.logger.Info("All migrations completed successfully")
	return nil
}

// createMigrationsTable creates the schema_migrations table
func (m *Migrator) createMigrationsTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)
	`
	_, err := m.db.Exec(query)
	return err
}

// getAppliedMigrations returns a map of applied migration versions
func (m *Migrator) getAppliedMigrations() (map[string]bool, error) {
	rows, err := m.db.Query("SELECT version FROM schema_migrations")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}

	return applied, rows.Err()
}

// getMigrationFiles returns a sorted list of migration files
func (m *Migrator) getMigrationFiles(direction string) ([]string, error) {
	files, err := ioutil.ReadDir(m.migrationsDir)
	if err != nil {
		return nil, err
	}

	var migrations []string
	suffix := fmt.Sprintf(".%s.sql", direction)

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), suffix) {
			migrations = append(migrations, file.Name())
		}
	}

	sort.Strings(migrations)
	return migrations, nil
}

// getVersionFromFilename extracts version from migration filename
func (m *Migrator) getVersionFromFilename(filename string) string {
	parts := strings.Split(filename, "_")
	if len(parts) > 0 {
		return parts[0]
	}
	return filename
}
