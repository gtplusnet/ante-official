import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';
import { UtilityService } from '@common/utility.service';
import { FileUploadParamsDTO } from './file-upload.validator.dto';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { Response } from 'express';
import { MulterFile } from '../../../types/multer';

describe('FileUploadController', () => {
  let controller: FileUploadController;
  let fileUploadService: FileUploadService;
  let utilityService: UtilityService;
  let mockResponse: Partial<Response>;

  const mockFileUploadService = {
    uploadDocument: jest.fn(),
    getTable: jest.fn(),
    getFileInformation: jest.fn(),
  };

  const mockUtilityService = {
    responseHandler: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileUploadController],
      providers: [
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    controller = module.get<FileUploadController>(FileUploadController);
    fileUploadService = module.get<FileUploadService>(FileUploadService);
    utilityService = module.get<UtilityService>(UtilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have utility service injected', () => {
    expect(controller.utility).toBeDefined();
    expect(controller.utility).toBe(utilityService);
  });

  it('should have file upload service injected', () => {
    expect(controller.fileUploadService).toBeDefined();
    expect(controller.fileUploadService).toBe(fileUploadService);
  });

  describe('uploadDocument', () => {
    it('should handle document upload successfully', async () => {
      const mockFile: MulterFile = {
        fieldname: 'fileData',
        originalname: 'test-document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const params: FileUploadParamsDTO = {
        projectId: 1,
        taskId: 2,
      };

      const mockUploadResult = Promise.resolve({
        success: true,
        fileId: 123,
        message: 'File uploaded successfully',
      });

      mockFileUploadService.uploadDocument.mockReturnValue(mockUploadResult);

      await controller.uploadDocument(mockResponse, mockFile, params);

      expect(mockFileUploadService.uploadDocument).toHaveBeenCalledWith(
        mockFile,
        params,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockUploadResult,
        mockResponse,
      );
    });

    it('should handle document upload without optional parameters', async () => {
      const mockFile: MulterFile = {
        fieldname: 'fileData',
        originalname: 'test-document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const params: FileUploadParamsDTO = {};

      const mockUploadResult = Promise.resolve({
        success: true,
        fileId: 124,
        message: 'File uploaded successfully',
      });

      mockFileUploadService.uploadDocument.mockReturnValue(mockUploadResult);

      await controller.uploadDocument(mockResponse, mockFile, params);

      expect(mockFileUploadService.uploadDocument).toHaveBeenCalledWith(
        mockFile,
        params,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockUploadResult,
        mockResponse,
      );
    });

    it('should handle document upload with only projectId', async () => {
      const mockFile: MulterFile = {
        fieldname: 'fileData',
        originalname: 'project-file.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image content'),
        size: 2048,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const params: FileUploadParamsDTO = {
        projectId: 5,
      };

      const mockUploadResult = Promise.resolve({
        success: true,
        fileId: 125,
        message: 'Image uploaded successfully',
      });

      mockFileUploadService.uploadDocument.mockReturnValue(mockUploadResult);

      await controller.uploadDocument(mockResponse, mockFile, params);

      expect(mockFileUploadService.uploadDocument).toHaveBeenCalledWith(
        mockFile,
        params,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockUploadResult,
        mockResponse,
      );
    });

    it('should handle document upload with only taskId', async () => {
      const mockFile: MulterFile = {
        fieldname: 'fileData',
        originalname: 'task-file.docx',
        encoding: '7bit',
        mimetype:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: Buffer.from('document content'),
        size: 3072,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const params: FileUploadParamsDTO = {
        taskId: 10,
      };

      const mockUploadResult = Promise.resolve({
        success: true,
        fileId: 126,
        message: 'Document uploaded successfully',
      });

      mockFileUploadService.uploadDocument.mockReturnValue(mockUploadResult);

      await controller.uploadDocument(mockResponse, mockFile, params);

      expect(mockFileUploadService.uploadDocument).toHaveBeenCalledWith(
        mockFile,
        params,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockUploadResult,
        mockResponse,
      );
    });
  });

  describe('table', () => {
    it('should handle table request successfully', async () => {
      const query: TableQueryDTO = {
        page: 1,
        perPage: 10,
      };

      const body: TableBodyDTO = {
        filters: [],
        settings: {},
      };

      const mockTableResult = Promise.resolve({
        data: [
          { id: 1, filename: 'file1.pdf', size: 1024 },
          { id: 2, filename: 'file2.jpg', size: 2048 },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 10,
      });

      mockFileUploadService.getTable.mockReturnValue(mockTableResult);

      await controller.table(query, body, mockResponse as Response);

      expect(mockFileUploadService.getTable).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableResult,
        mockResponse,
      );
    });

    it('should handle table request with filters', async () => {
      const query: TableQueryDTO = {
        page: 2,
        perPage: 20,
      };

      const body: TableBodyDTO = {
        filters: [{ projectId: 1, fileType: 'pdf' }],
        settings: {},
        searchKeyword: 'document',
      };

      const mockTableResult = Promise.resolve({
        data: [{ id: 3, filename: 'document1.pdf', size: 1536 }],
        totalCount: 1,
        page: 2,
        pageSize: 20,
      });

      mockFileUploadService.getTable.mockReturnValue(mockTableResult);

      await controller.table(query, body, mockResponse as Response);

      expect(mockFileUploadService.getTable).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableResult,
        mockResponse,
      );
    });

    it('should handle empty table request', async () => {
      const query: TableQueryDTO = {
        page: 1,
        perPage: 10,
      };

      const body: TableBodyDTO = {
        filters: [],
        settings: {},
      };

      const mockTableResult = Promise.resolve({
        data: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
      });

      mockFileUploadService.getTable.mockReturnValue(mockTableResult);

      await controller.table(query, body, mockResponse as Response);

      expect(mockFileUploadService.getTable).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableResult,
        mockResponse,
      );
    });
  });

  describe('getFileInfo', () => {
    it('should get file information successfully', async () => {
      const fileId = 123;
      const mockFileInfo = Promise.resolve({
        id: fileId,
        filename: 'test-file.pdf',
        originalName: 'Original Test File.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        uploadedAt: '2023-01-01T00:00:00Z',
        projectId: 1,
        taskId: 2,
      });

      mockFileUploadService.getFileInformation.mockReturnValue(mockFileInfo);

      await controller.getFileInfo(fileId, mockResponse as Response);

      expect(mockFileUploadService.getFileInformation).toHaveBeenCalledWith(
        fileId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockFileInfo,
        mockResponse,
      );
    });

    it('should handle string id conversion to number', async () => {
      const fileId = '456'; // String ID
      const expectedFileId = 456; // Expected number conversion

      const mockFileInfo = Promise.resolve({
        id: expectedFileId,
        filename: 'another-file.jpg',
        originalName: 'Another File.jpg',
        size: 2048,
        mimetype: 'image/jpeg',
        uploadedAt: '2023-01-02T00:00:00Z',
      });

      mockFileUploadService.getFileInformation.mockReturnValue(mockFileInfo);

      await controller.getFileInfo(fileId as any, mockResponse as Response);

      expect(mockFileUploadService.getFileInformation).toHaveBeenCalledWith(
        expectedFileId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockFileInfo,
        mockResponse,
      );
    });

    it('should handle zero file id', async () => {
      const fileId = 0;
      const mockFileInfo = Promise.resolve(null);

      mockFileUploadService.getFileInformation.mockReturnValue(mockFileInfo);

      await controller.getFileInfo(fileId, mockResponse as Response);

      expect(mockFileUploadService.getFileInformation).toHaveBeenCalledWith(
        fileId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockFileInfo,
        mockResponse,
      );
    });

    it('should handle negative file id', async () => {
      const fileId = -1;
      const expectedFileId = -1;

      const mockFileInfo = Promise.resolve(null);

      mockFileUploadService.getFileInformation.mockReturnValue(mockFileInfo);

      await controller.getFileInfo(fileId, mockResponse as Response);

      expect(mockFileUploadService.getFileInformation).toHaveBeenCalledWith(
        expectedFileId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockFileInfo,
        mockResponse,
      );
    });
  });

  describe('error handling', () => {
    it('should handle service errors in uploadDocument', async () => {
      const mockFile: MulterFile = {
        fieldname: 'fileData',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('content'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const params: FileUploadParamsDTO = { projectId: 1 };
      const mockError = Promise.reject(new Error('Upload failed'));
      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      mockFileUploadService.uploadDocument.mockReturnValue(mockError);

      await controller.uploadDocument(mockResponse, mockFile, params);

      expect(mockFileUploadService.uploadDocument).toHaveBeenCalledWith(
        mockFile,
        params,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in table', async () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = { filters: [], settings: {} };
      const mockError = Promise.reject(new Error('Table fetch failed'));
      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      mockFileUploadService.getTable.mockReturnValue(mockError);

      await controller.table(query, body, mockResponse as Response);

      expect(mockFileUploadService.getTable).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in getFileInfo', async () => {
      const fileId = 123;
      const mockError = Promise.reject(new Error('File not found'));
      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      mockFileUploadService.getFileInformation.mockReturnValue(mockError);

      await controller.getFileInfo(fileId, mockResponse as Response);

      expect(mockFileUploadService.getFileInformation).toHaveBeenCalledWith(
        fileId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });
  });
});
