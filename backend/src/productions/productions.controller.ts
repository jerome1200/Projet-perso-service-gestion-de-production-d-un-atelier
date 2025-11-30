import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProductionsService } from './productions.service';
import { ProductionStatus } from '@prisma/client';

@Controller('productions')
export class ProductionsController {
  constructor(private readonly service: ProductionsService) {}

  @Post()
  create(
    @Body()
    body: {
      nom: string;
      reference?: string | null;
      description?: string | null;
      dueDate?: string | null;
      lines: { borneId: number; quantity: number }[];
    },
  ) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.service.findAll({
      status: status
        ? (status as ProductionStatus)
        : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: Partial<{
      nom: string;
      reference: string | null;
      description: string | null;
      dueDate: string | null;
      status: ProductionStatus;
    }>,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }

	@Post(':id/sync-tasks')
	syncTasks(@Param('id', ParseIntPipe) id: number) {
	return this.service.syncTasksFromTemplates(id);
	}

}
