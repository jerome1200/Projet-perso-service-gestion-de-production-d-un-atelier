import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { BornesService } from './bornes.service';
import { CreateBorneDto } from './dto/create-borne.dto';
import { UpdateBorneDto } from './dto/update-borne.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('bornes')
export class BornesController {
  constructor(private readonly bornesService: BornesService) {}

  // ➕ Créer une borne
  @Post()
  create(@Body() createBorneDto: CreateBorneDto) {
    return this.bornesService.create(createBorneDto);
  }

  // 📋 Récupérer toutes les bornes
  @Get()
  findAll() {
    return this.bornesService.findAll();
  }

  // 🔍 Récupérer une borne spécifique
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bornesService.findOne(id);
  }

  // ✏️ Mettre à jour une borne
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBorneDto: UpdateBorneDto,
  ) {
    return this.bornesService.update(id, updateBorneDto);
  }

  // ❌ Supprimer une borne
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bornesService.remove(id);
  }
}
