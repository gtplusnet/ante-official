#!/usr/bin/env node
/**
 * Apply Database Views
 * Applies all database views from the definitions directory to the database
 */

import { Client } from 'pg';
import { readFileSync, readdirSync, statSync } from 'fs';
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
};

interface ViewFile {
  name: string;
  path: string;
  content: string;
}

class ViewsApplicator {
  private client: Client;
  private definitionsPath: string;

  constructor() {
    this.definitionsPath = join(__dirname, '..', 'definitions');
  }

  async apply(): Promise<void> {
    console.log(`${COLORS.cyan}Database Views Applicator${COLORS.reset}`);
    console.log('='.repeat(50));
    console.log();

    try {
      // Parse command line arguments
      const args = process.argv.slice(2);
      const dryRun = args.includes('--dry-run');
      const force = args.includes('--force');
      const showSql = args.includes('--show-sql');
      const listOnly = args.includes('--list');
      const onlyArg = args.find((arg) => arg.startsWith('--only='));
      const excludeArg = args.find((arg) => arg.startsWith('--exclude='));

      // Get view files
      const viewFiles = this.getViewFiles();

      // Filter views based on --only and --exclude flags
      let filteredViews = viewFiles;

      if (onlyArg) {
        const onlyViews = onlyArg
          .split('=')[1]
          .split(',')
          .map((v) => v.trim());
        filteredViews = viewFiles.filter((view) =>
          onlyViews.some((only) => view.name.includes(only)),
        );
        console.log(
          `${COLORS.yellow}Applying only: ${onlyViews.join(', ')}${COLORS.reset}`,
        );
        console.log();
      }

      if (excludeArg) {
        const excludeViews = excludeArg
          .split('=')[1]
          .split(',')
          .map((v) => v.trim());
        filteredViews = filteredViews.filter(
          (view) =>
            !excludeViews.some((exclude) => view.name.includes(exclude)),
        );
        console.log(
          `${COLORS.yellow}Excluding: ${excludeViews.join(', ')}${COLORS.reset}`,
        );
        console.log();
      }

      if (listOnly) {
        this.listViews(viewFiles);
        return;
      }

      if (filteredViews.length === 0) {
        console.log(`${COLORS.yellow}No views found to apply.${COLORS.reset}`);
        return;
      }

      // Connect to database
      await this.connect();

      // Combine all SQL
      const combinedSql = filteredViews
        .map((view) => view.content)
        .join('\n\n');

      if (showSql) {
        console.log(`${COLORS.blue}SQL to be executed:${COLORS.reset}`);
        console.log('='.repeat(50));
        console.log(combinedSql);
        console.log('='.repeat(50));
        console.log();
      }

      if (dryRun) {
        console.log(
          `${COLORS.yellow}DRY RUN MODE - No changes will be made${COLORS.reset}`,
        );
        console.log();

        console.log(`Views to be applied: ${filteredViews.length}`);
        filteredViews.forEach((view) => {
          console.log(`  - ${view.name}`);
        });
        console.log();

        // Show current state
        await this.showCurrentState();
      } else {
        // Confirmation prompt unless --force
        if (!force) {
          console.log(
            `${COLORS.yellow}⚠️  WARNING: This will modify database views!${COLORS.reset}`,
          );
          console.log(`Database: ${this.getDatabaseName()}`);
          console.log();
          console.log('This will:');
          console.log('  1. Drop existing views if they exist');
          console.log('  2. Create new/updated views');
          console.log('  3. Apply permissions');
          console.log();
          console.log(`Views to be applied: ${filteredViews.length}`);
          filteredViews.forEach((view) => {
            console.log(`  - ${view.name}`);
          });
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

        // Apply views
        console.log(`${COLORS.blue}Applying database views...${COLORS.reset}`);

        // Execute SQL
        const result = await this.client.query(combinedSql);

        console.log(
          `${COLORS.green}✓ Database views applied successfully!${COLORS.reset}`,
        );
        console.log();

        // Show summary
        await this.showSummary(filteredViews);
      }
    } catch (error) {
      console.error(
        `${COLORS.red}✗ Failed to apply views:${COLORS.reset}`,
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

  private getViewFiles(): ViewFile[] {
    const viewFiles: ViewFile[] = [];

    try {
      const files = readdirSync(this.definitionsPath);

      files.forEach((file) => {
        if (file.endsWith('.sql')) {
          const filePath = join(this.definitionsPath, file);
          const stats = statSync(filePath);

          if (stats.isFile()) {
            const content = readFileSync(filePath, 'utf8');
            viewFiles.push({
              name: file.replace('.sql', ''),
              path: filePath,
              content: content,
            });
          }
        }
      });

      // Sort alphabetically for consistent ordering
      return viewFiles.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Failed to read view definitions: ${error.message}`);
    }
  }

  private listViews(viewFiles: ViewFile[]): void {
    console.log(`${COLORS.blue}Available Views:${COLORS.reset}`);
    console.log();

    if (viewFiles.length === 0) {
      console.log('No view files found in definitions directory.');
      return;
    }

    viewFiles.forEach((view, index) => {
      console.log(`${index + 1}. ${view.name}`);
      console.log(`   File: ${view.path}`);

      // Extract view name from SQL (look for CREATE VIEW or CREATE OR REPLACE VIEW)
      const viewMatch = view.content.match(
        /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(\w+)/i,
      );
      if (viewMatch) {
        console.log(`   Creates: ${viewMatch[1]}`);
      }
      console.log();
    });
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

    // Count existing views
    const viewsResult = await this.client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_schema = 'public'
    `);

    console.log(`Total views in public schema: ${viewsResult.rows[0].count}`);

    // List sample views
    const sampleViews = await this.client.query(`
      SELECT table_name, view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
      LIMIT 5
    `);

    if (sampleViews.rows.length > 0) {
      console.log();
      console.log('Sample existing views:');
      sampleViews.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
      });
    }

    console.log();
  }

  private async showSummary(appliedViews: ViewFile[]): Promise<void> {
    // Get counts
    const viewsResult = await this.client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_schema = 'public'
    `);

    console.log(`${COLORS.blue}Summary:${COLORS.reset}`);
    console.log(`  Total views in database: ${viewsResult.rows[0].count}`);
    console.log(`  Views applied: ${appliedViews.length}`);
    console.log();

    appliedViews.forEach((view) => {
      console.log(`  ✓ ${view.name}`);
    });

    console.log();
    console.log(`${COLORS.green}Database views are now active!${COLORS.reset}`);
    console.log();
    console.log('Note: Views are immediately available for queries via:');
    console.log('  1. Direct SQL queries');
    console.log('  2. Supabase PostgREST API (like any table)');
    console.log('  3. Frontend Supabase client (read-only access)');
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
  console.log(`${COLORS.cyan}Database Views Applicator${COLORS.reset}`);
  console.log();
  console.log('Usage: yarn views:apply [options]');
  console.log();
  console.log('Options:');
  console.log(
    '  --dry-run           Show what would be applied without making changes',
  );
  console.log('  --force             Skip confirmation prompt');
  console.log('  --show-sql          Display the SQL that will be executed');
  console.log('  --list              List all available view files');
  console.log(
    '  --only=view1,view2  Apply only specific views (partial name match)',
  );
  console.log(
    '  --exclude=view1,view2  Exclude specific views from being applied',
  );
  console.log('  --help              Show this help message');
  console.log();
  console.log('Examples:');
  console.log('  yarn views:apply');
  console.log('  yarn views:apply --dry-run');
  console.log('  yarn views:apply --force');
  console.log('  yarn views:apply --list');
  console.log('  yarn views:apply --only=accounts-without');
  console.log('  yarn views:apply --exclude=test-views');
  console.log('  yarn views:apply --show-sql --dry-run');
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
    process.exit(0);
  }

  const applicator = new ViewsApplicator();
  applicator.apply().catch(console.error);
}
