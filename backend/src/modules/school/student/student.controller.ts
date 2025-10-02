import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { MulterFile } from '../../../types/multer';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentPhotoUploadDto,
} from './student.validator';

@Controller('school/student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post('create')
  async create(@Body() data: CreateStudentDto, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.studentService.create(data, this.utilityService.companyId),
      res,
    );
  }

  @Put('update')
  async update(
    @Query('id') id: string,
    @Body() data: UpdateStudentDto,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.studentService.update(id, data, this.utilityService.companyId),
      res,
    );
  }

  @Get('info')
  async getInfo(@Query('id') id: string, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.studentService.findOne(id, this.utilityService.companyId),
      res,
    );
  }

  @Get('list')
  async list(@Res() res: Response) {
    return this.utilityService.responseHandler(
      this.studentService.list(this.utilityService.companyId),
      res,
    );
  }

  @Delete('delete')
  async delete(@Query('id') id: string, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.studentService.delete(id, this.utilityService.companyId),
      res,
    );
  }

  @Post('upload-photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @UploadedFile() file: MulterFile,
    @Body() data: StudentPhotoUploadDto,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    return this.utilityService.responseHandler(
      this.studentService.uploadPhoto(
        data.studentId,
        file,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  // Password reset endpoint removed - students no longer have accounts

  @Put('table')
  async table(
    @Body() body: TableBodyDTO,
    @Query() query: TableQueryDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.studentService.table(body, query, this.utilityService.companyId),
      res,
    );
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @UploadedFile() file: MulterFile,
    @Query('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    // Generate session ID if not provided
    const importSessionId = sessionId || `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return this.utilityService.responseHandler(
      this.studentService.import(file, this.utilityService.companyId, importSessionId),
      res,
    );
  }

  @Post('seed')
  async seed(@Res() res: Response) {
    return this.utilityService.responseHandler(
      this.studentService.seed(this.utilityService.companyId),
      res,
    );
  }

  @Get('export')
  async export(@Res() res: Response) {
    try {
      const excelBuffer = await this.studentService.export(
        this.utilityService.companyId,
      );

      // Set headers for Excel download
      const fileName = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Send Excel buffer
      return res.send(excelBuffer);
    } catch (error) {
      return this.utilityService.responseHandler(
        Promise.reject(error),
        res,
      );
    }
  }
}
