import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignDefaultRoleGroups() {
  try {
    console.log('🔍 Checking for roles without role groups...');

    // Find all roles without a roleGroupId
    const rolesWithoutGroup = await prisma.role.findMany({
      where: { roleGroupId: null },
      select: {
        id: true,
        name: true,
        isDeveloper: true,
        companyId: true
      }
    });

    if (rolesWithoutGroup.length === 0) {
      console.log('✅ All roles already have role groups assigned');
      return;
    }

    console.log(`Found ${rolesWithoutGroup.length} roles without role groups:`);
    rolesWithoutGroup.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role.id}, Company: ${role.companyId || 'No company'})`);
    });

    // Get or create Administrator group
    let adminGroup = await prisma.roleGroup.findFirst({
      where: { name: 'Administrator' }
    });

    if (!adminGroup) {
      console.log('\n📁 Creating Administrator role group...');
      adminGroup = await prisma.roleGroup.create({
        data: {
          name: 'Administrator',
          description: 'System administrator role group',
          isDeleted: false
        }
      });
      console.log('✅ Administrator role group created');
    } else {
      console.log('\n✅ Administrator role group already exists');
    }

    // Update all roles without groups
    console.log('\n🔄 Assigning roles to Administrator group...');
    const updateResult = await prisma.role.updateMany({
      where: { roleGroupId: null },
      data: { roleGroupId: adminGroup.id }
    });

    console.log(`✅ Successfully assigned ${updateResult.count} roles to Administrator group`);

    // Verify the update
    const remainingWithoutGroup = await prisma.role.count({
      where: { roleGroupId: null }
    });

    if (remainingWithoutGroup === 0) {
      console.log('✅ Verification complete: All roles now have role groups');
    } else {
      console.log(`⚠️  Warning: ${remainingWithoutGroup} roles still without role groups`);
    }

  } catch (error) {
    console.error('❌ Error assigning default role groups:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
assignDefaultRoleGroups()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });