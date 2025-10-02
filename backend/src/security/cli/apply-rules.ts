#!/usr/bin/env node
/**
 * Apply Database Security Rules
 * Directly applies RLS policies to the database
 * Supports both legacy monolithic file and new modular structure
 */

import { Client } from 'pg';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface ApplyOptions {
  dryRun?: boolean;
  force?: boolean;
  showSql?: boolean;
  tables?: string[];
  listTables?: boolean;
  all?: boolean;
}

class RulesApplicator {
  private client: Client;
  private rulesDir: string;
  private legacyRulesPath: string;

  constructor() {
    this.rulesDir = join(__dirname, '..', 'rules');
    this.legacyRulesPath = join(__dirname, '..', 'database-rules.sql');
  }

  async apply(): Promise<void> {
    console.log(
      `${COLORS.cyan}Database Security Rules Applicator${COLORS.reset}`,
    );
    console.log('='.repeat(50));
    console.log();

    try {
      // Parse command line arguments
      const options = this.parseArguments();

      if (options.listTables) {
        this.listAvailableTables();
        return;
      }

      // Connect to database
      await this.connect();

      // Get SQL to execute
      const { sql, description } = await this.getSqlToExecute(options);

      if (options.showSql) {
        console.log(`${COLORS.blue}SQL to be executed:${COLORS.reset}`);
        console.log('='.repeat(50));
        console.log(sql);
        console.log('='.repeat(50));
        console.log();
      }

      if (options.dryRun) {
        console.log(
          `${COLORS.yellow}DRY RUN MODE - No changes will be made${COLORS.reset}`,
        );
        console.log(
          `${COLORS.blue}Would execute:${COLORS.reset} ${description}`,
        );
        console.log();
        await this.showCurrentState();
      } else {
        // Confirmation prompt unless --force
        if (!options.force) {
          console.log(
            `${COLORS.yellow}⚠️  WARNING: This will modify database security rules!${COLORS.reset}`,
          );
          console.log(`Database: ${this.getDatabaseName()}`);
          console.log(`Operation: ${description}`);
          console.log();
          console.log(
            `${COLORS.yellow}Are you sure? Type 'yes' to continue:${COLORS.reset} `,
          );

          const response = await this.prompt();
          if (response !== 'yes') {
            console.log(`${COLORS.red}Aborted by user${COLORS.reset}`);
            process.exit(0);
          }
        }

        // Apply rules
        console.log(`${COLORS.blue}${description}...${COLORS.reset}`);

        // Execute SQL in transaction
        await this.client.query('BEGIN');
        try {
          await this.client.query(sql);
          await this.client.query('COMMIT');
        } catch (error) {
          await this.client.query('ROLLBACK');
          throw error;
        }

        console.log(
          `${COLORS.green}✓ Security rules applied successfully!${COLORS.reset}`,
        );
        console.log();

        // Show summary
        await this.showSummary();
      }
    } catch (error) {
      console.error(
        `${COLORS.red}✗ Failed to apply rules:${COLORS.reset}`,
        error.message,
      );
      if (error.detail) {
        console.error('Details:', error.detail);
      }
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }

  private parseArguments(): ApplyOptions {
    const args = process.argv.slice(2);
    const options: ApplyOptions = {
      dryRun: args.includes('--dry-run'),
      force: args.includes('--force'),
      showSql: args.includes('--show-sql'),
      listTables: args.includes('--list'),
      all:
        args.includes('--all') ||
        (!args.find((arg) => arg.startsWith('--table')) &&
          !args.includes('--list')),
    };

    // Parse --table argument
    const tableArg = args.find((arg) => arg.startsWith('--table='));
    if (tableArg) {
      const tableNames = tableArg.split('=')[1];
      options.tables = tableNames.split(',').map((name) => name.trim());
      options.all = false;
    }

    return options;
  }

  private listAvailableTables(): void {
    console.log(`${COLORS.blue}Available table rule files:${COLORS.reset}`);
    console.log();

    const tablesDir = join(this.rulesDir, 'tables');
    if (!existsSync(tablesDir)) {
      console.log(
        `${COLORS.red}Tables directory not found: ${tablesDir}${COLORS.reset}`,
      );
      return;
    }

    const files = readdirSync(tablesDir)
      .filter((file) => file.endsWith('.sql'))
      .map((file) => file.replace('.sql', ''))
      .sort();

    if (files.length === 0) {
      console.log(`${COLORS.yellow}No table rule files found${COLORS.reset}`);
      return;
    }

    files.forEach((tableName) => {
      console.log(`  ${COLORS.cyan}${tableName}${COLORS.reset}`);
    });

    console.log();
    console.log(`${COLORS.blue}Usage examples:${COLORS.reset}`);
    console.log(`  yarn security:apply-table account`);
    console.log(`  yarn security:apply-table account,company,role`);
    console.log(`  yarn security:apply-table account --dry-run`);
  }

  private async getSqlToExecute(
    options: ApplyOptions,
  ): Promise<{ sql: string; description: string }> {
    if (options.all) {
      // Use new modular structure if available, fallback to legacy
      if (existsSync(this.rulesDir)) {
        return {
          sql: await this.buildModularSql(),
          description: 'Applying all security rules using modular structure',
        };
      } else if (existsSync(this.legacyRulesPath)) {
        return {
          sql: readFileSync(this.legacyRulesPath, 'utf8'),
          description: 'Applying all security rules using legacy file',
        };
      } else {
        throw new Error(
          'No security rules found. Neither modular structure nor legacy file exists.',
        );
      }
    } else if (options.tables) {
      return {
        sql: await this.buildTableSpecificSql(options.tables),
        description: `Applying rules for tables: ${options.tables.join(', ')}`,
      };
    } else {
      throw new Error('Invalid options: must specify --all or --table=<names>');
    }
  }

  private async buildModularSql(): Promise<string> {
    const sqlParts: string[] = [];

    // Add transaction start
    sqlParts.push('BEGIN;');

    // Add common files first
    const commonDir = join(this.rulesDir, '_common');
    if (existsSync(commonDir)) {
      const commonFiles = readdirSync(commonDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of commonFiles) {
        const filePath = join(commonDir, file);
        const content = readFileSync(filePath, 'utf8');
        sqlParts.push(`-- From ${file}`);
        sqlParts.push(content);
        sqlParts.push('');
      }
    }

    // Add security functions first (before policies that depend on them)
    const functionsDir = join(this.rulesDir, '_functions');
    if (existsSync(functionsDir)) {
      const functionFiles = readdirSync(functionsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of functionFiles) {
        const filePath = join(functionsDir, file);
        const content = readFileSync(filePath, 'utf8');
        sqlParts.push(`-- From _functions/${file}`);
        sqlParts.push(content);
        sqlParts.push('');
      }
    }

    // Add table-specific rules
    const tablesDir = join(this.rulesDir, 'tables');
    if (existsSync(tablesDir)) {
      const tableFiles = readdirSync(tablesDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of tableFiles) {
        const filePath = join(tablesDir, file);
        const content = readFileSync(filePath, 'utf8');
        sqlParts.push(`-- From tables/${file}`);
        sqlParts.push(content);
        sqlParts.push('');
      }
    }

    // Add grant files
    const grantsDir = join(this.rulesDir, '_grants');
    if (existsSync(grantsDir)) {
      const grantFiles = readdirSync(grantsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of grantFiles) {
        const filePath = join(grantsDir, file);
        const content = readFileSync(filePath, 'utf8');
        sqlParts.push(`-- From _grants/${file}`);
        sqlParts.push(content);
        sqlParts.push('');
      }
    }

    // Add transaction end
    sqlParts.push('COMMIT;');

    return sqlParts.join('\n');
  }

  private async buildTableSpecificSql(tableNames: string[]): Promise<string> {
    const sqlParts: string[] = [];

    // Add transaction start
    sqlParts.push('BEGIN;');

    // Only add cleanup and enable RLS for table-specific operations
    const commonDir = join(this.rulesDir, '_common');
    if (existsSync(commonDir)) {
      // For table-specific operations, we might not want to drop ALL policies
      // but for now, keep it simple and use the same cleanup
      const cleanupFile = join(commonDir, '00-cleanup.sql');
      if (existsSync(cleanupFile)) {
        const content = readFileSync(cleanupFile, 'utf8');
        sqlParts.push('-- Cleanup existing policies');
        sqlParts.push(content);
        sqlParts.push('');
      }

      const enableRlsFile = join(commonDir, '01-enable-rls.sql');
      if (existsSync(enableRlsFile)) {
        const content = readFileSync(enableRlsFile, 'utf8');
        sqlParts.push('-- Enable RLS');
        sqlParts.push(content);
        sqlParts.push('');
      }

      const bypassFile = join(commonDir, '02-bypass-superuser.sql');
      if (existsSync(bypassFile)) {
        const content = readFileSync(bypassFile, 'utf8');
        sqlParts.push('-- Superuser bypass');
        sqlParts.push(content);
        sqlParts.push('');
      }
    }

    // Add specific table rules
    const tablesDir = join(this.rulesDir, 'tables');
    for (const tableName of tableNames) {
      const filePath = join(tablesDir, `${tableName}.sql`);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        sqlParts.push(`-- Rules for table: ${tableName}`);
        sqlParts.push(content);
        sqlParts.push('');
      } else {
        throw new Error(`Table rule file not found: ${tableName}.sql`);
      }
    }

    // Add grants if applying to all tables anyway (for simplicity)
    const grantsDir = join(this.rulesDir, '_grants');
    if (existsSync(grantsDir)) {
      const grantFiles = readdirSync(grantsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of grantFiles) {
        const filePath = join(grantsDir, file);
        const content = readFileSync(filePath, 'utf8');
        sqlParts.push(`-- From _grants/${file}`);
        sqlParts.push(content);
        sqlParts.push('');
      }
    }

    // Add transaction end
    sqlParts.push('COMMIT;');

    return sqlParts.join('\n');
  }

