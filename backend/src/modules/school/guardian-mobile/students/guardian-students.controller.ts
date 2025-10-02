import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { GuardianStudentsService } from './guardian-students.service';
import {
  ConnectStudentDto,
  DisconnectStudentDto,
} from './guardian-students.dto';
import { GuardianAuthGuard } from '../auth/guardian-mobile-auth.guard';

@Controller('api/guardian/students')
export class GuardianStudentsController {
  constructor(private readonly studentsService: GuardianStudentsService) {}

  @Post('connect')
  @UseGuards(GuardianAuthGuard)
  async connectStudent(@Req() req: any, @Body() dto: ConnectStudentDto) {
    try {
      const result = await this.studentsService.connectStudent(
        req.user.id,
        dto,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('disconnect')
  @UseGuards(GuardianAuthGuard)
  async disconnectStudent(@Req() req: any, @Body() dto: DisconnectStudentDto) {
    try {
      const result = await this.studentsService.disconnectStudent(
        req.user.id,
        dto,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @UseGuards(GuardianAuthGuard)
  async getConnectedStudents(@Req() req: any) {
    try {
      const result = await this.studentsService.getConnectedStudents(
        req.user.id,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('verify/:studentId')
  @UseGuards(GuardianAuthGuard)
  async verifyStudent(@Req() req: any, @Param('studentId') studentId: string) {
    console.log(
      'GuardianStudentsController.verifyStudent - studentId:',
      studentId,
    );
    console.log(
      'GuardianStudentsController.verifyStudent - user:',
      req.user ? 'Present' : 'Missing',
    );

    try {
      const result = await this.studentsService.verifyStudent(
        req.user.id,
        studentId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(
        'GuardianStudentsController.verifyStudent - Error:',
        error.message,
      );
      throw error;
    }
  }
}
