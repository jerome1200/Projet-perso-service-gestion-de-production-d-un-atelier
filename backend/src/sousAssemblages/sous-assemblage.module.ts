import { Module } from '@nestjs/common';
import { SousAssemblageService } from './sous-assemblage.service';
import { SousAssemblageController } from './sous-assemblage.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SousAssemblageController],
  providers: [SousAssemblageService, PrismaService],
})
export class SousAssemblageModule {}
