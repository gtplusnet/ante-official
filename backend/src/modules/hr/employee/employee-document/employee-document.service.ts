import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { FileUploadService } from '@infrastructure/file-upload/file-upload/file-upload.service';
import {
  EmployeeDocumentUploadDTO,
  EmployeeDocumentUpdateDTO,
  EmployeeDocumentListDTO,
} from './employee-document.interface';
import {
  EmployeeDocument,
  EmployeeDocumentCategory,
  Prisma,
} from '@prisma/client';
import { MulterFile } from '../../../../types/multer';
import employeeDocumentTypes, {
  getDocumentTypesByCategory,
} from '../../../../reference/employee-document-types.reference';

export interface EmployeeDocumentResponse {
  id: number;
  accountId: string;
  fileId: number;
  category: EmployeeDocumentCategory;
  documentType: string;
  description: string | null;
  expiryDate: any;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  file: {
    id: number;
    name: string;
    url: string;
    size: number;
    mimetype: string;
    originalName: string;
  };
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

@Injectable()
export class EmployeeDocumentService {
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;
  @Inject() private fileUploadService: FileUploadService;

  async uploadDocument(
    file: MulterFile,
    params: EmployeeDocumentUploadDTO,
  ): Promise<EmployeeDocumentResponse> {
    // Validate file
    if (!file) {
      throw new BadRequestException('File not found.');
    }

    // Validate document type
    const validTypes = getDocumentTypesByCategory(params.category);
    if (
      !validTypes.includes(params.documentType) &&
      params.documentType !== 'Other'
    ) {
      throw new BadRequestException(
        'Invalid document type for the selected category.',
      );
    }

    // Check if employee exists
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId: params.accountId },
      include: { account: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found.');
    }

    // Verify employee belongs to the company
    if (employee.account.companyId !== this.utilityService.companyId) {
      throw new BadRequestException('Employee not found in this company.');
    }

    // Upload file using FileUploadService
    const uploadedFile = await this.fileUploadService.uploadDocument(file, {
      projectId: null,
      taskId: null,
    });

    // Create employee document record
    const employeeDocument = await this.prisma.employeeDocument.create({
      data: {
        accountId: params.accountId,
        fileId: uploadedFile.id,
        category: params.category,
        documentType: params.documentType,
        description: params.description || null,
        expiryDate: params.expiryDate ? new Date(params.expiryDate) : null,
      },
      include: {
        file: true,
      },
    });

    return this.formatResponse(employeeDocument);
  }

  async getDocuments(
    params: EmployeeDocumentListDTO,
  ): Promise<EmployeeDocumentResponse[]> {
    const where: Prisma.EmployeeDocumentWhereInput = {
      accountId: params.accountId,
    };

    if (params.category) {
      where.category = params.category;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true';
    }

    const documents = await this.prisma.employeeDocument.findMany({
      where,
      include: {
        file: true,
      },
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
    });

    return documents.map((doc) => this.formatResponse(doc));
  }

  async updateDocument(
    id: number,
    params: EmployeeDocumentUpdateDTO,
  ): Promise<EmployeeDocumentResponse> {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id },
      include: { employee: { include: { account: true } } },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    // Verify document belongs to company
    if (document.employee.account.companyId !== this.utilityService.companyId) {
      throw new BadRequestException('Document not found in this company.');
    }

    // Validate document type if category is being changed
    if (params.category && params.documentType) {
      const validTypes = getDocumentTypesByCategory(params.category);
      if (
        !validTypes.includes(params.documentType) &&
        params.documentType !== 'Other'
      ) {
        throw new BadRequestException(
          'Invalid document type for the selected category.',
        );
      }
    }

    const updatedDocument = await this.prisma.employeeDocument.update({
      where: { id },
      data: {
        documentType: params.documentType,
        description: params.description,
        category: params.category,
        expiryDate: params.expiryDate ? new Date(params.expiryDate) : undefined,
      },
      include: {
        file: true,
      },
    });

    return this.formatResponse(updatedDocument);
  }

  async deleteDocument(id: number): Promise<{ message: string }> {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id },
      include: { employee: { include: { account: true } } },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    // Verify document belongs to company
    if (document.employee.account.companyId !== this.utilityService.companyId) {
      throw new BadRequestException('Document not found in this company.');
    }

    // Mark as inactive instead of hard delete
    await this.prisma.employeeDocument.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Document deleted successfully.' };
  }

  async getDocumentTypes(): Promise<any> {
    return employeeDocumentTypes;
  }

  async getDocumentsByCategory(
    accountId: string,
    category: EmployeeDocumentCategory,
  ): Promise<EmployeeDocumentResponse[]> {
    const documents = await this.prisma.employeeDocument.findMany({
      where: {
        accountId,
        category,
        isActive: true,
      },
      include: {
        file: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents.map((doc) => this.formatResponse(doc));
  }

  private formatResponse(
    document: EmployeeDocument & { file: any },
  ): EmployeeDocumentResponse {
    const now = new Date();
    const expiryDate = document.expiryDate
      ? new Date(document.expiryDate)
      : null;
    const isExpired = expiryDate ? expiryDate < now : false;
    const daysUntilExpiry = expiryDate
      ? Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      id: document.id,
      accountId: document.accountId,
      fileId: document.fileId,
      category: document.category,
      documentType: document.documentType,
      description: document.description,
      expiryDate: document.expiryDate
        ? this.utilityService.formatDate(document.expiryDate)
        : null,
      isActive: document.isActive,
      createdAt: this.utilityService.formatDate(document.createdAt),
      updatedAt: this.utilityService.formatDate(document.updatedAt),
      file: {
        id: document.file.id,
        name: document.file.name,
        url: document.file.url,
        size: document.file.size,
        mimetype: document.file.mimetype,
        originalName: document.file.originalName,
      },
      isExpired,
      daysUntilExpiry:
        !isExpired && daysUntilExpiry !== null ? daysUntilExpiry : null,
    };
  }
}
