-- Test data for sync API testing
-- This creates a test license key and company for testing

-- Insert test company if it doesn't exist
INSERT INTO "Company" (id, "companyName", "domainPrefix", email, "isActive", "createdAt", "updatedAt")
VALUES (999, 'Test School', 'test-school', 'test@school.com', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test device license
INSERT INTO "DeviceLicense" ("licenseKey", "companyId", "isActive", "createdAt", "updatedAt", "isDeleted")
VALUES ('TEST-SYNC-LICENSE-2024', 999, true, NOW(), NOW(), false)
ON CONFLICT ("licenseKey") DO UPDATE SET "isActive" = true, "isDeleted" = false;

-- Insert some test students
INSERT INTO "Student" (id, "studentNumber", username, email, password, key, "firstName", "lastName", "dateOfBirth", gender, "companyId", "createdAt", "updatedAt")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '2024-000001', 'john.doe', 'john.doe@school.com', 'hashed_password', E'\\x0123456789ABCDEF', 'John', 'Doe', '2010-01-01', 'Male', 999, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', '2024-000002', 'jane.smith', 'jane.smith@school.com', 'hashed_password', E'\\x0123456789ABCDEF', 'Jane', 'Smith', '2010-02-01', 'Female', 999, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test guardian (password: water123)
-- Hash generated using: node scripts/generate-password-hash.js water123
INSERT INTO "Guardian" (id, "firstName", "lastName", "dateOfBirth", email, password, key, "contactNumber", "companyId", "isActive", "searchKeyword", "createdAt", "updatedAt")
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Robert', 'Doe', '1980-01-01', 'robert.doe@email.com', '$2b$10$.Rinx45q0iAf8/FukpTgr.IQTq.OB7lcOL5eO2a2NYhAKkTlRNmBO', E'\\x0123456789ABCDEF', '9171234567', 999, true, 'robert doe robert.doe@email.com 9171234567', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  password = EXCLUDED.password,
  "isActive" = EXCLUDED."isActive",
  "searchKeyword" = EXCLUDED."searchKeyword";

-- Link test guardian to students
INSERT INTO "StudentGuardian" (id, "guardianId", "studentId", relationship, "isPrimary", "createdAt", "updatedAt")
VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Father', true, NOW(), NOW()),
  ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Father', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;