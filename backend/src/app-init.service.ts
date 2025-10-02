import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@common/prisma.service';

@Injectable()
export class AppInitService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    // Set the event emitter in PrismaService
    console.log('[AppInitService] Setting EventEmitter in PrismaService');
    this.prisma.setEventEmitter(this.eventEmitter);
    console.log('[AppInitService] EventEmitter set successfully');
  }
}
