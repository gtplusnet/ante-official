import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from './student.validator';
import {
  StudentResponse,
  StudentListResponse,
} from '@shared/response/student.response';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { ExcelService } from '@common/services/excel';
import { MulterFile } from '../../../types/multer';
import { StudentImportGateway, ImportResultData } from './student-import.gateway';

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
    private readonly tableHandler: TableHandlerService,
    private readonly excelService: ExcelService,
    private readonly importGateway: StudentImportGateway,
  ) {}

  async create(
    data: CreateStudentDto,
    companyId: number,
  ): Promise<StudentResponse> {
    // Auto-generate student number if not provided
    if (!data.studentNumber) {
      data.studentNumber = await this.generateStudentNumber(companyId);
    }

    // Check if student number already exists for this company
    const existingStudent = await this.prisma.student.findFirst({
      where: {
        studentNumber: data.studentNumber,
        companyId,
      },
    });

    if (existingStudent) {
      throw new BadRequestException('Student number already exists');
    }

    // Validate section exists and belongs to company
    const section = await this.prisma.schoolSection.findFirst({
      where: {
        id: data.sectionId,
        companyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found or inactive');
    }

    // Check if LRN already exists (if provided)
    if (data.lrn) {
      const existingLrn = await this.prisma.student.findFirst({
        where: {
          lrn: data.lrn,
          companyId,
        },
      });

      if (existingLrn) {
        throw new BadRequestException(
          'LRN (Learner Reference Number) already exists',
        );
      }
    }

    // Validate and parse date of birth
    const parsedDate = new Date(data.dateOfBirth);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date format for dateOfBirth');
    }

    // Create student record
    const student = await this.prisma.student.create({
      data: {
        studentNumber: data.studentNumber,
        lrn: data.lrn,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        dateOfBirth: parsedDate,
        gender: data.gender,
        sectionId: data.sectionId,
        profilePhotoId: data.profilePhotoId,
        companyId,
        searchKeyword: this.generateSearchKeyword(
          data.firstName,
          data.lastName,
          data.studentNumber,
        ),
        temporaryGuardianName: data.temporaryGuardianName,
        temporaryGuardianAddress: data.temporaryGuardianAddress,
        temporaryGuardianContactNumber: data.temporaryGuardianContactNumber,
      },
      include: {
        section: {
          include: {
            gradeLevel: true,
          },
        },
        profilePhoto: {
          include: {
            uploadedBy: true,
          },
        },
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    return this.formatStudentResponse(student);
  }

  async update(
    id: string,
    data: UpdateStudentDto,
    companyId: number,
  ): Promise<StudentResponse> {
    // Check if student exists
    const student = await this.prisma.student.findFirst({
      where: { id, companyId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if section exists if updating
    if (data.sectionId) {
      const section = await this.prisma.schoolSection.findFirst({
        where: {
          id: data.sectionId,
          companyId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!section) {
        throw new NotFoundException('Section not found or inactive');
      }
    }

    // Check if student number already exists for this company (excluding current student)
    if (data.studentNumber && data.studentNumber !== student.studentNumber) {
      const existingStudentNumber = await this.prisma.student.findFirst({
        where: {
          studentNumber: data.studentNumber,
          companyId,
          id: { not: id },
        },
      });

      if (existingStudentNumber) {
        throw new BadRequestException('Student number already exists');
      }
    }

    // Check if LRN already exists for this company (excluding current student)
    if (data.lrn && data.lrn !== student.lrn) {
      const existingLrn = await this.prisma.student.findFirst({
        where: {
          lrn: data.lrn,
          companyId,
          id: { not: id },
        },
      });

      if (existingLrn) {
        throw new BadRequestException(
          'LRN (Learner Reference Number) already exists',
        );
      }
    }

    // Validate and parse date of birth if provided
    let dateOfBirth: Date | undefined = undefined;
    if (data.dateOfBirth) {
      const parsedDate = new Date(data.dateOfBirth);
      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestException('Invalid date format for dateOfBirth');
      }
      dateOfBirth = parsedDate;
    }

    // Update student record
    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        studentNumber: data.studentNumber,
        dateOfBirth: dateOfBirth,
        gender: data.gender,
        lrn: data.lrn,
        sectionId: data.sectionId,
        profilePhotoId: data.profilePhotoId,
        isActive: data.isActive,
        searchKeyword: this.generateSearchKeyword(
          data.firstName || student.firstName,
          data.lastName || student.lastName,
          data.studentNumber || student.studentNumber,
        ),
        temporaryGuardianName: data.temporaryGuardianName !== undefined ? data.temporaryGuardianName : student.temporaryGuardianName,
        temporaryGuardianAddress: data.temporaryGuardianAddress !== undefined ? data.temporaryGuardianAddress : student.temporaryGuardianAddress,
        temporaryGuardianContactNumber: data.temporaryGuardianContactNumber !== undefined ? data.temporaryGuardianContactNumber : student.temporaryGuardianContactNumber,
      },
      include: {
        section: {
          include: {
            gradeLevel: true,
          },
        },
        profilePhoto: {
          include: {
            uploadedBy: true,
          },
        },
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    return this.formatStudentResponse(updatedStudent);
  }

  async findOne(id: string, companyId: number): Promise<StudentResponse> {
    const student = await this.prisma.student.findFirst({
      where: { id, companyId },
      include: {
        section: {
          include: {
            gradeLevel: true,
          },
        },
        profilePhoto: {
          include: {
            uploadedBy: true,
          },
        },
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.formatStudentResponse(student);
  }

  async list(companyId: number): Promise<StudentListResponse[]> {
    const students = await this.prisma.student.findMany({
      where: { companyId },
      orderBy: { studentNumber: 'asc' },
    });

    return students.map((student) => ({
      id: student.id,
      studentNumber: student.studentNumber,
      name: `${student.firstName} ${student.lastName}`,
    }));
  }

  async delete(id: string, companyId: number): Promise<void> {
    const student = await this.prisma.student.findFirst({
      where: { id, companyId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Soft delete by marking as deleted
    await this.prisma.student.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async uploadPhoto(
    studentId: string,
    file: MulterFile,
    companyId: number,
  ): Promise<{ photoId: number }> {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, companyId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Here you would normally upload the file to your storage service
    // For now, we'll just return a placeholder
    // const photoId = await this.fileService.upload(file);

    return { photoId: 1 }; // Placeholder
  }

  // Password reset method removed - students no longer have accounts

  async table(
    body: TableBodyDTO,
    query: TableQueryDTO,
    companyId: number,
  ): Promise<any> {
    this.tableHandler.initialize(query, body, 'student');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery['include'] = {
      /* location: {
        include: {
          region: true,
          province: true,
          municipality: true,
          barangay: true,
        },
      }, */
      profilePhoto: true,
      guardians: {
        include: {
          guardian: true,
        },
      },
      section: {
        include: {
          gradeLevel: true,
        },
      },
    };

    tableQuery['where'] = {
      companyId,
      isDeleted: false,
      ...tableQuery.where,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.student,
      query,
      tableQuery,
    );

    const list = baseList.map((student) => this.formatStudentResponse(student));

    return { list, pagination, currentPage };
  }

  async import(file: MulterFile, companyId: number, sessionId: string): Promise<any> {
    // Parse Excel file using centralized Excel service
    const parsedData = await this.excelService.importFromBuffer(file.buffer, {
      sheetIndex: 0,
      headerRow: 1,
      dataStartRow: 2,
      trimValues: true,
      includeEmptyRows: false,
    });

    const data = parsedData.rows;

    const errors: any[] = [];
    const successes: any[] = [];
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Send initial progress
    this.importGateway.sendProgress(sessionId, {
      sessionId,
      current: 0,
      total: data.length,
      percentage: 0,
      status: 'processing',
      message: 'Starting import...',
    });

    // Cache for sections to avoid multiple DB queries
    const sectionCache = new Map<string, any>();
    
    // Cache for grade levels
    const gradeLevelCache = new Map<string, any>();

    // Get all grade levels for this company
    const gradeLevels = await this.prisma.gradeLevel.findMany({
      where: { companyId },
    });
    
    gradeLevels.forEach(gl => {
      // Map various formats to grade levels
      const name = gl.name.toUpperCase();
      gradeLevelCache.set(name, gl);
      // Also map alternative names
      if (name.includes('GRADE')) {
        // Map "GRADE 1" to "Grade 1" format
        gradeLevelCache.set(gl.name, gl);
      }
    });

    // Get current school year
    const currentYear = new Date().getFullYear();
    const schoolYear = `${currentYear}-${currentYear + 1}`;

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNum = i + 2; // Add 2 for header row and 0-index
      const current = i + 1;
      
      try {
        // Clean and validate required fields
        const firstName = String(row.firstName || '').trim();
        const lastName = String(row.lastName || '').trim();
        
        // Send processing update for current student
        this.importGateway.sendProgress(sessionId, {
          sessionId,
          current,
          total: data.length,
          percentage: Math.round((current / data.length) * 100),
          studentName: `${firstName} ${lastName}`,
          status: 'processing',
          message: `Processing ${firstName} ${lastName}...`,
          row: rowNum,
        });
        const middleName = row.middleName ? String(row.middleName).trim() : undefined;
        const gender = String(row.gender || '').trim().toUpperCase();
        const gradeLevel = String(row.gradeLevel || '').trim();
        const sectionName = row.Section ? String(row.Section).trim() : null;
        const adviserName = row.Adviser ? String(row.Adviser).trim() : null;

        // Validate required fields
        if (!firstName) {
          const error = { row: rowNum, studentName: `Row ${rowNum}`, message: 'Missing first name' };
          errors.push(error);
          errorCount++;
          this.importGateway.sendStudentError(sessionId, {
            row: rowNum,
            studentName: `Row ${rowNum}`,
            error: 'Missing first name',
            current,
            total: data.length,
          });
          continue;
        }
        if (!lastName) {
          const error = { row: rowNum, studentName: firstName || `Row ${rowNum}`, message: 'Missing last name' };
          errors.push(error);
          errorCount++;
          this.importGateway.sendStudentError(sessionId, {
            row: rowNum,
            studentName: firstName || `Row ${rowNum}`,
            error: 'Missing last name',
            current,
            total: data.length,
          });
          continue;
        }
        if (!row.dateOfBirth) {
          const error = { row: rowNum, studentName: `${firstName} ${lastName}`, message: 'Missing date of birth' };
          errors.push(error);
          errorCount++;
          this.importGateway.sendStudentError(sessionId, {
            row: rowNum,
            studentName: `${firstName} ${lastName}`,
            error: 'Missing date of birth',
            current,
            total: data.length,
          });
          continue;
        }
        if (!gender || !['MALE', 'FEMALE'].includes(gender)) {
          const error = { row: rowNum, studentName: `${firstName} ${lastName}`, message: 'Invalid gender (must be MALE or FEMALE)' };
          errors.push(error);
          errorCount++;
          this.importGateway.sendStudentError(sessionId, {
            row: rowNum,
            studentName: `${firstName} ${lastName}`,
            error: 'Invalid gender (must be MALE or FEMALE)',
            current,
            total: data.length,
          });
          continue;
        }
        if (!gradeLevel) {
          const error = { row: rowNum, studentName: `${firstName} ${lastName}`, message: 'Missing grade level' };
          errors.push(error);
          errorCount++;
          this.importGateway.sendStudentError(sessionId, {
            row: rowNum,
            studentName: `${firstName} ${lastName}`,
            error: 'Missing grade level',
            current,
            total: data.length,
          });
          continue;
        }

        // Convert Excel date to JavaScript date
        let dateOfBirth: Date;
        if (row.dateOfBirth instanceof Date) {
          // Already a Date object from Excel parsing
          dateOfBirth = row.dateOfBirth;
        } else if (typeof row.dateOfBirth === 'number') {
          // Excel serial date conversion
          dateOfBirth = this.convertExcelDateToJS(row.dateOfBirth);
        } else if (typeof row.dateOfBirth === 'string') {
          dateOfBirth = new Date(row.dateOfBirth);
        } else {
          const error = { row: rowNum, studentName: `${firstName} ${lastName}`, message: 'Invalid date format' };
          errors.push(error);
          errorCount++;
          this.importGateway.sendStudentError(sessionId, {
            row: rowNum,
            studentName: `${firstName} ${lastName}`,
            error: 'Invalid date format',
            current,
            total: data.length,
          });
          continue;
        }

        if (isNaN(dateOfBirth.getTime())) {
          const error = { row: rowNum, studentName: `${firstName} ${lastName}`, message: 'Invalid date of birth' };
          errors.push(error);
          errorCount++;
          this.importGateway.sendStudentError(sessionId, {
            row: rowNum,
            studentName: `${firstName} ${lastName}`,
            error: 'Invalid date of birth',
            current,
            total: data.length,
          });
          continue;
        }

        // Find or map grade level
        let gradeLevelId: number | undefined;
        const normalizedGradeLevel = this.normalizeGradeLevel(gradeLevel);
        const foundGradeLevel = gradeLevelCache.get(normalizedGradeLevel.toUpperCase()) || 
                                gradeLevelCache.get(normalizedGradeLevel);
        
        if (foundGradeLevel) {
          gradeLevelId = foundGradeLevel.id;
        } else {
          // Try to create grade level if it doesn't exist
          try {
            const newGradeLevel = await this.prisma.gradeLevel.create({
              data: {
                code: normalizedGradeLevel.toUpperCase().replace(/\s+/g, '_'),
                name: normalizedGradeLevel,
                educationLevel: this.getEducationLevel(normalizedGradeLevel) as any,
                sequence: this.getGradeLevelOrder(normalizedGradeLevel),
                companyId,
              },
            });
            gradeLevelCache.set(normalizedGradeLevel.toUpperCase(), newGradeLevel);
            gradeLevelId = newGradeLevel.id;
            console.log(`[Import] Created new grade level: ${normalizedGradeLevel} (ID: ${gradeLevelId})`);
          } catch (e) {
            console.error(`[Import] Failed to create grade level '${gradeLevel}':`, e.message);
            
            // Check if it's a unique constraint error (might exist with different casing)
            if (e.code === 'P2002') {
              // Try to find the existing grade level
              const existingGradeLevel = await this.prisma.gradeLevel.findFirst({
                where: {
                  code: normalizedGradeLevel.toUpperCase().replace(/\s+/g, '_'),
                  companyId,
                  isDeleted: false,
                },
              });
              
              if (existingGradeLevel) {
                gradeLevelCache.set(normalizedGradeLevel.toUpperCase(), existingGradeLevel);
                gradeLevelId = existingGradeLevel.id;
                console.log(`[Import] Found existing grade level: ${normalizedGradeLevel} (ID: ${gradeLevelId})`);
              } else {
                const error = { 
                  row: rowNum, 
                  studentName: `${firstName} ${lastName}`, 
                  message: `Failed to create grade level '${gradeLevel}': Already exists` 
                };
                errors.push(error);
                errorCount++;
                this.importGateway.sendStudentError(sessionId, {
                  row: rowNum,
                  studentName: `${firstName} ${lastName}`,
                  error: `Failed to create grade level '${gradeLevel}': Already exists`,
                  current,
                  total: data.length,
                });
                continue;
              }
            } else {
              const error = { 
                row: rowNum, 
                studentName: `${firstName} ${lastName}`, 
                message: `Failed to create grade level '${gradeLevel}': ${e.message || 'Unknown error'}` 
              };
              errors.push(error);
              errorCount++;
              this.importGateway.sendStudentError(sessionId, {
                row: rowNum,
                studentName: `${firstName} ${lastName}`,
                error: `Failed to create grade level '${gradeLevel}': ${e.message || 'Unknown error'}`,
                current,
                total: data.length,
              });
              continue;
            }
          }
        }

        // Find or create section
        let sectionId: string | undefined;
        if (sectionName && gradeLevelId) {
          const sectionKey = `${sectionName}-${gradeLevelId}`;
          
          if (sectionCache.has(sectionKey)) {
            sectionId = sectionCache.get(sectionKey).id;
          } else {
            // Check if section exists
            let section = await this.prisma.schoolSection.findFirst({
              where: {
                name: sectionName,
                gradeLevelId,
                companyId,
                isDeleted: false,
              },
            });

            if (!section) {
              // Create new section
              section = await this.prisma.schoolSection.create({
                data: {
                  name: sectionName,
                  gradeLevelId,
                  adviserName: adviserName || 'TBA',
                  schoolYear,
                  companyId,
                  isActive: true,
                },
              });
            }
            
            sectionCache.set(sectionKey, section);
            sectionId = section.id;
          }
        }

        // Check for existing student by studentNumber or LRN
        let existingStudent = null;
        let studentNumber = row.studentNumber ? String(row.studentNumber).trim() : null;
        const lrn = row.lrn ? String(row.lrn).trim() : null;
        let action: 'created' | 'updated' = 'created';

        // First check by studentNumber if provided in Excel
        if (studentNumber) {
          existingStudent = await this.prisma.student.findFirst({
            where: {
              studentNumber,
              companyId,
              isDeleted: false,
            },
          });
        }

        // If not found by studentNumber, check by LRN if provided
        if (!existingStudent && lrn) {
          existingStudent = await this.prisma.student.findFirst({
            where: {
              lrn,
              companyId,
              isDeleted: false,
            },
          });
        }

        if (existingStudent) {
          // UPDATE existing student
          action = 'updated';
          studentNumber = existingStudent.studentNumber; // Keep existing student number
          
          await this.prisma.student.update({
            where: { id: existingStudent.id },
            data: {
              firstName,
              lastName,
              middleName,
              dateOfBirth,
              gender,
              // Keep existing studentNumber, update LRN if provided
              lrn: lrn || existingStudent.lrn,
              sectionId, // Section assignment enabled for updates
              // Handle guardian fields from Excel columns
              temporaryGuardianName: row['Guardian Full Name'] || existingStudent.temporaryGuardianName,
              temporaryGuardianAddress: row['Guardian Address'] || existingStudent.temporaryGuardianAddress,
              temporaryGuardianContactNumber: row['Guardian Contact Number']
                ? String(row['Guardian Contact Number'])
                : existingStudent.temporaryGuardianContactNumber,
              searchKeyword: this.generateSearchKeyword(firstName, lastName, studentNumber),
              isActive: true, // Reactivate if it was inactive
              updatedAt: new Date(),
            },
          });
          
          updatedCount++;
        } else {
          // CREATE new student
          if (!studentNumber) {
            studentNumber = await this.generateStudentNumber(companyId);
          }
          
          await this.prisma.student.create({
            data: {
              studentNumber,
              lrn: lrn || undefined,
              firstName,
              lastName,
              middleName,
              dateOfBirth,
              gender,
              sectionId, // Section assignment enabled for new students
              // Handle guardian fields from Excel columns
              temporaryGuardianName: row['Guardian Full Name'] || undefined,
              temporaryGuardianAddress: row['Guardian Address'] || undefined,
              temporaryGuardianContactNumber: row['Guardian Contact Number']
                ? String(row['Guardian Contact Number'])
                : undefined,
              companyId,
              searchKeyword: this.generateSearchKeyword(firstName, lastName, studentNumber),
            },
          });
          
          createdCount++;
        }

        // Track success with action type
        const success = {
          row: rowNum,
          studentName: `${firstName} ${lastName}`,
          studentNumber,
          action,
        };
        successes.push(success);
        
        // Send success notification with action type
        this.importGateway.sendStudentSuccess(sessionId, {
          row: rowNum,
          studentName: `${firstName} ${lastName}`,
          studentNumber,
          current,
          total: data.length,
          action,
        });
      } catch (error) {
        const studentName = row.firstName && row.lastName 
          ? `${row.firstName} ${row.lastName}` 
          : `Row ${rowNum}`;
        
        const errorData = {
          row: rowNum,
          studentName,
          message: error.message || 'Failed to import student',
        };
        errors.push(errorData);
        errorCount++;
        
        // Send error notification
        this.importGateway.sendStudentError(sessionId, {
          row: rowNum,
          studentName,
          error: error.message || 'Failed to import student',
          current,
          total: data.length,
        });
      }
    }

    // Send import complete notification
    const successCount = createdCount + updatedCount;
    const result: ImportResultData = {
      sessionId,
      successCount,
      createdCount,
      updatedCount,
      errorCount,
      errors,
      successes,
    };
    
    this.importGateway.sendImportComplete(sessionId, result);

    return { 
      sessionId,
      successCount,
      createdCount,
      updatedCount,
      errorCount,
      errors,
      successes,
    };
  }

  async seed(companyId: number): Promise<{ count: number }> {
    // Get or create default section for seeding
    let defaultSection = await this.prisma.schoolSection.findFirst({
      where: { companyId, isActive: true, isDeleted: false },
    });

    if (!defaultSection) {
      // Create a default section if none exists
      const defaultGradeLevel = await this.prisma.gradeLevel.findFirst({
        where: { companyId },
      });

      if (!defaultGradeLevel) {
        throw new BadRequestException(
          'No grade levels available. Please seed grade levels first.',
        );
      }

      defaultSection = await this.prisma.schoolSection.create({
        data: {
          name: 'Default Section',
          gradeLevelId: defaultGradeLevel.id,
          adviserName: 'TBA',
          schoolYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
          companyId,
        },
      });
    }

    const sampleData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Smith',
        dateOfBirth: '2010-05-15',
        gender: 'Male',
        lrn: '123456789012',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '2009-08-20',
        gender: 'Female',
        lrn: '123456789013',
      },
      {
        firstName: 'Robert',
        lastName: 'Johnson',
        middleName: 'Lee',
        dateOfBirth: '2011-03-10',
        gender: 'MALE',
        lrn: '123456789014',
      },
    ];

    let count = 0;
    for (const data of sampleData) {
      try {
        await this.create(
          {
            ...data,
            sectionId: defaultSection.id,
          },
          companyId,
        );
        count++;
      } catch (error) {
        // Skip if already exists
        console.log(`Skipping student: ${error.message}`);
      }
    }

    return { count };
  }

  private async generateStudentNumber(companyId: number): Promise<string> {
    const year = new Date().getFullYear();
    const lastStudent = await this.prisma.student.findFirst({
      where: {
        companyId,
        studentNumber: {
          startsWith: `${year}-`,
        },
      },
      orderBy: {
        studentNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.studentNumber.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    return `${year}-${nextNumber.toString().padStart(6, '0')}`;
  }

  // Username generation removed - students no longer have accounts

  private async getLocationIdByName(name: string): Promise<string> {
    const location = await this.prisma.location.findFirst({
      where: { name },
    });

    if (!location) {
      throw new BadRequestException(`Location "${name}" not found`);
    }

    return location.id;
  }

  private formatStudentResponse(student: any): StudentResponse {
    let guardian = null;

    // Check if student has guardian relation
    if (student.guardians && student.guardians.length > 0) {
      const studentGuardian = student.guardians[0];
      // Access the nested guardian data properly
      const guardianData = studentGuardian.guardian;
      if (guardianData) {
        guardian = {
          id: guardianData.id,
          name:
            guardianData.firstName && guardianData.lastName
              ? `${guardianData.firstName}${guardianData.middleName ? ' ' + guardianData.middleName.charAt(0) + '.' : ''} ${guardianData.lastName}`
              : null,
          email: guardianData.email || null,
          contactNumber: guardianData.contactNumber || null,
          address: guardianData.address || null,
          relationship: studentGuardian.relationship || null,
        };
      }
    }

    return {
      id: student.id,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      dateOfBirth: this.utility.formatDate(student.dateOfBirth).date,
      gender: student.gender,
      section: student.section ? this.formatSection(student.section) : null,
      lrn: student.lrn,
      profilePhoto: student.profilePhoto
        ? this.formatProfilePhoto(student.profilePhoto)
        : null,
      dateRegistered: this.utility.formatDate(student.dateRegistered).dateTime,
      isActive: student.isActive !== false,
      guardian: guardian,
      temporaryGuardianName: student.temporaryGuardianName,
      temporaryGuardianAddress: student.temporaryGuardianAddress,
      temporaryGuardianContactNumber: student.temporaryGuardianContactNumber,
      createdAt: this.utility.formatDate(student.createdAt).dateTime,
      updatedAt: this.utility.formatDate(student.updatedAt).dateTime,
    };
  }

  private formatSection(section: any) {
    return {
      id: section.id,
      name: section.name,
      gradeLevelId: section.gradeLevelId,
      gradeLevel: section.gradeLevel ? {
        id: section.gradeLevel.id,
        code: section.gradeLevel.code,
        name: section.gradeLevel.name,
        educationLevel: section.gradeLevel.educationLevel,
      } : null,
      adviserName: section.adviserName,
      schoolYear: section.schoolYear,
      capacity: section.capacity,
    };
  }

  private formatProfilePhoto(profilePhoto: any) {
    return {
      id: profilePhoto.id,
      name: profilePhoto.name,
      type: profilePhoto.type,
      url: profilePhoto.url,
      size: profilePhoto.size,
      uploadedBy: profilePhoto.uploadedBy || null,
      fieldName: profilePhoto.fieldName,
      originalName: profilePhoto.originalName,
      encoding: profilePhoto.encoding,
      mimetype: profilePhoto.mimetype,
    };
  }

  private generateSearchKeyword(
    firstName: string,
    lastName: string,
    studentNumber: string,
  ): string {
    return [
      firstName?.toLowerCase() || '',
      lastName?.toLowerCase() || '',
      studentNumber?.toLowerCase() || '',
    ]
      .join(' ')
      .trim();
  }

  // Helper function to convert Excel serial date to JavaScript Date
  private convertExcelDateToJS(serial: number): Date {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(
      date_info.getFullYear(),
      date_info.getMonth(),
      date_info.getDate(),
      hours,
      minutes,
      seconds
    );
  }

  // Generate username from first and last name
  private generateUsername(firstName: string, lastName: string): string {
    // Remove spaces and special characters, convert to lowercase
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Use first name + dot + last name format
    return `${cleanFirst}.${cleanLast}`;
  }

  // Normalize grade level names
  private normalizeGradeLevel(gradeLevel: string): string {
    const upper = gradeLevel.toUpperCase();
    
    // Map common variations
    if (upper === 'NURSERY' || upper === 'N') return 'Nursery';
    if (upper === 'KINDERGARTEN' || upper === 'KINDER' || upper === 'K') return 'Kindergarten';
    if (upper === 'PREPARATORY' || upper === 'PREP') return 'Preparatory';
    
    // Handle Grade 1-12 formats
    const gradeMatch = upper.match(/(?:GRADE\s*)?(\d+)/);
    if (gradeMatch) {
      const gradeNum = parseInt(gradeMatch[1]);
      if (gradeNum >= 1 && gradeNum <= 12) {
        return `Grade ${gradeNum}`;
      }
    }
    
    // Return as-is if no match
    return gradeLevel;
  }

  // Get education level based on grade
  private getEducationLevel(gradeLevel: string): string {
    const upper = gradeLevel.toUpperCase();

    // Map to valid EducationLevel enum values
    if (upper.includes('NURSERY')) return 'NURSERY';
    if (upper.includes('KINDERGARTEN') || upper.includes('KINDER')) return 'KINDERGARTEN';
    if (upper.includes('PREP') || upper.includes('PREPARATORY')) return 'KINDERGARTEN'; // Map Prep to Kindergarten

    // Check for college-specific patterns
    if (upper.includes('COLLEGE') || upper.includes('UNIVERSITY')) return 'COLLEGE';
    if (upper.includes('BACHELOR') || upper.includes(' BS ') || upper.includes(' BA ') || upper.includes(' BSBA ')) return 'COLLEGE';
    if (upper.includes('FIRST YEAR') || upper.includes('1ST YEAR')) return 'COLLEGE';
    if (upper.includes('SECOND YEAR') || upper.includes('2ND YEAR')) return 'COLLEGE';
    if (upper.includes('THIRD YEAR') || upper.includes('3RD YEAR')) return 'COLLEGE';
    if (upper.includes('FOURTH YEAR') || upper.includes('4TH YEAR')) return 'COLLEGE';
    if (upper.includes('FIFTH YEAR') || upper.includes('5TH YEAR')) return 'COLLEGE';

    const gradeMatch = upper.match(/\d+/);
    if (gradeMatch) {
      const gradeNum = parseInt(gradeMatch[0]);
      if (gradeNum >= 1 && gradeNum <= 6) return 'ELEMENTARY';
      if (gradeNum >= 7 && gradeNum <= 10) return 'JUNIOR_HIGH';
      if (gradeNum >= 11 && gradeNum <= 12) return 'SENIOR_HIGH';
    }

    // If it contains "YEAR" but didn't match above patterns, likely college
    if (upper.includes('YEAR') && !upper.includes('GRADE')) return 'COLLEGE';

    return 'ELEMENTARY'; // Default
  }

  // Get grade level order for sorting
  private getGradeLevelOrder(gradeLevel: string): number {
    const upper = gradeLevel.toUpperCase();

    if (upper.includes('NURSERY')) return 1;
    if (upper.includes('KINDERGARTEN')) return 2;
    if (upper.includes('PREP')) return 3;

    // Handle college year patterns
    if (upper.includes('FIRST YEAR') || upper.includes('1ST YEAR')) return 16;
    if (upper.includes('SECOND YEAR') || upper.includes('2ND YEAR')) return 17;
    if (upper.includes('THIRD YEAR') || upper.includes('3RD YEAR')) return 18;
    if (upper.includes('FOURTH YEAR') || upper.includes('4TH YEAR')) return 19;
    if (upper.includes('FIFTH YEAR') || upper.includes('5TH YEAR')) return 20;

    const gradeMatch = upper.match(/\d+/);
    if (gradeMatch) {
      const gradeNum = parseInt(gradeMatch[0]);
      return 3 + gradeNum; // Start after preschool levels
    }

    return 99; // Put unknown at the end
  }

  async export(companyId: number): Promise<Buffer> {
    // Fetch all students with their related data
    const students = await this.prisma.student.findMany({
      where: {
        companyId,
        isDeleted: false,
      },
      include: {
        section: {
          include: {
            gradeLevel: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    // Format data for Excel export matching import structure
    const excelData = students.map(student => {
      // Format date of birth as YYYY-MM-DD
      const dateOfBirth = student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split('T')[0]
        : '';

      return {
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        middleName: student.middleName || '',
        studentNumber: student.studentNumber || '',
        dateOfBirth: dateOfBirth,
        gender: student.gender || '',
        lrn: student.lrn || '',
        gradeLevel: student.section?.gradeLevel?.name || '',
        Section: student.section?.name || '',
        Adviser: student.section?.adviserName || '',
        'Guardian Full Name': student.temporaryGuardianName || '',
        'Guardian Address': student.temporaryGuardianAddress || '',
        'Guardian Contact Number': student.temporaryGuardianContactNumber || '',
      };
    });

    // Create workbook and worksheet
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate Excel buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return buffer;
  }
}
