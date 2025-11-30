import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Body,
  Query,
} from '@nestjs/common';
import { ProductionTasksService } from './production-tasks.service';

@Controller('production-tasks')
export class ProductionTasksController {
  constructor(private readonly service: ProductionTasksService) {}

  // Liste des tâches pour UNE production (dashboard)
  @Get()
  findByProduction(@Query('productionId') productionId?: string) {
    if (!productionId) {
      return [];
    }
    return this.service.findByProduction(Number(productionId));
  }

  // ✅ toutes les tâches ouvertes (page attribution)
  @Get('open')
  findOpen() {
    return this.service.findOpen();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/assign')
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number | null },
  ) {
    return this.service.assignTask(id, body.userId);
  }

  @Post(':id/start')
  start(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId?: number },
  ) {
    return this.service.startTask(id, body.userId);
  }

  @Post(':id/pause')
  pause(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId?: number },
  ) {
    return this.service.pauseTask(id, body.userId);
  }

  @Post(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId?: number },
  ) {
    return this.service.completeTask(id, body.userId);
  }

  @Post(':id/reopen')
  reopen(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId?: number },
  ) {
    return this.service.reopenTask(id, body.userId);
  }

    @Post(':id/reset-time')
  resetTime(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId?: number },
  ) {
    return this.service.resetTime(id, body.userId);
  }

}
