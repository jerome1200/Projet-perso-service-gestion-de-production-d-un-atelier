import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { SousAssemblageService } from './sous-assemblage.service';

@Controller('sous-assemblages')
export class SousAssemblageController {
  constructor(private readonly service: SousAssemblageService) {}

  @Get()
  findAll(@Query('borneId') borneId?: string) {
    return this.service.findAll(
      borneId ? Number(borneId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(+id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.service.archive(+id);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.service.unarchive(+id);
  }

  @Get('search/:query')
  search(@Param('query') query: string) {
    return this.service.searchByName(query);
  }
}
