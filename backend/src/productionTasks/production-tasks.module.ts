import { Module } from '@nestjs/common';
import { ProductionTasksService } from './production-tasks.service';
import { ProductionTasksController } from './production-tasks.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ProductionTasksController],
  providers: [ProductionTasksService, PrismaService],
  exports: [ProductionTasksService],
})
export class ProductionTasksModule {}
