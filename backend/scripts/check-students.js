const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudents() {
  try {
    console.log('Checking students with test studentNumbers and LRNs...\n');
    
    // Check for students with our test data
    const testStudentNumbers = ['STU-001', 'STU-002', 'STU-003', 'STU-004', 'STU-005'];
    const testLRNs = ['123456789001', '123456789002', '123456789003', '123456789004', '123456789005'];
    
    console.log('Checking by Student Numbers:');
    for (const studentNumber of testStudentNumbers) {
      const student = await prisma.student.findFirst({
        where: {
          studentNumber,
          companyId: 16,
          isDeleted: false,
        },
        select: {
          id: true,
          studentNumber: true,
          lrn: true,
          firstName: true,
          lastName: true,
          middleName: true,
        }
      });
      
      if (student) {
        console.log(`✓ ${studentNumber}: ${student.firstName} ${student.lastName} (LRN: ${student.lrn || 'none'})`);
      } else {
        console.log(`✗ ${studentNumber}: Not found`);
      }
    }
    
    console.log('\nChecking by LRNs:');
    for (const lrn of testLRNs) {
      const student = await prisma.student.findFirst({
        where: {
          lrn,
          companyId: 16,
          isDeleted: false,
        },
        select: {
          id: true,
          studentNumber: true,
          lrn: true,
          firstName: true,
          lastName: true,
          middleName: true,
        }
      });
      
      if (student) {
        console.log(`✓ ${lrn}: ${student.firstName} ${student.lastName} (Student #: ${student.studentNumber})`);
      } else {
        console.log(`✗ ${lrn}: Not found`);
      }
    }
    
    // Get all students for company 16 created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentStudents = await prisma.student.findMany({
      where: {
        companyId: 16,
        createdAt: {
          gte: today,
        },
        isDeleted: false,
      },
      select: {
        id: true,
        studentNumber: true,
        lrn: true,
        firstName: true,
        lastName: true,
        middleName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`\nRecent students created today (${recentStudents.length} total):`);
    recentStudents.forEach(s => {
      const created = new Date(s.createdAt).toLocaleTimeString();
      const updated = new Date(s.updatedAt).toLocaleTimeString();
      console.log(`- ${s.studentNumber}: ${s.firstName} ${s.lastName} (LRN: ${s.lrn || 'none'}) - Created: ${created}, Updated: ${updated}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();