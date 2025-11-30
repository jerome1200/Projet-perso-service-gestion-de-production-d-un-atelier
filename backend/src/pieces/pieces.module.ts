import { Module } from '@nestjs/common';
import { PiecesService } from './pieces.service';
import { PiecesController } from './pieces.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PiecesController],
  providers: [PiecesService, PrismaService],
})
export class PiecesModule {}
