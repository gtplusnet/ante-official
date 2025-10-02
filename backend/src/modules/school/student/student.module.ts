import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { StudentImportGateway } from './student-import.gateway';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [StudentController],
  providers: [StudentService, StudentImportGateway],
  exports: [StudentService],
})
export class StudentModule {}
