import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PieceType, PieceEtat } from '@prisma/client';

@Injectable()
export class PiecesService {
  constructor(private prisma: PrismaService) {}

  // 🧾 Liste de toutes les pièces, avec filtre optionnel sur une borne
  async findAll(borneId?: number) {
    return this.prisma.piece.findMany({
      where: {
        // Si borneId est fourni, on ne prend que les pièces liées à cette borne
        ...(borneId
          ? {
              bornes: {
                some: { id: borneId },
              },
            }
          : {}),
        // si tu veux gérer l'archivage côté listing, tu peux ajouter:
        // archived: false,
      },
      orderBy: { nom: 'asc' },
      include: {
        bornes: true, // pour voir à quelles bornes la pièce est liée
      },
    });
  }

  async findOne(id: number) {
    const piece = await this.prisma.piece.findUnique({
      where: { id },
      include: {
        bornes: true,
      },
    });

    if (!piece) {
      throw new NotFoundException(`Aucune pièce trouvée avec l'ID ${id}`);
    }

    return piece;
  }

  // 💡 create accepte maintenant borneIds[] (multi-borne) ou borneId (legacy)
  async create(data: {
    nom: string;
    reference: string;
    nombre?: number;
    emplacement: string;
    photo?: string;
    seuilAlerte?: number;
    type?: PieceType;
    etat?: PieceEtat;
    version?: string;
    numero?: string | null;
    borneIds?: number[];
    borneId?: number;
  }) {
    const { borneIds, borneId, ...rest } = data;

    // construit la liste des bornes à connecter
    const connectBornes =
      Array.isArray(borneIds) && borneIds.length > 0
        ? borneIds.map((id) => ({ id: Number(id) }))
        : typeof borneId === 'number'
        ? [{ id: Number(borneId) }]
        : [];

    if (connectBornes.length === 0) {
      // front protège déjà ça, mais on sécurise quand même
      throw new HttpException(
        'Au moins une borne doit être associée à la pièce.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.prisma.piece.create({
        data: {
          ...rest,
          bornes: {
            connect: connectBornes,
          },
        },
        include: {
          bornes: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        let message = 'Conflit de contrainte unique.';
        if (field === 'reference') message = 'Référence déjà utilisée';
        else if (field === 'nom') message = 'Nom déjà utilisé';
        throw new HttpException(message, HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  async update(
    id: number,
    data: Partial<{
      nom: string;
      reference: string;
      nombre: number;
      emplacement: string;
      photo?: string;
      archived?: boolean;
      seuilAlerte: number;
      type: PieceType;
      etat: PieceEtat;
      version: string;
      numero: string | null;
      borneIds: number[];
    }>,
  ) {
    const { borneIds, ...rest } = data;

    return this.prisma.piece.update({
      where: { id },
      data: {
        ...rest,
        // si borneIds est fourni, on remplace complètement la liste
        ...(Array.isArray(borneIds)
          ? {
              bornes: {
                set: borneIds.map((bId) => ({ id: Number(bId) })),
              },
            }
          : {}),
      },
      include: {
        bornes: true,
      },
    });
  }

  // 🗑️ Suppression d'une pièce (avec nettoyage des relations)
  async delete(id: number) {
    const piece = await this.prisma.piece.findUnique({ where: { id } });
    if (!piece) throw new NotFoundException(`Pièce ${id} introuvable.`);

    await this.prisma.kitPiece.deleteMany({
      where: { pieceId: id },
    });

    await this.prisma.sousAssemblagePiece.deleteMany({
      where: { pieceId: id },
    });

    await this.prisma.sousSousAssemblagePiece.deleteMany({
      where: { pieceId: id },
    });

    // pour la relation M2M implicite _BornePieces,
    // Prisma gère la suppression des liens avec ON DELETE CASCADE
    return this.prisma.piece.delete({
      where: { id },
    });
  }

  // 🗃️ Archiver / désarchiver
  async archive(id: number) {
    return this.prisma.piece.update({
      where: { id },
      data: { archived: true },
    });
  }

  async unarchive(id: number) {
    return this.prisma.piece.update({
      where: { id },
      data: { archived: false },
    });
  }

  // 🔍 Recherche
  async searchByName(query: string) {
    return this.prisma.piece.findMany({
      where: {
        OR: [
          { nom: { contains: query, mode: 'insensitive' } },
          { reference: { contains: query, mode: 'insensitive' } },
          // { numero: { contains: query, mode: 'insensitive' } }, // optionnel
        ],
      },
      take: 5,
    });
  }
}
