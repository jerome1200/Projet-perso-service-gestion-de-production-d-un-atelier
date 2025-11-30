import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type StockType = 'piece' | 'kit' | 'sousAssemblage' | 'sousSousAssemblage';

@Injectable()
export class StockMovementsService {
  constructor(private prisma: PrismaService) {}

  // 👇 On tape le retour en any pour éviter le union bizarre de Prisma
  private getModel(type: StockType): any {
    switch (type) {
      case 'piece':
        return this.prisma.piece;
      case 'kit':
        return this.prisma.kit;
      case 'sousAssemblage':
        return this.prisma.sousAssemblage;
      case 'sousSousAssemblage':
        return this.prisma.sousSousAssemblage;
      default:
        throw new BadRequestException(`Type inconnu: ${type}`);
    }
  }

  async moveStock(params: {
    type: StockType;
    id: number;
    quantity: number;
    operation: 'ADD' | 'REMOVE';
    userId?: number;
  }) {
    const { type, id, quantity, operation, userId } = params;

    if (quantity <= 0) {
      throw new BadRequestException('La quantité doit être > 0');
    }

    const model = this.getModel(type); // <- any

    const item = await model.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Élément ${type}#${id} introuvable`);
    }

    let newNombre = item.nombre;
    if (operation === 'ADD') {
      newNombre = item.nombre + quantity;
    } else {
      newNombre = item.nombre - quantity;
      if (newNombre < 0) {
        throw new BadRequestException('Le stock ne peut pas être négatif');
      }
    }

    // 🛠 Mise à jour du stock
    await model.update({
      where: { id },
      data: { nombre: newNombre },
    });

    // 🧾 Log du mouvement
    await this.prisma.stockLog.create({
      data: {
        type,
        itemId: id,
        quantity,
        operation,
        userId: userId ?? null,
      },
    });

    return { id, type, oldNombre: item.nombre, newNombre };
  }

async getHistory(type: StockType, id: number, limit = 5) {
  return this.prisma.stockLog.findMany({
    where: { type, itemId: id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          email: true,
        },
      },
    },
  });
}

}
