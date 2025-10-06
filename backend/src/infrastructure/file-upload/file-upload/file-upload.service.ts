import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { PrismaService } from '@common/prisma.service';
import { FileUploadParamsDTO } from './file-upload.validator.dto';
import {
  Prisma,
  FileType,
  Files,
  ProcessingStatus,
  ModuleType,
} from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { AccountService } from '@modules/account/account/account.service';
import { FileDataResponse } from '../../../shared/response/file.response';
import { MulterFile } from '../../../types/multer';
import { QueueService } from '../../queues/services/queue.service';
import {
  MediaUploadDto,
  MediaQueryDto,
  CreateFolderDto,
  MediaFolderWithStatsDto,
  FolderListQueryDto,
} from '../dto';
import { RedisService } from '../../redis/redis.service';
import * as path from 'path';
import * as fs from 'fs-extra';

@Injectable()
export class FileUploadService {
  @Inject() public prisma: PrismaService;
  @Inject() public utility: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public accountService: AccountService;
  @Optional() @Inject(QueueService) private queueService?: QueueService;
  @Optional() @Inject(RedisService) private redisService?: RedisService;

  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: 'sgp1', // or your region
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
      },
      forcePathStyle: true, // Required for Digital Ocean Spaces
    });

    this.bucketName = process.env.DO_SPACES_BUCKET;
  }

  async getFileInformation(id: number): Promise<FileDataResponse> {
    // Apply company filter to ensure users can only access files from their own company
    const file = await this.prisma.files.findFirst({
      where: {
        id,
        companyId: this.utility.companyId,
      },
      include: {
        uploadedBy: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    return await this.formatResponse(file);
  }

  async formatResponse(file: Files): Promise<FileDataResponse> {
    return {
      id: file.id,
      name: file.name,
      type: file.type,
      url: file.url,
      size: file.size,
      fieldName: file.fieldName,
      originalName: file.originalName,
      encoding: file.encoding,
      mimetype: file.mimetype,
      uploadedBy: file.uploadedById
        ? await this.accountService.getAccountInformation({
            id: file.uploadedById,
          })
        : null,
    };
  }

  async getTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'files');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.files,
      query,
      tableQuery,
    );
    const formattedList = await this.utility.mapFormatData(baseList, 'files');

    return { list: formattedList, pagination, currentPage };
  }

  async uploadDocument(
    file: MulterFile,
    params: FileUploadParamsDTO,
  ): Promise<FileDataResponse> {
    // Validate file
    if (!file) {
      throw new NotFoundException('File not found.');
    }

    // Make sure project and task ID are numbers
    params.projectId = Number(params.projectId);
    params.taskId = Number(params.taskId);

    // Check if project and task exist
    if (params.projectId) await this.#checkProjectExist(params.projectId);
    if (params.taskId) await this.#checkTaskExist(params.taskId);

    // Save file information to database
    const fileInformation = await this.#saveFileInformation(file, params);

    const serverName = process.env.SERVER_NAME;

    const fileKey = `${serverName}/${fileInformation.id}-${file.originalname}`;
    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ACL: 'public-read' as const,
      ContentType: file.mimetype,
    };

    const upload = new Upload({
      client: this.s3Client,
      params: uploadParams,
    });

    const response = await upload.done();

    // Update file information with URL
    await this.#updateFileInformationURL(fileInformation.id, response.Location);
    fileInformation.url = response.Location;

    return fileInformation;
  }
  async #saveFileInformation(
    file: MulterFile,
    params: FileUploadParamsDTO,
  ): Promise<FileDataResponse> {
    const saveParams: Prisma.FilesCreateInput = {
      name: file.originalname,
      type: FileType.DOCUMENT,
      url: '',
      size: file.size,
      company: { connect: { id: this.utility.companyId } },
      uploadedBy: { connect: { id: this.utility.accountInformation.id } },
      fieldName: file.fieldname,
      originalName: file.originalname,
      encoding: file.encoding || null,
      mimetype: file.mimetype,
    };

    // Check if project and task exist
    if (params.projectId)
      saveParams['project'] = { connect: { id: params.projectId } };
    if (params.taskId) saveParams['task'] = { connect: { id: params.taskId } };

    const saveData = await this.prisma.files.create({ data: saveParams });
    const response = await this.formatResponse(saveData);

    return response;
  }
  async #updateFileInformationURL(id: number, url: string) {
    return await this.prisma.files.update({
      where: { id },
      data: { url },
    });
  }
  async #checkProjectExist(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
  }
  async #checkTaskExist(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }
  }

  // Media Library Methods
  async uploadMediaFile(file: MulterFile, options: MediaUploadDto) {
    // Check if authentication is present
    if (!this.utility.accountInformation?.id) {
      this.utility.log(
        'Error: No account information available for file upload',
      );
      throw new BadRequestException(
        'Authentication required for file upload',
      );
    }

    // Check if company ID is present - critical for multi-tenant isolation
    if (!this.utility.companyId) {
      this.utility.log(
        'Error: No company information available for file upload',
      );
      throw new BadRequestException(
        'Company information is required for file upload. Please ensure your account is properly configured.',
      );
    }

    // Determine file type based on mimetype
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');
    const isPdf = file.mimetype === 'application/pdf';
    const isDocument =
      file.mimetype.startsWith('application/') ||
      file.mimetype.startsWith('text/') ||
      isPdf;

    // Set appropriate file type
    let fileType: FileType;
    if (isImage) {
      fileType = FileType.IMAGE;
    } else if (isVideo) {
      fileType = FileType.VIDEO;
    } else if (isAudio) {
      fileType = FileType.AUDIO;
    } else if (isDocument || isPdf) {
      fileType = FileType.DOCUMENT;
    } else {
      // Default to DOCUMENT for unknown types
      fileType = FileType.DOCUMENT;
    }
    const serverName = process.env.SERVER_NAME;

    // Handle folder creation if folderName is provided
    let folderId = options.folderId;
    if (!folderId && options.folderName) {
      // For Treasury module, create folders directly at root level
      if (options.module === ModuleType.TREASURY) {
        folderId = await this.createOrGetFolder(
          options.folderName,
          null, // No parent - create at root level
          options.module || ModuleType.CMS,
        );
      } else {
        // For other modules, use the existing structure with module root folder
        const moduleRootFolder = await this.ensureModuleRootFolder(
          options.module || ModuleType.CMS,
          this.utility.companyId,
        );
        folderId = await this.createOrGetFolder(
          options.folderName,
          moduleRootFolder.id,
          options.module || ModuleType.CMS,
        );
      }
    }

    // Create file record
    const fileRecord = await this.prisma.files.create({
      data: {
        name: file.originalname,
        type: fileType,
        url: '',
        size: file.size,
        companyId: this.utility.companyId,
        uploadedById: this.utility.accountInformation?.id || null,
        fieldName: file.fieldname,
        originalName: file.originalname,
        encoding: file.encoding || null,
        mimetype: file.mimetype,
        folderId: folderId,
        module: options.module || ModuleType.CMS,
        alternativeText: options.alternativeText,
        caption: options.caption,
        tags: options.tags || [],
        // Set processing status based on file type and background processing option
        // Only images and videos can be processed in background
        processingStatus:
          options.processInBackground &&
          this.queueService &&
          (fileType === FileType.IMAGE || fileType === FileType.VIDEO)
            ? ProcessingStatus.PENDING
            : ProcessingStatus.COMPLETED,
      },
    });

    // Upload to S3
    const fileKey = `${serverName}/media/${fileRecord.id}-${file.originalname}`;
    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ACL: 'public-read' as const,
      ContentType: file.mimetype,
    };

    const upload = new Upload({
      client: this.s3Client,
      params: uploadParams,
    });

    const response = await upload.done();

    // Update file with URL
    const updatedFile = await this.prisma.files.update({
      where: { id: fileRecord.id },
      data: { url: response.Location },
    });

    // Add to processing queue if needed
    if (options.processInBackground && this.queueService) {
      try {
        // Save file locally for processing - use /tmp which has write permissions in Docker
        const localPath = path.join(
          '/tmp',
          'ante-uploads',
          `${fileRecord.id}-${file.originalname}`,
        );
        await fs.ensureDir(path.dirname(localPath));
        await fs.writeFile(localPath, file.buffer);

        // Add appropriate job based on file type
        if (fileType === FileType.IMAGE) {
          await this.queueService.addImageProcessingJob({
            fileId: fileRecord.id,
            filePath: localPath,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            companyId: this.utility.companyId,
            options: {
              generateThumbnails: true,
              generateBlurPlaceholder: true,
              generateVariants: true,
              optimizeForWeb: true,
            },
          });
        } else if (fileType === FileType.VIDEO) {
          await this.queueService.addVideoTranscodingJob({
            fileId: fileRecord.id,
            filePath: localPath,
            originalName: file.originalname,
            outputPath: path.join(
              '/tmp',
              'ante-processed',
              fileRecord.id.toString(),
            ),
            companyId: this.utility.companyId,
            options: {
              resolutions: ['360p', '480p', '720p', '1080p'],
              generateHLS: true,
              generateDASH: false,
              generateThumbnail: true,
              extractMetadata: true,
            },
          });
        }
      } catch (error) {
        console.error('Failed to add file to processing queue:', error);
        // Don't throw - file is already uploaded successfully
      }
    }

    // Invalidate cache for the affected folder
    await this.invalidateFolderCache(
      folderId,
      options.module || ModuleType.CMS,
      this.utility.companyId,
    );

    return updatedFile;
  }

  async getMediaFiles(options: MediaQueryDto) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Auto-complete old processing items (older than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const updateResult = await this.prisma.files.updateMany({
      where: {
        companyId: this.utility.companyId,
        processingStatus: {
          in: [ProcessingStatus.PENDING, ProcessingStatus.PROCESSING],
        },
        createdAt: {
          lt: tenMinutesAgo,
        },
      },
      data: {
        processingStatus: ProcessingStatus.COMPLETED,
        updatedAt: new Date(),
      },
    });

    if (updateResult.count > 0) {
      console.log(
        `[FileUploadService] Auto-completed ${updateResult.count} old processing items`,
      );
    }

    const where: Prisma.FilesWhereInput = {
      companyId: this.utility.companyId,
      type: {
        in: [FileType.IMAGE, FileType.VIDEO, FileType.DOCUMENT, FileType.AUDIO],
      },
    };

    // Filter by module if provided
    if (options.module) {
      where.module = options.module;
    }

    if (options.type) {
      where.type = options.type;
    }

    // Always apply folder filter - null for root, specific ID for folders
    if (options.folderId) {
      where.folderId = options.folderId;
    } else {
      where.folderId = null; // Root folder - only show files with no folder
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { originalName: { contains: options.search, mode: 'insensitive' } },
        { alternativeText: { contains: options.search, mode: 'insensitive' } },
        { caption: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // Filter by tags if provided
    if (options.tags && options.tags.length > 0) {
      where.tags = {
        hasSome: options.tags,
      };
    }

    if (options.status) {
      where.processingStatus = options.status;
    }

    const [files, total] = await Promise.all([
      this.prisma.files.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: true,
          folder: true,
        },
      }),
      this.prisma.files.count({ where }),
    ]);

    return {
      files,
      pagination: {
        total,
        totalPages: Math.ceil(total / pageSize),
        pageSize,
      },
      currentPage: page,
    };
  }

  async deleteMediaFile(id: number) {
    const file = await this.prisma.files.findUnique({
      where: {
        id,
        companyId: this.utility.companyId,
      },
    });

    if (!file) {
      throw new NotFoundException('Media file not found');
    }

    // Delete from S3
    if (file.url) {
      try {
        const urlParts = file.url.split('/');
        const key = urlParts.slice(3).join('/'); // Remove domain and bucket from URL

        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );
      } catch (error) {
        console.error('Error deleting file from S3:', error);
      }
    }

    // Delete from database
    await this.prisma.files.delete({
      where: { id },
    });

    // Invalidate cache for the affected folder
    await this.invalidateFolderCache(
      file.folderId,
      file.module,
      this.utility.companyId,
    );

    return { success: true };
  }

  async createMediaFolder(data: CreateFolderDto) {
    // Get company ID from account
    const account = await this.prisma.account.findUnique({
      where: { id: this.utility.accountInformation.id },
      select: { companyId: true },
    });

    if (!account?.companyId) {
      throw new BadRequestException('Company not found for this account');
    }

    // Generate path based on parent
    let path = data.name;
    if (data.parentId) {
      const parent = await this.prisma.mediaFolder.findUnique({
        where: { id: data.parentId },
      });
      if (parent) {
        path = `${parent.path}/${data.name}`;
      }
    }

    // Check if this exact folder already exists (same path, module, and company)
    const existingFolder = await this.prisma.mediaFolder.findFirst({
      where: {
        companyId: account.companyId,
        module: data.module || ModuleType.CMS,
        path,
      },
    });

    // If folder already exists, return it (idempotent behavior)
    if (existingFolder) {
      return existingFolder;
    }

    // Create new folder
    const newFolder = await this.prisma.mediaFolder.create({
      data: {
        name: data.name,
        path,
        parentId: data.parentId,
        module: data.module || ModuleType.CMS,
        companyId: account.companyId,
      },
    });

    // Invalidate cache for parent folder (folder list changed)
    await this.invalidateFolderCache(
      data.parentId,
      data.module || ModuleType.CMS,
      account.companyId,
    );

    return newFolder;
  }

  async getMediaFolders(module?: ModuleType) {
    // Get company ID from account
    const account = await this.prisma.account.findUnique({
      where: { id: this.utility.accountInformation.id },
      select: { companyId: true },
    });

    if (!account?.companyId) {
      return [];
    }

    const where: Prisma.MediaFolderWhereInput = {
      companyId: account.companyId,
    };

    // Filter by module if provided
    if (module) {
      where.module = module;
    }

    return await this.prisma.mediaFolder.findMany({
      where,
      orderBy: { path: 'asc' },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });
  }

  async listMediaFoldersWithStats(
    query: FolderListQueryDto,
  ): Promise<MediaFolderWithStatsDto[]> {
    // Get company ID from account
    const account = await this.prisma.account.findUnique({
      where: { id: this.utility.accountInformation.id },
      select: { companyId: true },
    });

    if (!account?.companyId) {
      return [];
    }

    const companyId = account.companyId;
    const module = query.module || ModuleType.CMS;
    const parentId = query.parentId || null;

    // Try cache first
    const cacheKey = `media:${companyId}:${module}:folders:${parentId || 'root'}`;
    if (this.redisService) {
      try {
        const cached =
          await this.redisService.get<MediaFolderWithStatsDto[]>(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        console.error('Cache retrieval error:', error);
      }
    }

    const where: Prisma.MediaFolderWhereInput = {
      companyId,
      module,
      parentId,
    };

    // Get folders with basic counts
    const folders = await this.prisma.mediaFolder.findMany({
      where,
      orderBy: { path: 'asc' },
      include: {
        _count: {
          select: {
            files: true,
            children: true, // subfolders count
          },
        },
      },
    });

    // Transform and add computed fields
    const foldersWithStats: MediaFolderWithStatsDto[] = await Promise.all(
      folders.map(async (folder) => {
        // Get total size of files in this folder
        const totalSizeResult = await this.prisma.files.aggregate({
          where: { folderId: folder.id },
          _sum: { size: true },
        });

        return {
          id: folder.id,
          name: folder.name,
          path: folder.path,
          parentId: folder.parentId,
          module: folder.module,
          companyId: folder.companyId,
          fileCount: folder._count.files,
          subfolderCount: folder._count.children,
          totalSize: totalSizeResult._sum.size || 0,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
        };
      }),
    );

    // Cache for 5 minutes
    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, foldersWithStats, 300);
      } catch (error) {
        console.error('Cache set error:', error);
      }
    }

    return foldersWithStats;
  }

  async updateMediaFolder(
    id: number,
    data: {
      name?: string;
      parentId?: number;
    },
  ) {
    const folder = await this.prisma.mediaFolder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Update path if name or parent changes
    let newPath = folder.path;
    if (data.name || data.parentId !== undefined) {
      const name = data.name || folder.name;
      if (data.parentId) {
        const parent = await this.prisma.mediaFolder.findUnique({
          where: { id: data.parentId },
        });
        newPath = parent ? `${parent.path}/${name}` : name;
      } else {
        newPath = name;
      }
    }

    const updatedFolder = await this.prisma.mediaFolder.update({
      where: { id },
      data: {
        ...data,
        path: newPath,
      },
    });

    // Invalidate cache for both old and new parent folders
    await this.invalidateFolderCache(
      folder.parentId,
      folder.module,
      folder.companyId,
    );
    if (data.parentId !== undefined && data.parentId !== folder.parentId) {
      await this.invalidateFolderCache(
        data.parentId,
        folder.module,
        folder.companyId,
      );
    }

    return updatedFolder;
  }

  async deleteMediaFolder(
    id: number,
    options: {
      deleteFiles?: boolean;
      moveToParent?: boolean;
      confirmFolderName?: string;
    },
  ) {
    const folder = await this.prisma.mediaFolder.findUnique({
      where: { id },
      include: {
        files: true,
        children: {
          include: {
            files: true,
            children: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Validate folder name for destructive operations
    if (options.deleteFiles && options.confirmFolderName !== folder.name) {
      throw new BadRequestException(
        `Folder name confirmation required. Please enter "${folder.name}" to confirm permanent deletion.`,
      );
    }

    // Count total files that will be affected (including subfolders)
    const totalFiles = await this.countFilesRecursively(id);
    const totalSubfolders = await this.countSubfoldersRecursively(id);

    // Handle different deletion modes
    if (options.deleteFiles) {
      // Mode 1: Delete everything (files, subfolders, and folder)
      await this.deleteRecursively(folder);
    } else if (options.moveToParent) {
      // Mode 2: Move files to parent folder, then delete empty folder
      if (folder.files.length > 0) {
        await this.moveFilesToParent(folder.files, folder.parentId);
      }

      // Check if there are any subfolders - these need to be moved too
      if (folder.children.length > 0) {
        await this.moveSubfoldersToParent(folder.children, folder.parentId);
      }

      // Now delete the empty folder
      await this.prisma.mediaFolder.delete({
        where: { id },
      });
    } else {
      // Backward compatibility - require explicit option
      if (folder.children.length > 0) {
        throw new BadRequestException(
          `Folder contains ${totalSubfolders} subfolder(s) and ${totalFiles} file(s). Choose: set deleteFiles=true to permanently delete all, or moveToParent=true to move contents to parent folder.`,
        );
      }

      if (folder.files.length > 0) {
        throw new BadRequestException(
          `Folder contains ${folder.files.length} file(s). Choose: set deleteFiles=true to permanently delete them, or moveToParent=true to move them to parent folder.`,
        );
      }

      // Empty folder - safe to delete
      await this.prisma.mediaFolder.delete({
        where: { id },
      });
    }

    // Invalidate cache for parent folder (folder list changed)
    await this.invalidateFolderCache(
      folder.parentId,
      folder.module,
      folder.companyId,
    );

    return {
      success: true,
      deletedFolder: folder.name,
      totalFilesAffected: totalFiles,
      totalSubfoldersAffected: totalSubfolders,
      mode: options.deleteFiles
        ? 'permanent_delete'
        : options.moveToParent
          ? 'move_to_parent'
          : 'delete_empty',
    };
  }

  async bulkMoveFiles(fileIds: number[], folderId?: number) {
    // Get affected files for cache invalidation
    const affectedFiles = await this.prisma.files.findMany({
      where: {
        id: { in: fileIds },
        companyId: this.utility.companyId,
      },
      select: { folderId: true, module: true },
    });

    const result = await this.prisma.files.updateMany({
      where: {
        id: { in: fileIds },
        companyId: this.utility.companyId,
      },
      data: {
        folderId: folderId || null,
      },
    });

    // Invalidate cache for all affected folders
    const affectedFolders = new Set<string>();
    affectedFiles.forEach((file) => {
      // Add source folder
      affectedFolders.add(`${file.folderId}:${file.module}`);
      // Add destination folder
      affectedFolders.add(`${folderId || null}:${file.module}`);
    });

    for (const folderInfo of affectedFolders) {
      const [folderIdStr, module] = folderInfo.split(':');
      const parsedFolderId =
        folderIdStr === 'null' ? null : parseInt(folderIdStr);
      await this.invalidateFolderCache(
        parsedFolderId,
        module as ModuleType,
        this.utility.companyId,
      );
    }

    return {
      movedCount: result.count,
    };
  }

  // Helper methods for folder deletion operations
  private async countFilesRecursively(folderId: number): Promise<number> {
    const result = await this.prisma.files.count({
      where: {
        folder: {
          OR: [
            { id: folderId },
            { path: { startsWith: await this.getFolderPath(folderId) } },
          ],
        },
      },
    });
    return result;
  }

  private async countSubfoldersRecursively(folderId: number): Promise<number> {
    const folderPath = await this.getFolderPath(folderId);
    const result = await this.prisma.mediaFolder.count({
      where: {
        path: { startsWith: folderPath },
        id: { not: folderId }, // Exclude the folder itself
      },
    });
    return result;
  }

  private async getFolderPath(folderId: number): Promise<string> {
    const folder = await this.prisma.mediaFolder.findUnique({
      where: { id: folderId },
      select: { path: true },
    });
    return folder?.path || '';
  }

  private async deleteRecursively(folder: any): Promise<void> {
    // First, recursively delete all subfolders
    for (const child of folder.children) {
      await this.deleteRecursively(child);
    }

    // Delete all files in this folder (with S3 variants)
    for (const file of folder.files) {
      await this.deleteMediaFileWithVariants(file.id);
    }

    // Finally, delete the folder itself
    await this.prisma.mediaFolder.delete({
      where: { id: folder.id },
    });
  }

  private async deleteMediaFileWithVariants(fileId: number): Promise<void> {
    const file = await this.prisma.files.findUnique({
      where: { id: fileId },
    });

    if (!file) return;

    // Delete main file from S3
    if (file.url) {
      try {
        const urlParts = file.url.split('/');
        const key = urlParts.slice(3).join('/');

        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );
      } catch (error) {
        console.error(`Error deleting main file from S3:`, error);
      }
    }

    // Delete all variants from S3
    if (file.variants && typeof file.variants === 'object') {
      await this.deleteS3Variants(file.variants as any);
    }

    // Delete from database
    await this.prisma.files.delete({
      where: { id: fileId },
    });
  }

  private async deleteS3Variants(variants: Record<string, any>): Promise<void> {
    try {
      const deletePromises: Promise<void>[] = [];

      // Handle different variant structures
      if (variants.sizes) {
        // Image variants structure: { sizes: { thumbnail: { url }, small: { url }, ... } }
        for (const [sizeKey, sizeData] of Object.entries(variants.sizes)) {
          if (typeof sizeData === 'object' && sizeData && 'url' in sizeData) {
            deletePromises.push(this.deleteS3Object(sizeData.url as string));
          }
        }
      }

      if (variants.formats) {
        // Video variants structure: { formats: { mp4_360p: { url }, mp4_720p: { url }, ... } }
        for (const [formatKey, formatData] of Object.entries(
          variants.formats,
        )) {
          if (
            typeof formatData === 'object' &&
            formatData &&
            'url' in formatData
          ) {
            deletePromises.push(this.deleteS3Object(formatData.url as string));
          }
        }
      }

      // Handle direct URL arrays or objects
      if (Array.isArray(variants)) {
        for (const variant of variants) {
          if (typeof variant === 'string') {
            deletePromises.push(this.deleteS3Object(variant));
          } else if (
            typeof variant === 'object' &&
            variant &&
            'url' in variant
          ) {
            deletePromises.push(this.deleteS3Object(variant.url as string));
          }
        }
      } else {
        // Handle flat variant structure with direct URLs
        for (const [key, value] of Object.entries(variants)) {
          if (typeof value === 'string' && value.startsWith('http')) {
            deletePromises.push(this.deleteS3Object(value));
          }
        }
      }

      // Wait for all deletions to complete
      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('Error deleting S3 variants:', error);
    }
  }

  private async deleteS3Object(url: string): Promise<void> {
    try {
      const urlParts = url.split('/');
      const key = urlParts.slice(3).join('/'); // Remove domain and bucket from URL

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      console.error(`Error deleting S3 object ${url}:`, error);
    }
  }

  private async moveFilesToParent(
    files: any[],
    parentId: number | null,
  ): Promise<void> {
    if (files.length === 0) return;

    const fileIds = files.map((file) => file.id);
    await this.prisma.files.updateMany({
      where: { id: { in: fileIds } },
      data: { folderId: parentId },
    });
  }

  private async moveSubfoldersToParent(
    subfolders: any[],
    parentId: number | null,
  ): Promise<void> {
    if (subfolders.length === 0) return;

    for (const subfolder of subfolders) {
      // Update the folder's parent
      await this.prisma.mediaFolder.update({
        where: { id: subfolder.id },
        data: {
          parentId: parentId,
          path: parentId
            ? `${await this.getFolderPath(parentId)}/${subfolder.name}`
            : subfolder.name,
        },
      });
    }
  }

  // Cache invalidation helper methods
  private async invalidateFolderCache(
    folderId: number | null,
    module: ModuleType,
    companyId: number,
  ): Promise<void> {
    if (!this.redisService) return;

    try {
      const keys = [
        `media:${companyId}:${module}:folders:${folderId || 'root'}`,
        `media:${companyId}:${module}:folder:${folderId}:stats`,
      ];

      // Also invalidate parent folder cache if exists
      if (folderId) {
        const folder = await this.prisma.mediaFolder.findUnique({
          where: { id: folderId },
          select: { parentId: true },
        });
        if (folder?.parentId) {
          keys.push(`media:${companyId}:${module}:folders:${folder.parentId}`);
          keys.push(
            `media:${companyId}:${module}:folder:${folder.parentId}:stats`,
          );
        } else {
          // If parent is null, also invalidate root cache
          keys.push(`media:${companyId}:${module}:folders:root`);
        }
      }

      // Delete all cache keys
      for (const key of keys) {
        await this.redisService.del(key);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  private async invalidateModuleCache(
    module: ModuleType,
    companyId: number,
  ): Promise<void> {
    if (!this.redisService) return;

    try {
      // This is a simplified version - in production you might want to use SCAN
      // For now we'll invalidate specific known patterns
      const patterns = [
        `media:${companyId}:${module}:folders:*`,
        `media:${companyId}:${module}:folder:*`,
      ];

      // Note: Redis doesn't have a direct "delete by pattern" command
      // In production, consider using SCAN or tracking keys in a separate set
      console.log(`Would invalidate cache patterns: ${patterns.join(', ')}`);
    } catch (error) {
      console.error('Module cache invalidation error:', error);
    }
  }

  // Module-specific folder management helper methods
  private async ensureModuleRootFolder(module: ModuleType, companyId: number) {
    const folderName = `${module}_ROOT`;

    return await this.prisma.mediaFolder.upsert({
      where: {
        companyId_module_path: {
          companyId,
          module,
          path: folderName,
        },
      },
      create: {
        name: folderName,
        path: folderName,
        module,
        companyId,
      },
      update: {},
    });
  }

  private async createOrGetFolder(
    folderName: string,
    parentId: number | null,
    module: ModuleType,
  ): Promise<number> {
    // First try to find existing folder
    const existingFolder = await this.prisma.mediaFolder.findFirst({
      where: {
        name: folderName,
        parentId: parentId,
        companyId: this.utility.companyId,
        module: module,
      },
    });

    if (existingFolder) {
      return existingFolder.id;
    }

    // Get parent folder for path construction
    const parentFolder = parentId
      ? await this.prisma.mediaFolder.findUnique({
          where: { id: parentId },
        })
      : null;

    const path = parentFolder
      ? `${parentFolder.path}/${folderName}`
      : folderName;

    // Create new folder
    const newFolder = await this.prisma.mediaFolder.create({
      data: {
        name: folderName,
        path,
        parentId: parentId,
        companyId: this.utility.companyId,
        module: module,
      },
    });

    return newFolder.id;
  }
}
