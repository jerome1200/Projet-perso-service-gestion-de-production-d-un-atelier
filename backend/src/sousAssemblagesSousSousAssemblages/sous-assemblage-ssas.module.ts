import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SousAssemblageSsasService } from './sous-assemblage-ssas.service';
import { SousAssemblageSsasController } from './sous-assemblage-ssas.controller';

@Module({
  controllers: [SousAssemblageSsasController],
  providers: [SousAssemblageSsasService, PrismaService],
})
export class SousAssemblageSsasModule {}
