import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SousSousAssemblageService {
  constructor(private prisma: PrismaService) {}

  // ⚙️ borneId optionnel : filtre par borne si fourni
  async findAll(borneId?: number) {
    return this.prisma.sousSousAssemblage.findMany({
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
      },
    });
  }

  async findOne(id: number) {
    const SSA = await this.prisma.sousSousAssemblage.findUnique({
      where: { id },
      include: {
        pieces: {
          include: { piece: true },
        },
        bornes: true,
      },
    });

    if (!SSA) {
      throw new NotFoundException(
        `Aucun sous-sous-assemblage trouvé avec l'ID ${id}`,
      );
    }

    return SSA;
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
        'Au moins une borne doit être associée au sous-sous-assemblage.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.prisma.sousSousAssemblage.create({
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

    return this.prisma.sousSousAssemblage.update({
      where: { id },
      data: {
        ...rest,
        ...(Array.isArray(borneIds)
          ? {
              bornes: {
                // on remplace complètement les liens de bornes
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
      },
    });
  }

  async delete(id: number) {
    // si tu as une table de jointure sousSousAssemblagePiece :
    // await this.prisma.sousSousAssemblagePiece.deleteMany({ where: { sousSousAssemblageId: id } });

    return this.prisma.sousSousAssemblage.delete({ where: { id } });
  }

  async archive(id: number) {
    return this.prisma.sousSousAssemblage.update({
      where: { id },
      data: { archived: true },
    });
  }

  async unarchive(id: number) {
    return this.prisma.sousSousAssemblage.update({
      where: { id },
      data: { archived: false },
    });
  }

  async searchByName(query: string) {
    return this.prisma.sousSousAssemblage.findMany({
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
      },
      take: 5,
    });
  }
}
