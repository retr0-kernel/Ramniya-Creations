package email

import (
	"fmt"
	"net/smtp"
	"os"
	"path/filepath"
	"time"

	"go.uber.org/zap"
)

// EmailSender defines the interface for sending emails
type EmailSender interface {
	SendVerificationEmail(to, name, verificationURL string) error
	SendPasswordResetEmail(to, name, resetURL string) error
	SendWelcomeEmail(to, name string) error
}

// SMTPConfig holds SMTP configuration
type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

// SMTPEmailSender implements EmailSender using SMTP
type SMTPEmailSender struct {
	config SMTPConfig
	logger *zap.Logger
}

// NewSMTPEmailSender creates a new SMTP email sender
func NewSMTPEmailSender(config SMTPConfig, logger *zap.Logger) *SMTPEmailSender {
	return &SMTPEmailSender{
		config: config,
		logger: logger,
	}
}

// SendVerificationEmail sends an email verification link
func (s *SMTPEmailSender) SendVerificationEmail(to, name, verificationURL string) error {
	subject := "Verify Your Email - Ramniya Creations"

	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Ramniya Creations</h1>
        </div>
        <div class="content">
            <h2>Welcome, %s!</h2>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
                <a href="%s" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">%s</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2024 Ramniya Creations. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, name, verificationURL, verificationURL)

	return s.sendEmail(to, subject, body)
}

// SendPasswordResetEmail sends a password reset link
func (s *SMTPEmailSender) SendPasswordResetEmail(to, name, resetURL string) error {
	subject := "Reset Your Password - Ramniya Creations"

	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Ramniya Creations</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi %s,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
                <a href="%s" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">%s</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
            <p>© 2024 Ramniya Creations. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, name, resetURL, resetURL)

	return s.sendEmail(to, subject, body)
}

// SendWelcomeEmail sends a welcome email after verification
func (s *SMTPEmailSender) SendWelcomeEmail(to, name string) error {
	subject := "Welcome to Ramniya Creations!"

	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Ramniya Creations</h1>
        </div>
        <div class="content">
            <h2>Welcome, %s! 🎉</h2>
            <p>Your email has been verified successfully!</p>
            <p>You can now enjoy all the features of Ramniya Creations:</p>
            <ul>
                <li>Browse our creative collections</li>
                <li>Save your favorites</li>
                <li>Make secure purchases</li>
                <li>Track your orders</li>
            </ul>
            <p>Thank you for joining our community!</p>
        </div>
        <div class="footer">
            <p>© 2024 Ramniya Creations. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, name)

	return s.sendEmail(to, subject, body)
}

// sendEmail sends an email via SMTP
func (s *SMTPEmailSender) sendEmail(to, subject, htmlBody string) error {
	// Build MIME message
	msg := fmt.Sprintf("From: %s\r\n", s.config.From)
	msg += fmt.Sprintf("To: %s\r\n", to)
	msg += fmt.Sprintf("Subject: %s\r\n", subject)
	msg += "MIME-Version: 1.0\r\n"
	msg += "Content-Type: text/html; charset=UTF-8\r\n"
	msg += "\r\n"
	msg += htmlBody

	// Setup authentication
	auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)

	// Send email
	addr := fmt.Sprintf("%s:%d", s.config.Host, s.config.Port)
	err := smtp.SendMail(addr, auth, s.config.From, []string{to}, []byte(msg))
	if err != nil {
		s.logger.Error("Failed to send email",
			zap.String("to", to),
			zap.String("subject", subject),
			zap.Error(err),
		)
		return fmt.Errorf("failed to send email: %w", err)
	}

	s.logger.Info("Email sent successfully",
		zap.String("to", to),
		zap.String("subject", subject),
	)

	return nil
}

// FileEmailSender implements EmailSender by writing to local files (dev mode)
type FileEmailSender struct {
	outputDir string
	logger    *zap.Logger
}

// NewFileEmailSender creates a new file-based email sender for development
func NewFileEmailSender(outputDir string, logger *zap.Logger) (*FileEmailSender, error) {
	// Create output directory if it doesn't exist
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create email output directory: %w", err)
	}

	return &FileEmailSender{
		outputDir: outputDir,
		logger:    logger,
	}, nil
}

// SendVerificationEmail writes verification email to file
func (f *FileEmailSender) SendVerificationEmail(to, name, verificationURL string) error {
	content := fmt.Sprintf(`
===== EMAIL VERIFICATION =====
To: %s
From: noreply@ramniyacreations.com
Subject: Verify Your Email - Ramniya Creations
Date: %s

Hi %s,

Thank you for signing up for Ramniya Creations!

Please verify your email address by clicking the link below:
%s

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

---
© 2024 Ramniya Creations
`, to, time.Now().Format(time.RFC1123), name, verificationURL)

	return f.writeEmailToFile(to, "verification", content)
}

// SendPasswordResetEmail writes password reset email to file
func (f *FileEmailSender) SendPasswordResetEmail(to, name, resetURL string) error {
	content := fmt.Sprintf(`
===== PASSWORD RESET =====
To: %s
From: noreply@ramniyacreations.com
Subject: Reset Your Password - Ramniya Creations
Date: %s

Hi %s,

We received a request to reset your password.

Click the link below to reset your password:
%s

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

---
© 2024 Ramniya Creations
`, to, time.Now().Format(time.RFC1123), name, resetURL)

	return f.writeEmailToFile(to, "password-reset", content)
}

// SendWelcomeEmail writes welcome email to file
func (f *FileEmailSender) SendWelcomeEmail(to, name string) error {
	content := fmt.Sprintf(`
===== WELCOME EMAIL =====
To: %s
From: noreply@ramniyacreations.com
Subject: Welcome to Ramniya Creations!
Date: %s

Welcome, %s! 🎉

Your email has been verified successfully!

You can now enjoy all the features of Ramniya Creations.

Thank you for joining our community!

---
© 2024 Ramniya Creations
`, to, time.Now().Format(time.RFC1123), name)

	return f.writeEmailToFile(to, "welcome", content)
}

// writeEmailToFile writes email content to a file
func (f *FileEmailSender) writeEmailToFile(to, emailType, content string) error {
	timestamp := time.Now().Format("20060102-150405")
	filename := fmt.Sprintf("%s-%s-%s.txt", timestamp, emailType, to)
	filepath := filepath.Join(f.outputDir, filename)

	err := os.WriteFile(filepath, []byte(content), 0644)
	if err != nil {
		f.logger.Error("Failed to write email to file",
			zap.String("filepath", filepath),
			zap.Error(err),
		)
		return fmt.Errorf("failed to write email to file: %w", err)
	}

	f.logger.Info("Email written to file (dev mode)",
		zap.String("filepath", filepath),
		zap.String("to", to),
		zap.String("type", emailType),
	)

	return nil
}
