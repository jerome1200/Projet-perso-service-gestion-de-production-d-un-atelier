import { Module } from '@nestjs/common';
import { SousSousAssemblageService } from './sous-sous-assemblage.service';
import { SousSousAssemblageController } from './sous-sous-assemblage.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SousSousAssemblageController],
  providers: [SousSousAssemblageService, PrismaService],
})
export class SousSousAssemblageModule {}
