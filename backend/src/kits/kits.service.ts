import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KitsService {
  constructor(private prisma: PrismaService) {}

  // ⚙️ borneId optionnel : si fourni, on filtre sur la relation bornes
  async findAll(borneId?: number) {
    return this.prisma.kit.findMany({
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
    const kit = await this.prisma.kit.findUnique({
      where: { id },
      include: {
        pieces: {
          include: { piece: true },
        },
        bornes: true,
      },
    });

    if (!kit) {
      throw new NotFoundException(`Aucun kit trouvé avec l'ID ${id}`);
    }

    return kit;
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
        'Au moins une borne doit être associée au kit.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.prisma.kit.create({
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

    return this.prisma.kit.update({
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
    // si tu as une table de jointure kitPiece :
    // await this.prisma.kitPiece.deleteMany({ where: { kitId: id } });

    return this.prisma.kit.delete({ where: { id } });
  }

  async archive(id: number) {
    return this.prisma.kit.update({
      where: { id },
      data: { archived: true },
    });
  }

  async unarchive(id: number) {
    return this.prisma.kit.update({
      where: { id },
      data: { archived: false },
    });
  }

  async searchByName(query: string) {
    return this.prisma.kit.findMany({
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
