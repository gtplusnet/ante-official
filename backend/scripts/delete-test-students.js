const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteTestStudents() {
  try {
    console.log('Deleting test students...\n');
    
    // Delete students with test LRNs
    const testLRNs = ['123456789001', '123456789002', '123456789003', '123456789004', '123456789005'];
    
    const result = await prisma.student.deleteMany({
      where: {
        lrn: {
          in: testLRNs
        },
        companyId: 16
      }
    });
    
    console.log(`✅ Deleted ${result.count} test students with LRNs`);
    
    // Also delete any students with test names from today (in case of duplicates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const testNames = [
      { firstName: 'JUAN', lastName: 'DELA CRUZ' },
      { firstName: 'MARIA', lastName: 'SANTOS' },
      { firstName: 'MARIA UPDATED', lastName: 'SANTOS' },
      { firstName: 'PEDRO', lastName: 'REYES' },
      { firstName: 'ANNA', lastName: 'GARCIA' },
      { firstName: 'CARLOS', lastName: 'MENDOZA' }
    ];
    
    for (const name of testNames) {
      const deleted = await prisma.student.deleteMany({
        where: {
          firstName: name.firstName,
          lastName: name.lastName,
          companyId: 16,
          createdAt: {
            gte: today
          }
        }
      });
      
      if (deleted.count > 0) {
        console.log(`  Deleted ${deleted.count} student(s) named ${name.firstName} ${name.lastName}`);
      }
    }
    
    console.log('\n✅ Test data cleanup complete');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestStudents();