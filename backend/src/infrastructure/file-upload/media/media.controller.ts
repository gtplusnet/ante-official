import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileUploadService } from '../file-upload/file-upload.service';
import { MulterFile } from '../../../types/multer';
import { FileType, ProcessingStatus, ModuleType } from '@prisma/client';
import {
  MediaUploadDto,
  MediaQueryDto,
  CreateFolderDto,
  FolderListQueryDto,
} from '../dto';

@ApiTags('Media Library')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload and process media file (image or video)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Media file uploaded and processing started',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or validation failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: MulterFile,
    @Body() uploadData: MediaUploadDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.fileUploadService.uploadMediaFile(
      file,
      uploadData,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Media file uploaded successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get media files with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media files retrieved successfully',
  })
  @ApiQuery({ name: 'module', required: false, enum: ModuleType })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: FileType })
  @ApiQuery({ name: 'folderId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ProcessingStatus })
  @ApiQuery({ name: 'tags', required: false, type: String })
  async getMediaFiles(@Query() query: MediaQueryDto) {
    const result = await this.fileUploadService.getMediaFiles(query);

    return {
      statusCode: HttpStatus.OK,
      message: 'Media files retrieved successfully',
      data: result.files,
      pagination: result.pagination,
      currentPage: result.currentPage,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific media file by ID' })
  @ApiParam({ name: 'id', description: 'Media file ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media file retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Media file not found',
  })
  async getMediaFile(@Param('id', ParseIntPipe) id: number) {
    const result = await this.fileUploadService.getFileInformation(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Media file retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update media file metadata' })
  @ApiParam({ name: 'id', description: 'Media file ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media file updated successfully',
  })
  async updateMediaFile(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateData: {
      folderId?: number;
    },
  ) {
    // TODO: Implement update functionality in FileUploadService
    return {
      statusCode: HttpStatus.OK,
      message: 'Media file update not implemented yet',
      data: { id, ...updateData },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media file and all its variants' })
  @ApiParam({ name: 'id', description: 'Media file ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media file deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Media file not found',
  })
  @HttpCode(HttpStatus.OK)
  async deleteMediaFile(@Param('id', ParseIntPipe) id: number) {
    await this.fileUploadService.deleteMediaFile(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Media file deleted successfully',
    };
  }

  // === FOLDER OPERATIONS ===

  @Post('folders')
  @ApiOperation({ summary: 'Create a new media folder' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Folder created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid folder data or duplicate path',
  })
  async createFolder(@Body() createFolderDto: CreateFolderDto) {
    const result =
      await this.fileUploadService.createMediaFolder(createFolderDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Folder created successfully',
      data: result,
    };
  }

  @Get('folders/list')
  @ApiOperation({ summary: 'Get all media folders with statistics' })
  @ApiQuery({ name: 'module', required: false, enum: ModuleType })
  @ApiQuery({ name: 'parentId', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Folders retrieved successfully',
  })
  async getFolders(@Query() query: FolderListQueryDto) {
    const folders =
      await this.fileUploadService.listMediaFoldersWithStats(query);

    return {
      statusCode: HttpStatus.OK,
      message: 'Folders retrieved successfully',
      data: folders,
    };
  }

  @Get('folders/basic')
  @ApiOperation({ summary: 'Get basic folder list (legacy endpoint)' })
  @ApiQuery({ name: 'module', required: false, enum: ModuleType })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Basic folders retrieved successfully',
  })
  async getFoldersBasic(@Query('module') module?: ModuleType) {
    const folders = await this.fileUploadService.getMediaFolders(module);

    return {
      statusCode: HttpStatus.OK,
      message: 'Basic folders retrieved successfully',
      data: folders,
    };
  }

  @Put('folders/:id')
  @ApiOperation({ summary: 'Update a media folder' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Folder updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Folder not found',
  })
  async updateFolder(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: { name?: string; parentId?: number },
  ) {
    const result = await this.fileUploadService.updateMediaFolder(
      id,
      updateData,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Folder updated successfully',
      data: result,
    };
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete a media folder with advanced options' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Folder deleted successfully',
  })
  @HttpCode(HttpStatus.OK)
  async deleteFolder(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    options?: {
      deleteFiles?: boolean;
      moveToParent?: boolean;
      confirmFolderName?: string;
    },
  ) {
    const result = await this.fileUploadService.deleteMediaFolder(
      id,
      options || {},
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Folder deleted successfully using ${result.mode} mode`,
      data: result,
    };
  }

  // === BULK OPERATIONS ===

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete multiple media files' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk delete completed',
  })
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() bulkDeleteDto: { ids: number[] }) {
    const results = [];
    const errors = [];

    for (const id of bulkDeleteDto.ids) {
      try {
        await this.fileUploadService.deleteMediaFile(id);
        results.push({ id, success: true });
      } catch (error) {
        errors.push({ id, success: false, error: error.message });
      }
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Bulk delete completed: ${results.length} succeeded, ${errors.length} failed`,
      data: {
        succeeded: results,
        failed: errors,
      },
    };
  }

  @Post('bulk-move')
  @ApiOperation({ summary: 'Move multiple media files to a folder' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk move completed',
  })
  @HttpCode(HttpStatus.OK)
  async bulkMove(
    @Body() bulkMoveDto: { fileIds: number[]; folderId?: number },
  ) {
    const result = await this.fileUploadService.bulkMoveFiles(
      bulkMoveDto.fileIds,
      bulkMoveDto.folderId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Successfully moved ${result.movedCount} file(s)`,
      data: result,
    };
  }

  // === UTILITY ENDPOINTS ===

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get media library statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media statistics retrieved successfully',
  })
  async getStats() {
    // TODO: Implement statistics gathering
    return {
      statusCode: HttpStatus.OK,
      message: 'Media statistics retrieved successfully',
      data: {
        totalFiles: 0,
        totalSize: 0,
        processingQueue: 0,
        completedToday: 0,
        supportedFormats: {
          images: 8, // JPEG, PNG, WebP, GIF, TIFF, AVIF, BMP
          videos: 9, // MP4, MPEG, QuickTime, AVI, WMV, WebM, OGG, 3GPP, FLV
        },
      },
    };
  }

  @Get('supported-formats')
  @ApiOperation({ summary: 'Get list of supported media formats' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supported formats retrieved successfully',
  })
  async getSupportedFormats() {
    // This would typically come from MediaProcessorService
    return {
      statusCode: HttpStatus.OK,
      message: 'Supported formats retrieved successfully',
      data: {
        images: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/tiff',
          'image/avif',
          'image/bmp',
        ],
        videos: [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo', // AVI
          'video/x-ms-wmv', // WMV
          'video/webm',
          'video/ogg',
          'video/3gpp',
          'video/x-flv', // FLV
          'video/x-matroska', // MKV
        ],
      },
    };
  }
}
