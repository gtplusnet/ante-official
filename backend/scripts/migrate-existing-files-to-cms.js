#!/usr/bin/env node

/**
 * Migration Script: Set existing files to CMS module
 * 
 * This script updates all existing files in the database that have a null/undefined
 * module field to use the 'CMS' module. This ensures backward compatibility
 * for files uploaded before the module system was implemented.
 * 
 * Usage: node scripts/migrate-existing-files-to-cms.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExistingFiles() {
  try {
    console.log('🚀 Starting migration: Setting existing files to CMS module...');

    // Get count of files without module set
    const filesWithoutModule = await prisma.files.count({
      where: {
        OR: [
          { module: null },
          { module: undefined }
        ]
      }
    });

    console.log(`📊 Found ${filesWithoutModule} files without module assignment`);

    if (filesWithoutModule === 0) {
      console.log('✅ No files to migrate. All files already have module assignments.');
      return;
    }

    // Update files without module to CMS
    const updateResult = await prisma.files.updateMany({
      where: {
        OR: [
          { module: null },
          { module: undefined }
        ]
      },
      data: {
        module: 'CMS'
      }
    });

    console.log(`✅ Successfully migrated ${updateResult.count} files to CMS module`);

    // Verify the migration
    const remainingFiles = await prisma.files.count({
      where: {
        OR: [
          { module: null },
          { module: undefined }
        ]
      }
    });

    if (remainingFiles === 0) {
      console.log('✅ Migration verification successful: All files now have module assignments');
    } else {
      console.warn(`⚠️  Warning: ${remainingFiles} files still without module assignment`);
    }

    // Show module distribution after migration
    const moduleStats = await prisma.files.groupBy({
      by: ['module'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    console.log('\n📈 Files by module after migration:');
    moduleStats.forEach(stat => {
      console.log(`  ${stat.module}: ${stat._count.id} files`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateExistingFiles()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateExistingFiles };