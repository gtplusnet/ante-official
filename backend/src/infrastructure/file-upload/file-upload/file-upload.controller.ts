import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Res,
  Inject,
  Body,
  Query,
  Response as NestResponse,
  Put,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UtilityService } from '@common/utility.service';
import { FileUploadService } from './file-upload.service';
import { FileUploadParamsDTO } from './file-upload.validator.dto';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { Response } from 'express';
import { MulterFile } from '../../../types/multer';

@Controller('file-upload')
export class FileUploadController {
  @Inject() public utility: UtilityService;
  @Inject() public fileUploadService: FileUploadService;

  @Post('upload-document')
  @UseInterceptors(FileInterceptor('fileData'))
  async uploadDocument(
    @Res() response,
    @UploadedFile() fileData: MulterFile,
    @Query() params: FileUploadParamsDTO,
  ) {
    this.utility.responseHandler(
      this.fileUploadService.uploadDocument(fileData, params),
      response,
    );
  }

  @Put()
  async table(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @NestResponse() response: Response,
  ) {
    this.utility.responseHandler(
      this.fileUploadService.getTable(query, body),
      response,
    );
  }

  @Get()
  async getFileInfo(
    @Query('id') id: number,
    @NestResponse() response: Response,
  ) {
    this.utility.responseHandler(
      this.fileUploadService.getFileInformation(Number(id)),
      response,
    );
  }
}
