import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function createTestDevice() {
  try {
    console.log('Creating test manpower device...');

    // Find the first company (assuming test company exists)
    const company = await prisma.company.findFirst({
      where: { isActive: true },
    });

    if (!company) {
      throw new Error('No active company found. Please create a company first.');
    }

    console.log(`Using company: ${company.companyName} (ID: ${company.id})`);

    // Generate unique device ID and API key
    const deviceId = `DEV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const apiKey = `ante_device_${crypto.randomBytes(32).toString('hex')}`;

    // Check if a test device already exists
    const existingDevice = await prisma.manpowerDevice.findFirst({
      where: {
        name: 'Test Device',
        companyId: company.id,
      },
    });

    if (existingDevice) {
      console.log('Test device already exists. Updating...');

      const updatedDevice = await prisma.manpowerDevice.update({
        where: { id: existingDevice.id },
        data: {
          apiKey,
          isActive: true,
          lastActivityAt: null,
        },
      });

      console.log('\n✅ Test device updated successfully!');
      console.log('=====================================');
      console.log(`Device ID: ${updatedDevice.deviceId}`);
      console.log(`API Key: ${apiKey}`);
      console.log(`Company: ${company.companyName}`);
      console.log('=====================================\n');

      return { device: updatedDevice, apiKey, company };
    }

    // Create new test device
    const device = await prisma.manpowerDevice.create({
      data: {
        deviceId,
        name: 'Test Device',
        location: 'Test Location',
        companyId: company.id,
        apiKey,
        isActive: true,
      },
    });

    console.log('\n✅ Test device created successfully!');
    console.log('=====================================');
    console.log(`Device ID: ${device.deviceId}`);
    console.log(`API Key: ${apiKey}`);
    console.log(`Company: ${company.companyName}`);
    console.log('=====================================\n');

    // Find some test employees
    const employees = await prisma.account.findMany({
      where: {
        companyId: company.id,
      },
      take: 3,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    });

    if (employees.length > 0) {
      console.log('Test Employees:');
      employees.forEach(emp => {
        console.log(`  - ID: ${emp.id}, Name: ${emp.firstName} ${emp.lastName}, Code: ${emp.username}`);
      });
    } else {
      console.log('No employees found. Please create some employees for testing.');
    }

    return { device, apiKey, company, employees };
  } catch (error) {
    console.error('Error creating test device:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestDevice()
  .then(result => {
    console.log('\n📝 Save the API key above for testing!');
    console.log('You can use it to test the manpower API endpoints.\n');
  })
  .catch(error => {
    console.error('Failed to create test device:', error);
    process.exit(1);
  });