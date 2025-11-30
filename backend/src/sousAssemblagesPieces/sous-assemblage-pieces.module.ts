import { Module } from '@nestjs/common';
import { SousAssemblagePiecesService } from './sous-assemblage-pieces.service';
import { SousAssemblagePiecesController } from './sous-assemblage-pieces.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SousAssemblagePiecesController],
  providers: [SousAssemblagePiecesService, PrismaService],
})
export class SousAssemblagePiecesModule {}
