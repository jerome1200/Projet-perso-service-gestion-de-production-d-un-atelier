import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SousAssemblageService {
  constructor(private prisma: PrismaService) {}

  // ⚙️ borneId optionnel : si présent, on filtre sur la relation bornes
  async findAll(borneId?: number) {
    return this.prisma.sousAssemblage.findMany({
      where: {
        ...(borneId
          ? {
              bornes: {
                some: { id: borneId },
              },
            }
          : {}),
        // éventuellement :
        // archived: false,
      },
      orderBy: { nom: 'asc' },
      include: {
        pieces: {
          include: { piece: true },
        },
        bornes: true,
        sousSousAssemblages: {
          include: { sousSousAssemblage: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const SA = await this.prisma.sousAssemblage.findUnique({
      where: { id },
      include: {
        pieces: {
          include: { piece: true },
        },
        bornes: true,
        sousSousAssemblages: {
          include: { sousSousAssemblage: true },
        },
      },
    });

    if (!SA) {
      throw new NotFoundException(
        `Aucun sous-assemblage trouvé avec l'ID ${id}`,
      );
    }

    return SA;
  }

  // create avec support borneIds[] (multi) + borneId (compat éventuelle)
  async create(data: any) {
    const { borneIds, borneId, ...rest } = data;

    const connectBornes =
      Array.isArray(borneIds) && borneIds.length > 0
        ? borneIds.map((id: number) => ({ id: Number(id) }))
        : typeof borneId === 'number'
        ? [{ id: Number(borneId) }]
        : [];

    if (connectBornes.length === 0) {
      throw new HttpException(
        'Au moins une borne doit être associée au sous-assemblage.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.prisma.sousAssemblage.create({
        data: {
          ...rest,
          bornes: {
            connect: connectBornes,
          },
        },
        include: {
          pieces: {
            include: { piece: true },
          },
          bornes: true,
          sousSousAssemblages: {
            include: { sousSousAssemblage: true },
          },
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
      borneIds: number[];
    }>,
  ) {
    const { borneIds, ...rest } = data;

    return this.prisma.sousAssemblage.update({
      where: { id },
      data: {
        ...rest,
        ...(Array.isArray(borneIds)
          ? {
              bornes: {
                set: borneIds.map((bId) => ({ id: Number(bId) })),
              },
            }
          : {}),
      },
      include: {
        pieces: {
          include: { piece: true },
        },
        bornes: true,
        sousSousAssemblages: {
          include: { sousSousAssemblage: true },
        },
      },
    });
  }

  async delete(id: number) {
    // nettoyage des liens SA–SSA + SA–pièces
    await this.prisma.sousAssemblageSousSousAssemblage.deleteMany({
      where: { sousAssemblageId: id },
    });

    await this.prisma.sousAssemblagePiece.deleteMany({
      where: { sousAssemblageId: id },
    });

    return this.prisma.sousAssemblage.delete({ where: { id } });
  }

  async archive(id: number) {
    return this.prisma.sousAssemblage.update({
      where: { id },
      data: { archived: true },
    });
  }

  async unarchive(id: number) {
    return this.prisma.sousAssemblage.update({
      where: { id },
      data: { archived: false },
    });
  }

  async searchByName(query: string) {
    return this.prisma.sousAssemblage.findMany({
      where: {
        OR: [
          { nom: { contains: query, mode: 'insensitive' } },
          { reference: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        pieces: {
          include: { piece: true },
        },
        bornes: true,
        sousSousAssemblages: {
          include: { sousSousAssemblage: true },
        },
      },
      take: 5,
    });
  }
}
