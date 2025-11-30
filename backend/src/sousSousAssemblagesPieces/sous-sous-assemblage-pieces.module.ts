import { Module } from '@nestjs/common';
import { SousSousAssemblagePiecesService } from './sous-sous-assemblage-pieces.service';
import { SousSousAssemblagePiecesController } from './sous-sous-assemblage-pieces.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SousSousAssemblagePiecesController],
  providers: [SousSousAssemblagePiecesService, PrismaService],
})
export class SousSousAssemblagePiecesModule {}