  private async connect(): Promise<void> {
    console.log('Connecting to database...');

    // Use DIRECT_URL for migrations if available, otherwise DATABASE_URL
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    this.client = new Client({
      connectionString,
      ssl: connectionString.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
    });

    await this.client.connect();
    console.log(`${COLORS.green}✓ Connected to database${COLORS.reset}`);
    console.log();
  }

  private async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
    }
  }

  private getDatabaseName(): string {
    const url = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
    const match = url.match(/\/([^?]+)(\?|$)/);
    return match ? match[1] : 'unknown';
  }

  private async showCurrentState(): Promise<void> {
    console.log(`${COLORS.blue}Current Database State:${COLORS.reset}`);
    console.log();

    // Count tables with RLS
    const rlsResult = await this.client.query(`
      SELECT COUNT(*) as count
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public' 
      AND c.relrowsecurity = true
      AND t.tablename NOT LIKE '_prisma%'
    `);

    console.log(`Tables with RLS enabled: ${rlsResult.rows[0].count}`);

    // Count policies
    const policyResult = await this.client.query(`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public'
    `);

    console.log(`Total policies: ${policyResult.rows[0].count}`);

    // Show sample policies
    const samplePolicies = await this.client.query(`
      SELECT tablename, policyname, cmd, permissive
      FROM pg_policies
      WHERE schemaname = 'public'
      LIMIT 5
    `);

    if (samplePolicies.rows.length > 0) {
      console.log();
      console.log('Sample policies:');
      samplePolicies.rows.forEach((row) => {
        console.log(`  - ${row.tablename}.${row.policyname} (${row.cmd})`);
      });
    }

    console.log();
  }

  private async showSummary(): Promise<void> {
    // Get counts
    const tableResult = await this.client.query(`
      SELECT COUNT(*) as count
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public' 
      AND c.relrowsecurity = true
      AND t.tablename NOT LIKE '_prisma%'
    `);

    const policyResult = await this.client.query(`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public'
    `);

    console.log(`${COLORS.blue}Summary:${COLORS.reset}`);
    console.log(`  Tables with RLS: ${tableResult.rows[0].count}`);
    console.log(`  Total policies: ${policyResult.rows[0].count}`);
    console.log();
    console.log(`${COLORS.green}Security rules are now active!${COLORS.reset}`);
    console.log();
    console.log('Note: For rules to work with the application:');
    console.log(
      "  1. Frontend requests must set: current_setting('app.source', 'frontend-main')",
    );
    console.log(
      "  2. Backend requests must set: current_setting('app.source', 'backend')",
    );
    console.log('  3. Or rely on the Prisma middleware for enforcement');
  }

  private prompt(): Promise<string> {
    return new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }
}

