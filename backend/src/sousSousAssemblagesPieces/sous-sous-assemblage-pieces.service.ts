import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SousSousAssemblagePiecesService {
  constructor(private prisma: PrismaService) {}

  // ➕ Ajouter une pièce à un sous-sous-assemblage
  async addPieceToSousSousAssemblage(data: { sousSousAssemblageId: number; pieceId: number; nombre: number }) {
    const { sousSousAssemblageId, pieceId, nombre } = data;

    const [ssa, piece] = await Promise.all([
      this.prisma.sousSousAssemblage.findUnique({ where: { id: sousSousAssemblageId } }),
      this.prisma.piece.findUnique({ where: { id: pieceId } }),
    ]);

    if (!ssa) throw new NotFoundException(`Sous-sous-assemblage ${sousSousAssemblageId} introuvable`);
    if (!piece) throw new NotFoundException(`Pièce ${pieceId} introuvable`);

    const existing = await this.prisma.sousSousAssemblagePiece.findUnique({
      where: { sousSousAssemblageId_pieceId: { sousSousAssemblageId, pieceId } },
    });

    if (existing) {
      throw new HttpException('Cette pièce est déjà liée à ce sous-sous-assemblage.', HttpStatus.CONFLICT);
    }

    return this.prisma.sousSousAssemblagePiece.create({
      data: {
        sousSousAssemblageId,
        pieceId,
        nombre,
      },
    });
  }

  // 🧾 Récupérer les pièces d’un sous-sous-assemblage
  async getPiecesForSousSousAssemblage(sousSousAssemblageId: number) {
    const ssa = await this.prisma.sousSousAssemblage.findUnique({
      where: { id: sousSousAssemblageId },
      include: {
        pieces: {
          include: { piece: true },
        },
      },
    });

    if (!ssa) throw new NotFoundException(`Sous-sous-assemblage ${sousSousAssemblageId} introuvable`);
    return ssa.pieces;
  }

  // ✏️ Modifier la quantité d’une pièce liée à un sous-sous-assemblage
  async updateQuantity(sousSousAssemblageId: number, pieceId: number, nombre: number) {
    const existing = await this.prisma.sousSousAssemblagePiece.findUnique({
      where: { sousSousAssemblageId_pieceId: { sousSousAssemblageId, pieceId } },
    });

    if (!existing)
      throw new NotFoundException(
        `La pièce ${pieceId} n’est pas liée au sous-sous-assemblage ${sousSousAssemblageId}`,
      );

    return this.prisma.sousSousAssemblagePiece.update({
      where: { sousSousAssemblageId_pieceId: { sousSousAssemblageId, pieceId } },
      data: { nombre },
    });
  }

  // ❌ Supprimer une pièce d’un sous-sous-assemblage
  async removePieceFromSousSousAssemblage(sousSousAssemblageId: number, pieceId: number) {
    const existing = await this.prisma.sousSousAssemblagePiece.findUnique({
      where: { sousSousAssemblageId_pieceId: { sousSousAssemblageId, pieceId } },
    });

    if (!existing)
      throw new NotFoundException(
        `La pièce ${pieceId} n’est pas liée au sous-sous-assemblage ${sousSousAssemblageId}`,
      );

    await this.prisma.sousSousAssemblagePiece.delete({
      where: { sousSousAssemblageId_pieceId: { sousSousAssemblageId, pieceId } },
    });

    return { message: 'Pièce supprimée du sous-sous-assemblage avec succès.' };
  }

  async removeAllPiecesFromSousSousAssemblage(sousSousAssemblageId: number) {
	await this.prisma.sousSousAssemblagePiece.deleteMany({
    	where: { sousSousAssemblageId },
	});

	return { message: `Toutes les pièces du sous-sous-assemblage ${sousSousAssemblageId} ont été supprimées.` };
  }
}
