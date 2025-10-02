import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  ConnectStudentDto,
  DisconnectStudentDto,
} from './guardian-students.dto';

@Injectable()
export class GuardianStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async connectStudent(guardianId: string, dto: ConnectStudentDto) {
    // Extract student ID from QR code
    const studentId = dto.qrCode.replace('student:', '');

    // Get guardian to check company
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      select: { companyId: true },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Check if student exists and belongs to same company
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        companyId: guardian.companyId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        studentNumber: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found or inactive');
    }

    // Check if connection already exists
    const existingConnection = await this.prisma.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: student.id,
          guardianId: guardianId,
        },
      },
    });

    if (existingConnection) {
      throw new ConflictException(
        'Student is already connected to this guardian',
      );
    }

    // Create the connection
    await this.prisma.studentGuardian.create({
      data: {
        studentId: student.id,
        guardianId: guardianId,
        relationship: dto.relationship,
        isPrimary: false, // Can be updated later by admin
      },
    });

    // Return updated guardian with all students
    return this.getGuardianWithStudents(guardianId);
  }

  async disconnectStudent(guardianId: string, dto: DisconnectStudentDto) {
    // Check if connection exists
    const connection = await this.prisma.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: dto.studentId,
          guardianId: guardianId,
        },
      },
    });

    if (!connection) {
      throw new NotFoundException('Student connection not found');
    }

    // Delete the connection
    await this.prisma.studentGuardian.delete({
      where: {
        id: connection.id,
      },
    });

    // Return updated guardian with remaining students
    return this.getGuardianWithStudents(guardianId);
  }

  async getConnectedStudents(guardianId: string) {
    return this.getGuardianWithStudents(guardianId);
  }

  async verifyStudent(guardianId: string, studentId: string) {
    // Get guardian to check company
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      select: { companyId: true },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Check if student exists and belongs to same company
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        companyId: guardian.companyId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        studentNumber: true,
        gender: true,
        dateOfBirth: true,
        profilePhoto: {
          select: {
            url: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(
        'Student not found or not active in your institution',
      );
    }

    // Check if already connected
    const existingConnection = await this.prisma.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: student.id,
          guardianId: guardianId,
        },
      },
    });

    return {
      student: {
        ...student,
        profilePhotoUrl: student.profilePhoto?.url || null,
      },
      isAlreadyConnected: !!existingConnection,
    };
  }

  private async getGuardianWithStudents(guardianId: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
                middleName: true,
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return {
      guardian: {
        id: guardian.id,
        email: guardian.email,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        middleName: guardian.middleName,
        contactNumber: guardian.contactNumber,
        alternateNumber: guardian.alternateNumber,
        address: guardian.address,
        occupation: guardian.occupation,
        lastLogin: guardian.lastLogin,
        students: guardian.students.map((sg) => ({
          id: sg.student.id,
          studentNumber: sg.student.studentNumber,
          firstName: sg.student.firstName,
          lastName: sg.student.lastName,
          middleName: sg.student.middleName,
          relationship: sg.relationship,
          isPrimary: sg.isPrimary,
        })),
      },
      company: {
        id: guardian.company.id,
        name: guardian.company.companyName,
      },
    };
  }
}
