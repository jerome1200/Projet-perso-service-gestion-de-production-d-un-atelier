import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { PiecesService } from './pieces.service';

@Controller('pieces')
export class PiecesController {
  constructor(private readonly piecesService: PiecesService) {}

  @Get()
  findAll(@Query('borneId') borneId?: string) {
    // si borneId est présent on le passe en number, sinon undefined
    return this.piecesService.findAll(
      borneId ? Number(borneId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.piecesService.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.piecesService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.piecesService.update(+id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.piecesService.delete(+id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.piecesService.archive(+id);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.piecesService.unarchive(+id);
  }

  @Get('search/:query')
  search(@Param('query') query: string) {
    return this.piecesService.searchByName(query);
  }
}
