import { Module } from '@nestjs/common';
import { GradeLevelModule } from './grade-level/grade-level.module';
import { SectionModule } from './section/section.module';
import { StudentModule } from './student/student.module';
import { GuardianModule } from './guardian/guardian.module';
import { DeviceLicenseModule } from './device-license/device-license.module';
import { SyncModule } from './sync/sync.module';
import { GateModule } from './gate/gate.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GuardianMobileModule } from './guardian-mobile/guardian-mobile.module';
import { SchoolGuardianPublicModule } from './guardian-public/school-guardian-public.module';

@Module({
  imports: [
    GradeLevelModule,
    SectionModule,
    StudentModule,
    GuardianModule,
    DeviceLicenseModule,
    SyncModule,
    GateModule,
    AttendanceModule,
    GuardianMobileModule,
    SchoolGuardianPublicModule,
  ],
  exports: [
    GradeLevelModule,
    SectionModule,
    StudentModule,
    GuardianModule,
    DeviceLicenseModule,
    SyncModule,
    GateModule,
    AttendanceModule,
    GuardianMobileModule,
    SchoolGuardianPublicModule,
  ],
})
export class SchoolModule {}
