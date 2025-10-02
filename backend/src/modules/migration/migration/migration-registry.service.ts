import { Injectable, Logger } from '@nestjs/common';
import { Migration } from '../interfaces/migration.interface';
import { PasswordBcryptMigration } from '../migrations/001-password-bcrypt.migration';

@Injectable()
export class MigrationRegistry {
  private readonly logger = new Logger(MigrationRegistry.name);
  private readonly migrations = new Map<string, Migration>();

  async registerMigrations() {
    // Register all migrations here in order
    const migrations: Migration[] = [
      new PasswordBcryptMigration(),
      // Add new migrations here
    ];

    for (const migration of migrations) {
      this.registerMigration(migration);
    }

    this.logger.log(`Registered ${migrations.length} migrations`);
  }

  registerMigration(migration: Migration) {
    if (this.migrations.has(migration.name)) {
      throw new Error(`Migration ${migration.name} is already registered`);
    }
    this.migrations.set(migration.name, migration);
  }

  getMigration(name: string): Migration | undefined {
    return this.migrations.get(name);
  }

  getAllMigrations(): Migration[] {
    return Array.from(this.migrations.values());
  }

  getMigrationNames(): string[] {
    return Array.from(this.migrations.keys());
  }
}
