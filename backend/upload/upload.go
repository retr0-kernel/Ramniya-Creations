package upload

import (
	"crypto/sha1"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go.uber.org/zap"
)

const (
	MaxFileSize    = 5 * 1024 * 1024 // 5MB
	UploadDir      = "/var/www/ramniya/uploads"
	PlaceholderURL = "/uploads/placeholder.jpg"
)

var AllowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

var AllowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/webp": true,
}

// UploadService handles file uploads
type UploadService struct {
	uploadDir string
	logger    *zap.Logger
}

// NewUploadService creates a new upload service
func NewUploadService(uploadDir string, logger *zap.Logger) (*UploadService, error) {
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	return &UploadService{
		uploadDir: uploadDir,
		logger:    logger,
	}, nil
}

// UploadResult represents the result of an upload
type UploadResult struct {
	Path     string // Relative path: 2024/12/abc123.jpg
	FullPath string // Absolute path: /var/www/ramniya/uploads/2024/12/abc123.jpg
	Filename string // Original filename
	Size     int64
}

// ValidateFile validates file type and size
func (s *UploadService) ValidateFile(fileHeader *multipart.FileHeader) error {
	// Check file size
	if fileHeader.Size > MaxFileSize {
		return fmt.Errorf("file size exceeds maximum limit of %d bytes (%.1f MB)", MaxFileSize, float64(MaxFileSize)/(1024*1024))
	}

	// Check extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !AllowedExtensions[ext] {
		return fmt.Errorf("file type not allowed: %s (allowed: jpg, jpeg, png, webp)", ext)
	}

	// Check MIME type
	file, err := fileHeader.Open()
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Read first 512 bytes for MIME detection
	buffer := make([]byte, 512)
	_, err = file.Read(buffer)
	if err != nil && err != io.EOF {
		return fmt.Errorf("failed to read file: %w", err)
	}

	// Reset file pointer
	file.Seek(0, 0)

	// Check MIME type
	contentType := fileHeader.Header.Get("Content-Type")
	if !AllowedMimeTypes[contentType] {
		return fmt.Errorf("MIME type not allowed: %s (allowed: image/jpeg, image/png, image/webp)", contentType)
	}

	return nil
}

// SaveFile saves an uploaded file with hashed filename
func (s *UploadService) SaveFile(fileHeader *multipart.FileHeader) (*UploadResult, error) {
	// Validate file
	if err := s.ValidateFile(fileHeader); err != nil {
		return nil, err
	}

	// Open uploaded file
	src, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()

	// Create date-based directory structure: YYYY/MM
	now := time.Now()
	dateDir := fmt.Sprintf("%d/%02d", now.Year(), now.Month())
	fullDateDir := filepath.Join(s.uploadDir, dateDir)

	if err := os.MkdirAll(fullDateDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create date directory: %w", err)
	}

	// Generate hashed filename
	hashedFilename, err := s.generateHashedFilename(src, fileHeader.Filename)
	if err != nil {
		return nil, fmt.Errorf("failed to generate filename: %w", err)
	}

	// Reset file pointer after hashing
	src.Seek(0, 0)

	// Full path for saving
	relativePath := filepath.Join(dateDir, hashedFilename)
	fullPath := filepath.Join(s.uploadDir, relativePath)

	// Check if file already exists
	if _, err := os.Stat(fullPath); err == nil {
		// File already exists, return existing path
		s.logger.Info("File already exists, skipping upload",
			zap.String("path", relativePath),
		)
		return &UploadResult{
			Path:     relativePath,
			FullPath: fullPath,
			Filename: fileHeader.Filename,
			Size:     fileHeader.Size,
		}, nil
	}

	// Create destination file with restricted permissions (no execute)
	dst, err := os.OpenFile(fullPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return nil, fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()

	// Copy file
	written, err := io.Copy(dst, src)
	if err != nil {
		// Clean up partial file on error
		os.Remove(fullPath)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	s.logger.Info("File uploaded successfully",
		zap.String("path", relativePath),
		zap.Int64("size", written),
	)

	return &UploadResult{
		Path:     relativePath,
		FullPath: fullPath,
		Filename: fileHeader.Filename,
		Size:     written,
	}, nil
}

// generateHashedFilename generates a SHA1-based filename
func (s *UploadService) generateHashedFilename(reader io.Reader, originalFilename string) (string, error) {
	// Calculate SHA1 hash
	hash := sha1.New()
	if _, err := io.Copy(hash, reader); err != nil {
		return "", err
	}

	// Get file extension
	ext := strings.ToLower(filepath.Ext(originalFilename))
	if ext == "" {
		ext = ".jpg" // Default extension
	}

	// Sanitize extension (remove multiple dots, special characters)
	ext = sanitizeExtension(ext)

	// Generate filename: hash + extension
	hashSum := fmt.Sprintf("%x", hash.Sum(nil))
	filename := hashSum + ext

	return filename, nil
}

// sanitizeExtension ensures the extension is safe
func sanitizeExtension(ext string) string {
	// Remove all but the last dot and the extension
	ext = strings.ToLower(ext)
	ext = strings.TrimSpace(ext)

	// Ensure it starts with a dot
	if !strings.HasPrefix(ext, ".") {
		ext = "." + ext
	}

	// Remove any additional dots or special characters
	ext = strings.Map(func(r rune) rune {
		if r == '.' || (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			return r
		}
		return -1
	}, ext)

	// Validate it's an allowed extension
	if !AllowedExtensions[ext] {
		return ".jpg" // Default to jpg if invalid
	}

	return ext
}

// DeleteFile deletes an uploaded file
func (s *UploadService) DeleteFile(relativePath string) error {
	fullPath := filepath.Join(s.uploadDir, relativePath)

	// Security check: ensure path is within upload directory
	absPath, err := filepath.Abs(fullPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	absUploadDir, err := filepath.Abs(s.uploadDir)
	if err != nil {
		return fmt.Errorf("failed to get upload directory path: %w", err)
	}

	if !strings.HasPrefix(absPath, absUploadDir) {
		return fmt.Errorf("invalid path: outside upload directory")
	}

	// Delete file
	if err := os.Remove(fullPath); err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("file not found")
		}
		return fmt.Errorf("failed to delete file: %w", err)
	}

	s.logger.Info("File deleted successfully",
		zap.String("path", relativePath),
	)

	return nil
}

// FileExists checks if a file exists
func (s *UploadService) FileExists(relativePath string) bool {
	fullPath := filepath.Join(s.uploadDir, relativePath)
	_, err := os.Stat(fullPath)
	return err == nil
}

// GetPlaceholderURL returns the placeholder URL for missing images
func GetPlaceholderURL() string {
	return PlaceholderURL
}
