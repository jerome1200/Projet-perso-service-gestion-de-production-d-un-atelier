import { Controller, Post, Get, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { SousSousAssemblagePiecesService } from './sous-sous-assemblage-pieces.service';

@Controller('sous-sous-assemblage-pieces')
export class SousSousAssemblagePiecesController {
  constructor(private readonly ssaPiecesService: SousSousAssemblagePiecesService) {}

  // ➕ Ajouter une pièce dans un SSA
  @Post()
  addPiece(@Body() data: { sousSousAssemblageId: number; pieceId: number; nombre: number }) {
    return this.ssaPiecesService.addPieceToSousSousAssemblage(data);
  }

  // 🧾 Lister les pièces d’un SSA
  @Get(':sousSousAssemblageId')
  getPieces(@Param('sousSousAssemblageId', ParseIntPipe) sousSousAssemblageId: number) {
    return this.ssaPiecesService.getPiecesForSousSousAssemblage(sousSousAssemblageId);
  }

  // ✏️ Modifier la quantité d’une pièce dans un SSA
  @Patch(':sousSousAssemblageId/:pieceId')
  updateQuantity(
    @Param('sousSousAssemblageId', ParseIntPipe) sousSousAssemblageId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
    @Body('nombre', ParseIntPipe) nombre: number,
  ) {
    return this.ssaPiecesService.updateQuantity(sousSousAssemblageId, pieceId, nombre);
  }

  @Delete('all/:sousSousAssemblageId')
  removeAll(@Param('sousSousAssemblageId', ParseIntPipe) sousSousAssemblageId: number) {
	return this.ssaPiecesService.removeAllPiecesFromSousSousAssemblage(sousSousAssemblageId);
  }
  
  // ❌ Supprimer une pièce d’un SSA
  @Delete(':sousSousAssemblageId/:pieceId')
  remove(
    @Param('sousSousAssemblageId', ParseIntPipe) sousSousAssemblageId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
  ) {
    return this.ssaPiecesService.removePieceFromSousSousAssemblage(sousSousAssemblageId, pieceId);
  }


}
