// src/task-templates/task-templates.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TaskTemplatesService } from './task-templates.service';

@Controller('task-templates')
export class TaskTemplatesController {
  constructor(private readonly service: TaskTemplatesService) {}

  @Get()
  findAll(
    @Query('borneId') borneId?: string,
    @Query('untyped') untyped?: string,
    @Query('withLogs') withLogs?: string,
  ) {
    // 👉 cas pour la page d'attribution : modèles non typés + logs
    if (untyped === '1' && withLogs === '1') {
      return this.service.findAllUntypedWithLogs();
    }

    // 👉 cas existant : filtrage par borneId
    if (borneId === undefined) {
      return this.service.findAll();
    }

    if (borneId === 'null' || borneId === '') {
      return this.service.findAll(null);
    }

    const parsed = Number(borneId);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('borneId invalide');
    }

    return this.service.findAll(parsed);
  }

  @Post()
  create(
    @Body()
    body: {
      borneId?: number | null;
      label: string;
      description?: string;
      order?: number;
      pieces?: { pieceId: number; quantity: number }[];
      sousAssemblages?: { sousAssemblageId: number; quantity: number }[];
      sousSousAssemblages?: {
        sousSousAssemblageId: number;
        quantity: number;
      }[];
    },
  ) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      label?: string;
      description?: string;
      order?: number;
      active?: boolean;
    },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }

  // 📌 créer un log pour une tâche générique
  @Post(':id/logs')
  logExecution(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId?: number | null; note?: string | null },
  ) {
    return this.service.logExecution(id, body.userId ?? null, body.note ?? null);
  }

  // (optionnel) récupérer seulement les logs
  @Get(':id/logs')
  getLogs(@Param('id', ParseIntPipe) id: number) {
    return this.service.findLogs(id);
  }
}
