import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SousAssemblageSsasService {
  constructor(private prisma: PrismaService) {}

  // 🔹 Créer un lien SA ↔ SSA
  // body attendu :
  // { sousAssemblageId: number, sousSousAssemblageId: number, nombre?: number }
  async create(data: {
    sousAssemblageId: number;
    sousSousAssemblageId: number;
    nombre?: number;
  }) {
    try {
      return await this.prisma.sousAssemblageSousSousAssemblage.create({
        data: {
          sousAssemblageId: Number(data.sousAssemblageId),
          sousSousAssemblageId: Number(data.sousSousAssemblageId),
          nombre: data.nombre ?? 1,
        },
        include: {
          sousAssemblage: true,
          sousSousAssemblage: true,
        },
      });
    } catch (error: any) {
      // conflit de contrainte unique (@@unique([sousAssemblageId, sousSousAssemblageId]))
      if (error.code === 'P2002') {
        throw new HttpException(
          'Ce sous-sous-assemblage est déjà lié à ce sous-assemblage.',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  // 🔹 (optionnel) Modifier juste le nombre
  async update(
    id: number,
    data: {
      nombre?: number;
    },
  ) {
    const link = await this.prisma.sousAssemblageSousSousAssemblage.findUnique({
      where: { id },
    });
    if (!link) {
      throw new NotFoundException(
        `Lien SA-SSA introuvable avec l'ID ${id}`,
      );
    }

    return this.prisma.sousAssemblageSousSousAssemblage.update({
      where: { id },
      data: {
        ...(data.nombre != null ? { nombre: data.nombre } : {}),
      },
    });
  }

  // 🔹 Supprimer un lien
  async delete(id: number) {
    return this.prisma.sousAssemblageSousSousAssemblage.delete({
      where: { id },
    });
  }

  // 🔹 (optionnel) Récupérer tous les SSA d'un SA
  async findBySousAssemblage(sousAssemblageId: number) {
    return this.prisma.sousAssemblageSousSousAssemblage.findMany({
      where: { sousAssemblageId },
      include: {
        sousSousAssemblage: true,
      },
    });
  }

  // 🔹 (optionnel) Récupérer tous les SA qui utilisent un SSA
  async findBySousSousAssemblage(sousSousAssemblageId: number) {
    return this.prisma.sousAssemblageSousSousAssemblage.findMany({
      where: { sousSousAssemblageId },
      include: {
        sousAssemblage: true,
      },
    });
  }
}
