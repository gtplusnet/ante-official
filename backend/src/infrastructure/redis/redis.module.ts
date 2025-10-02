import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { QueueRedisService } from './queue-redis.service';

@Global()
@Module({
  providers: [RedisService, QueueRedisService],
  exports: [RedisService, QueueRedisService],
})
export class RedisModule {}
