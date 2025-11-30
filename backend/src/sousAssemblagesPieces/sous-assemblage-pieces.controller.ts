import { Controller, Post, Get, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { SousAssemblagePiecesService } from './sous-assemblage-pieces.service';

@Controller('sous-assemblage-pieces')
export class SousAssemblagePiecesController {
  constructor(private readonly sousAssemblagePiecesService: SousAssemblagePiecesService) {}

  // ➕ Ajouter une pièce dans un SA
  @Post()
  addPiece(@Body() data: { sousAssemblageId: number; pieceId: number; nombre: number }) {
    return this.sousAssemblagePiecesService.addPieceToSousAssemblage(data);
  }

  // 🧾 Lister les pièces d’un SA
  @Get(':sousAssemblageId')
  getPieces(@Param('sousAssemblageId', ParseIntPipe) sousAssemblageId: number) {
    return this.sousAssemblagePiecesService.getPiecesForSousAssemblage(sousAssemblageId);
  }

  // ✏️ Modifier la quantité d’une pièce dans un SA
  @Patch(':sousAssemblageId/:pieceId')
  updateQuantity(
    @Param('sousAssemblageId', ParseIntPipe) sousAssemblageId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
    @Body('nombre', ParseIntPipe) nombre: number,
  ) {
    return this.sousAssemblagePiecesService.updateQuantity(sousAssemblageId, pieceId, nombre);
  }

  @Delete('all/:sousAssemblageId')
  removeAll(@Param('sousAssemblageId', ParseIntPipe) sousAssemblageId: number) {
	return this.sousAssemblagePiecesService.removeAllPiecesFromSousAssemblage(sousAssemblageId);
  }
  // ❌ Supprimer une pièce d’un SA
  @Delete(':sousAssemblageId/:pieceId')
  remove(
    @Param('sousAssemblageId', ParseIntPipe) sousAssemblageId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
  ) {
    return this.sousAssemblagePiecesService.removePieceFromSousAssemblage(sousAssemblageId, pieceId);
  }
}
