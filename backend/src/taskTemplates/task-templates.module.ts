// src/task-templates/task-templates.module.ts
import { Module } from '@nestjs/common';
import { TaskTemplatesService } from './task-templates.service';
import { TaskTemplatesController } from './task-templates.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ProductionsModule } from '../productions/productions.module';

@Module({
  imports: [
    ProductionsModule, // 👈 simple import, pas de forwardRef
  ],
  controllers: [TaskTemplatesController],
  providers: [TaskTemplatesService, PrismaService],
})
export class TaskTemplatesModule {}
