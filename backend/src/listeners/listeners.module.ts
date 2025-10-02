import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { TaskChangeListener } from './task-change.listener';
import { FilingChangeListener } from './filing-change.listener';
import { DiscussionEventListener } from './discussion-event.listener';
import { TaskRealtimeListener } from './task-realtime.listener';
import { SocketModule } from '@modules/communication/socket/socket/socket.module';
import { DiscussionModule } from '@modules/communication/discussion/discussion/discussion.module';

@Module({
  imports: [
    ConfigModule,
    SocketModule,
    DiscussionModule,
    BullModule.registerQueue({
      name: 'task-processing',
    }),
  ],
  providers: [
    TaskChangeListener,
    FilingChangeListener,
    DiscussionEventListener,
    TaskRealtimeListener,
  ],
  exports: [TaskChangeListener, FilingChangeListener, DiscussionEventListener, TaskRealtimeListener],
})
export class ListenersModule {}