// Display help
function displayHelp(): void {
  console.log(
    `${COLORS.cyan}Database Security Rules Applicator${COLORS.reset}`,
  );
  console.log();
  console.log('Usage: yarn security:apply-rules [options]');
  console.log();
  console.log('Options:');
  console.log('  --all               Apply all security rules (default)');
  console.log(
    '  --table=<names>     Apply rules for specific tables (comma-separated)',
  );
  console.log('  --list              List available table rule files');
  console.log(
    '  --dry-run           Show what would be executed without making changes',
  );
  console.log('  --force             Skip confirmation prompt');
  console.log('  --show-sql          Display the SQL that will be executed');
  console.log('  --help              Show this help message');
  console.log();
  console.log('Examples:');
  console.log(
    '  yarn security:apply-rules                          # Apply all rules',
  );
  console.log(
    '  yarn security:apply-rules --all                    # Apply all rules',
  );
  console.log(
    '  yarn security:apply-rules --table=account          # Apply account table rules',
  );
  console.log(
    '  yarn security:apply-rules --table=account,company  # Apply multiple tables',
  );
  console.log(
    '  yarn security:apply-rules --list                   # List available tables',
  );
  console.log(
    '  yarn security:apply-rules --dry-run                # Preview all changes',
  );
  console.log(
    '  yarn security:apply-rules --table=account --dry-run # Preview account changes',
  );
  console.log(
    '  yarn security:apply-rules --force                  # Skip confirmation',
  );
  console.log(
    '  yarn security:apply-rules --show-sql --dry-run     # Show SQL without executing',
  );
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
    process.exit(0);
  }

  const applicator = new RulesApplicator();
  applicator.apply().catch(console.error);
}
