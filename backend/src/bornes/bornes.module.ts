import { Module } from '@nestjs/common';
import { BornesService } from './bornes.service';
import { BornesController } from './bornes.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BornesController],
  providers: [BornesService, PrismaService],
})
export class BornesModule {}
