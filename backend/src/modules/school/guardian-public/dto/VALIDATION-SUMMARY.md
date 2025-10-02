# Guardian Public API - DTO Validation Summary

## Overview
This document outlines all validation rules implemented for the Guardian Public API DTOs.

## Enums and Constants

### PlatformType
- `ios` - iOS mobile app
- `android` - Android mobile app  
- `web` - Web application

### NotificationType
- `attendance` - Student attendance notifications
- `announcement` - School announcements
- `emergency` - Emergency alerts
- `reminder` - Event reminders
- `all` - All notification types

### AttendanceLogType
- `check-in` - Entry logs
- `check-out` - Exit logs
- `all` - All attendance logs

### NotificationPriority
- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `urgent` - Urgent notifications

### RelationshipType
- `Father`, `Mother`, `Guardian`, `Grandfather`, `Grandmother`
- `Uncle`, `Aunt`, `Sibling`, `Other`

## Request DTOs

### GuardianLoginDto
- **email**: 
  - Required, valid email format
  - Max 100 characters
  - Automatically converted to lowercase and trimmed
- **password**: 
  - Required, string
  - Min 6, max 50 characters
- **deviceId**: 
  - Optional, must be valid UUID v4
- **deviceToken**: 
  - Optional, max 255 characters
- **platform**: 
  - Optional, must be one of PlatformType enum values

### UpdateProfileDto
- **firstName/lastName**: 
  - Optional, 2-100 characters
  - Only letters, spaces, hyphens, apostrophes
  - Auto-trimmed
- **middleName**: 
  - Optional, max 100 characters
  - Same character restrictions as names
- **email**: 
  - Optional, valid email format
  - Max 100 characters
  - Auto-converted to lowercase and trimmed
- **phoneNumber**: 
  - Optional, valid phone format (international)
  - Auto-formatted (removes spaces, parentheses, hyphens)
- **address**: 
  - Optional, max 500 characters
  - Auto-trimmed
- **occupation**: 
  - Optional, max 100 characters
- **preferredLanguage**: 
  - Optional, must be: en, es, fr, de, zh, ja, ko, ar

### GetAttendanceLogsDto
- **studentId**: 
  - Optional, must be valid UUID v4
- **limit**: 
  - Optional, 1-100 (default: 50)
- **offset**: 
  - Optional, min 0 (default: 0)
- **days**: 
  - Optional, 1-90 (default: 7)
- **startDate/endDate**: 
  - Optional, must be ISO 8601 format
- **type**: 
  - Optional, must be AttendanceLogType enum value

### GetNotificationsDto
- **limit**: 
  - Optional, 1-100 (default: 50)
- **offset**: 
  - Optional, min 0 (default: 0)
- **type**: 
  - Optional, must be NotificationType enum value
- **unreadOnly**: 
  - Optional, boolean (default: false)
  - Auto-converts string "true"/"false" to boolean
- **studentId**: 
  - Optional, must be valid UUID v4
- **priority**: 
  - Optional, must be NotificationPriority enum value

### MarkNotificationsReadDto
- **notificationIds**: 
  - Required, array of UUID v4 strings
  - Min 1, max 100 items

### AddStudentDto
- **studentId**: 
  - Optional, must be valid UUID v4
- **studentCode**: 
  - Optional, 3-50 characters
  - Only uppercase letters, numbers, hyphens
  - Auto-converted to uppercase and trimmed
- **relationship**: 
  - Optional, must be RelationshipType enum value

### ChangePasswordDto
- **currentPassword**: 
  - Required, string
- **newPassword**: 
  - Required, 6-50 characters
  - Must contain at least one uppercase, one lowercase, and one number
- **confirmPassword**: 
  - Required, must match newPassword

### UpdateNotificationPreferencesDto
- **attendanceNotifications**: 
  - Optional, boolean
- **announcementNotifications**: 
  - Optional, boolean
- **emergencyNotifications**: 
  - Optional, boolean
- **reminderNotifications**: 
  - Optional, boolean
- **quietHoursStart/End**: 
  - Optional, HH:mm format (24-hour)

### UpdateDeviceTokenDto
- **deviceToken**: 
  - Required, max 255 characters
- **platform**: 
  - Required, must be PlatformType enum value
- **deviceId**: 
  - Optional, must be valid UUID v4

## Response DTOs

All response DTOs include Swagger/OpenAPI documentation with proper type definitions and examples.

### Key Features:
- Automatic trimming of string inputs
- Email normalization (lowercase)
- Phone number formatting
- UUID validation for IDs
- Enum validation for predefined values
- Range validation for numeric inputs
- Pattern matching for specific formats
- Array size limits
- Character length limits

## Testing

Run the test script to verify validation:
```bash
node test-guardian-api.js
```

This will test various validation scenarios including:
- Invalid email formats
- Password length requirements
- Invalid enum values
- UUID validation
- Required field validation
