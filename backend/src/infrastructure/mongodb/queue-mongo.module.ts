import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueMongo, QueueMongoSchema } from './queue-mongo.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: QueueMongo.name, schema: QueueMongoSchema }],
      'mongo', // Use the secondary connection
    ),
  ],
  exports: [MongooseModule],
})
export class QueueMongoModule {}
