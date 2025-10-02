import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createLocation = async () => {
  let location = await prisma.location.findFirst({
    where: { name: 'Main location' },
  });

  if (!location) {
    location = await prisma.location.create({
      data: {
        name: 'Default location',
        line1: '-',
        region: '-',
        city: '-',
        brgy: '-',
        zipCode: '-',
        landmark: '-',
        description: '-',
      },
    });
  }
};


