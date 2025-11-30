import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KitPiecesService {
  constructor(private prisma: PrismaService) {}

  // ➕ Ajouter une pièce à un kit
  async addPieceToKit(data: { kitId: number; pieceId: number; nombre: number }) {
    const { kitId, pieceId, nombre } = data;

    // Vérifier que le kit et la pièce existent
    const [kit, piece] = await Promise.all([
      this.prisma.kit.findUnique({ where: { id: kitId } }),
      this.prisma.piece.findUnique({ where: { id: pieceId } }),
    ]);

    if (!kit) throw new NotFoundException(`Kit avec ID ${kitId} introuvable`);
    if (!piece) throw new NotFoundException(`Pièce avec ID ${pieceId} introuvable`);

    // Vérifier si déjà lié
    const existing = await this.prisma.kitPiece.findUnique({
      where: { kitId_pieceId: { kitId, pieceId } },
    });

    if (existing) {
      throw new HttpException('Cette pièce est déjà liée à ce kit.', HttpStatus.CONFLICT);
    }

    return this.prisma.kitPiece.create({
      data: {
        kitId,
        pieceId,
        nombre,
      },
    });
  }

  // 🧾 Récupérer toutes les pièces d’un kit
  async getPiecesForKit(kitId: number) {
    const kit = await this.prisma.kit.findUnique({
      where: { id: kitId },
      include: {
        pieces: {
          include: { piece: true },
        },
      },
    });

    if (!kit) throw new NotFoundException(`Kit avec ID ${kitId} introuvable`);

    return kit.pieces;
  }

  // ✏️ Modifier la quantité d’une pièce liée à un kit
  async updateQuantity(kitId: number, pieceId: number, nombre: number) {
    const existing = await this.prisma.kitPiece.findUnique({
      where: { kitId_pieceId: { kitId, pieceId } },
    });

    if (!existing)
      throw new NotFoundException(`La pièce ${pieceId} n’est pas liée au kit ${kitId}`);

    return this.prisma.kitPiece.update({
      where: { kitId_pieceId: { kitId, pieceId } },
      data: { nombre },
    });
  }

  // ❌ Supprimer une pièce d’un kit
  async removePieceFromKit(kitId: number, pieceId: number) {
    const existing = await this.prisma.kitPiece.findUnique({
      where: { kitId_pieceId: { kitId, pieceId } },
    });

    if (!existing)
      throw new NotFoundException(`La pièce ${pieceId} n’est pas liée au kit ${kitId}`);

    await this.prisma.kitPiece.delete({
      where: { kitId_pieceId: { kitId, pieceId } },
    });

    return { message: 'Pièce supprimée du kit avec succès.' };
  }

  async removeAllPiecesFromKit(kitId: number) {
	await this.prisma.kitPiece.deleteMany({
		where: { kitId },
	});

	return { message: `Toutes les pièces du kit ${kitId} ont été supprimées.` };
  }

}
