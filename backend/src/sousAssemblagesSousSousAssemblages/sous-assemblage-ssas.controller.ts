import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { SousAssemblageSsasService } from './sous-assemblage-ssas.service';

@Controller('sous-assemblage-ssas')
export class SousAssemblageSsasController {
  constructor(private readonly service: SousAssemblageSsasService) {}

  // POST /sous-assemblage-ssas
  @Post()
  create(
    @Body()
    data: {
      sousAssemblageId: number;
      sousSousAssemblageId: number;
      nombre?: number;
    },
  ) {
    return this.service.create(data);
  }

  // PATCH /sous-assemblage-ssas/:id   (pour changer le nombre)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: { nombre?: number },
  ) {
    return this.service.update(+id, data);
  }

  // DELETE /sous-assemblage-ssas/:id
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(+id);
  }

  // GET /sous-assemblage-ssas/by-sa/:id
  @Get('by-sa/:id')
  findBySousAssemblage(@Param('id') id: string) {
    return this.service.findBySousAssemblage(+id);
  }

  // GET /sous-assemblage-ssas/by-ssa/:id
  @Get('by-ssa/:id')
  findBySousSousAssemblage(@Param('id') id: string) {
    return this.service.findBySousSousAssemblage(+id);
  }
}
