import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueMongo, QueueMongoSchema } from './queue-mongo.schema';
import { QueueMongoService } from '@common/services/queue-mongo.service';
import { QueueLogMongo, QueueLogMongoSchema } from './queue-log-mongo.schema';
import { QueueLogMongoService } from '@common/services/queue-log-mongo.service';
import { CacheConfigModule } from '../cache/cache.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        connectionName: 'mongo',
      },
    ),
    MongooseModule.forFeature(
      [
        { name: QueueMongo.name, schema: QueueMongoSchema },
        { name: QueueLogMongo.name, schema: QueueLogMongoSchema },
      ],
      'mongo',
    ),
    CacheConfigModule, // Add cache module
  ],
  providers: [QueueMongoService, QueueLogMongoService],
  exports: [
    MongooseModule,
    QueueMongoService,
    QueueLogMongoService,
    CacheConfigModule,
  ],
})
export class MongoDbModule {}
