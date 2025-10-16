#!/usr/bin/env node
/**
 * Generate bcrypt hash for password
 * Usage: node scripts/generate-password-hash.js <password>
 */

const bcrypt = require('bcrypt');

const password = process.argv[2] || 'water123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
});
