// src/productions/productions.module.ts
import { Module } from '@nestjs/common';
import { ProductionsService } from './productions.service';
import { ProductionsController } from './productions.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],  // 👈 rien ici pour l’instant
  controllers: [ProductionsController],
  providers: [ProductionsService, PrismaService],
  exports: [ProductionsService], // 👈 pour que TaskTemplatesModule puisse l’injecter
})
export class ProductionsModule {}
