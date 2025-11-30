import { Module } from '@nestjs/common';
import { KitPiecesService } from './kit-pieces.service';
import { KitPiecesController } from './kit-pieces.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [KitPiecesController],
  providers: [KitPiecesService, PrismaService],
})
export class KitPiecesModule {}
