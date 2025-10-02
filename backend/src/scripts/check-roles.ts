import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndCreateStudentRole() {
  try {
    // Get company ID (using Rona Company)
    const companyId = 16;
    
    // Check existing roles
    const roles = await prisma.role.findMany({
      where: {
        companyId: companyId,
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        description: true,
        companyId: true,
        isDeleted: true
      }
    });
    
    console.log('Existing roles for company', companyId + ':');
    roles.forEach(role => {
      console.log(`- ${role.name} (ID: ${role.id}, Deleted: ${role.isDeleted})`);
    });
    
    // Check if student role exists
    const studentRole = roles.find(r => 
      r.name.toLowerCase().includes('student')
    );
    
    if (studentRole) {
      console.log('\n✅ Student role found:', studentRole.name);
      
      // Ensure it's not deleted
      if (studentRole.isDeleted) {
        await prisma.role.update({
          where: { id: studentRole.id },
          data: { isDeleted: false }
        });
        console.log('✅ Student role restored');
      }
    } else {
      console.log('\n❌ No student role found');
      console.log('Creating Student role...');
      
      // Create student role
      const newRole = await prisma.role.create({
        data: {
          name: 'Student',
          description: 'Student role for school management system',
          companyId: companyId,
          isDeleted: false
        }
      });
      
      console.log('✅ Student role created successfully!');
      console.log('Role details:', {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateStudentRole();