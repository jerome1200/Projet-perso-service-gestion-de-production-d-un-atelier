import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SousAssemblagePiecesService {
  constructor(private prisma: PrismaService) {}

  // ➕ Ajouter une pièce à un sous-assemblage
  async addPieceToSousAssemblage(data: { sousAssemblageId: number; pieceId: number; nombre: number }) {
    const { sousAssemblageId, pieceId, nombre } = data;

    const [sa, piece] = await Promise.all([
      this.prisma.sousAssemblage.findUnique({ where: { id: sousAssemblageId } }),
      this.prisma.piece.findUnique({ where: { id: pieceId } }),
    ]);

    if (!sa) throw new NotFoundException(`Sous-assemblage ${sousAssemblageId} introuvable`);
    if (!piece) throw new NotFoundException(`Pièce ${pieceId} introuvable`);

    const existing = await this.prisma.sousAssemblagePiece.findUnique({
      where: { sousAssemblageId_pieceId: { sousAssemblageId, pieceId } },
    });

    if (existing) {
      throw new HttpException('Cette pièce est déjà liée à ce sous-assemblage.', HttpStatus.CONFLICT);
    }

    return this.prisma.sousAssemblagePiece.create({
      data: {
        sousAssemblageId,
        pieceId,
        nombre,
      },
    });
  }

  // 🧾 Récupérer les pièces d’un sous-assemblage
  async getPiecesForSousAssemblage(sousAssemblageId: number) {
    const sa = await this.prisma.sousAssemblage.findUnique({
      where: { id: sousAssemblageId },
      include: {
        pieces: {
          include: { piece: true },
        },
      },
    });

    if (!sa) throw new NotFoundException(`Sous-assemblage ${sousAssemblageId} introuvable`);
    return sa.pieces;
  }

  // ✏️ Modifier la quantité d’une pièce liée à un sous-assemblage
  async updateQuantity(sousAssemblageId: number, pieceId: number, nombre: number) {
    const existing = await this.prisma.sousAssemblagePiece.findUnique({
      where: { sousAssemblageId_pieceId: { sousAssemblageId, pieceId } },
    });

    if (!existing)
      throw new NotFoundException(`La pièce ${pieceId} n’est pas liée au sous-assemblage ${sousAssemblageId}`);

    return this.prisma.sousAssemblagePiece.update({
      where: { sousAssemblageId_pieceId: { sousAssemblageId, pieceId } },
      data: { nombre },
    });
  }

  // ❌ Supprimer une pièce d’un sous-assemblage
  async removePieceFromSousAssemblage(sousAssemblageId: number, pieceId: number) {
    const existing = await this.prisma.sousAssemblagePiece.findUnique({
      where: { sousAssemblageId_pieceId: { sousAssemblageId, pieceId } },
    });

    if (!existing)
      throw new NotFoundException(`La pièce ${pieceId} n’est pas liée au sous-assemblage ${sousAssemblageId}`);

    await this.prisma.sousAssemblagePiece.delete({
      where: { sousAssemblageId_pieceId: { sousAssemblageId, pieceId } },
    });

    return { message: 'Pièce supprimée du sous-assemblage avec succès.' };
  }

  async removeAllPiecesFromSousAssemblage(sousAssemblageId: number) {
	await this.prisma.sousAssemblagePiece.deleteMany({
		where: { sousAssemblageId },
	});

	return { message: `Toutes les pièces du sous-assemblage ${sousAssemblageId} ont été supprimées.` };
  }

}
