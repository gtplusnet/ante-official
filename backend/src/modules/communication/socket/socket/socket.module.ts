import { forwardRef, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { BoardLaneService } from '@modules/project/board/board-lane/board-lane.service';
import { WsResponseInterceptor } from '../../../../interceptors/ws.response.interceptor';
import { WsExceptionFilter } from '../../../../filters/ws.exception.filter';
import { TopicService } from '@modules/communication/topic/topic/topic.service';
import { TaskService } from '@modules/project/task/task/task.service';
import { ProjectModule } from '@modules/project/project/project/project.module';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import { BoqService } from '@modules/project/boq/boq/boq.service';
import { UserOrgService } from '@modules/user/user-org/user-org.service';
import { RoleGroupService } from '@modules/role/role-group/role-group.service';
import { winstonConfig } from '@common/logger';
import { CommonModule } from '@common/common.module';
import { AiChatModule } from '@integrations/ai-chat/ai-chat/ai-chat.module';
import { WsAdminGuard } from '@common/guards/ws-jwt.guard';
import { DiscussionModule } from '@modules/communication/discussion/discussion/discussion.module';

@Module({
  imports: [
    forwardRef(() => ProjectModule),
    CommonModule,
    AiChatModule,
    forwardRef(() => DiscussionModule),
  ],
  providers: [
    SocketGateway,
    SocketService,
    WsResponseInterceptor,
    WsExceptionFilter,
    WsAdminGuard,
    // Services that are not provided by imported modules
    BoardLaneService,
    TopicService,
    TaskService,
    NotificationService,
    UserOrgService,
    RoleGroupService,
    BoqService,
    { provide: 'winston', useValue: winstonConfig },
  ],
  exports: [SocketGateway, SocketService],
})
export class SocketModule {}
