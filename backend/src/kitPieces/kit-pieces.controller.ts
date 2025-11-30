import { Controller, Post, Get, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { KitPiecesService } from './kit-pieces.service';

@Controller('kit-pieces')
export class KitPiecesController {
  constructor(private readonly kitPiecesService: KitPiecesService) {}

  // ➕ Ajouter une pièce dans un kit
  @Post()
  addPiece(@Body() data: { kitId: number; pieceId: number; nombre: number }) {
    return this.kitPiecesService.addPieceToKit(data);
  }

  // 🧾 Récupérer toutes les pièces d’un kit
  @Get(':kitId')
  getPieces(@Param('kitId', ParseIntPipe) kitId: number) {
    return this.kitPiecesService.getPiecesForKit(kitId);
  }

  // ✏️ Modifier la quantité d’une pièce dans un kit
  @Patch(':kitId/:pieceId')
  updateQuantity(
    @Param('kitId', ParseIntPipe) kitId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
    @Body('nombre', ParseIntPipe) nombre: number,
  ) {
    return this.kitPiecesService.updateQuantity(kitId, pieceId, nombre);
  }
  
  // 🗑 Supprimer toutes les pièces d’un kit
  @Delete('all/:kitId')
  removeAll(@Param('kitId', ParseIntPipe) kitId: number) {
	return this.kitPiecesService.removeAllPiecesFromKit(kitId);
  }

  // ❌ Supprimer une pièce d’un kit
  @Delete(':kitId/:pieceId')
  remove(@Param('kitId', ParseIntPipe) kitId: number, @Param('pieceId', ParseIntPipe) pieceId: number) {
    return this.kitPiecesService.removePieceFromKit(kitId, pieceId);
  }


}
