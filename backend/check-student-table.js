const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudentTable() {
  try {
    // Get the raw database schema information
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Student'
      ORDER BY ordinal_position;
    `;
    
    console.log('Student table columns:');
    console.log(result);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentTable();