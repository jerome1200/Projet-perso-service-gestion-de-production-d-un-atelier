import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // ← il manquait ça
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UsersController], // ← ajoute cette ligne
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
