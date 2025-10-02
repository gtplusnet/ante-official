import { Injectable, Inject } from '@nestjs/common';
import { EmployeeImportationDTO } from './employee-importation.interface';
import { FileUploadService } from '@infrastructure/file-upload/file-upload/file-upload.service';
import { FileUploadParamsDTO } from '@infrastructure/file-upload/file-upload/file-upload.validator.dto';
import { PrismaService } from '@common/prisma.service';
import { QueueService } from '@infrastructure/queue/queue/queue.service';
import { QueueCreateDTO } from '@infrastructure/queue/queue/queue.interface';
import { FileDataResponse } from '../../../../shared/response/file.response';
import { MulterFile } from '../../../../types/multer';

@Injectable()
export class EmployeeImportationService {
  @Inject() private readonly fileUploadService: FileUploadService;
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly queueService: QueueService;

  async importEmployeeData(
    file: MulterFile,
    params: EmployeeImportationDTO,
  ): Promise<any> {
    const fileUploadParams: FileUploadParamsDTO = {
      projectId: null,
      taskId: null,
    };
    const uploadedInformation: FileDataResponse =
      await this.fileUploadService.uploadDocument(file, fileUploadParams);

    const createQueueParams: QueueCreateDTO = {
      name: 'Employee Importation',
      type: this.queueService.QueueType.EMPLOYEE_IMPORTATION,
      fileId: uploadedInformation.id,
      queueSettings: params,
    };

    await this.queueService.createQueue(createQueueParams);

    return { message: 'Employee data imported successfully' };
  }
}
