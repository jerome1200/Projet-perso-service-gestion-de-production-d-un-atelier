import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductionStatus } from '@prisma/client';

@Injectable()
export class ProductionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    nom: string;
    reference?: string | null;
    description?: string | null;
    dueDate?: string | null; // ISO string
    lines: { borneId: number; quantity: number }[];
  }) {
    if (!data.lines || data.lines.length === 0) {
      throw new HttpException(
        'Une production doit contenir au moins une ligne (borne + quantité).',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const created = await this.prisma.production.create({
        data: {
          nom: data.nom,
          reference: data.reference ?? null,
          description: data.description ?? null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: ProductionStatus.PLANNED,
          lines: {
            create: data.lines.map((l) => ({
              borneId: l.borneId,
              quantity: l.quantity,
            })),
          },
        },
        include: {
          lines: { include: { borne: true } },
        },
      });

      // ✅ Générer les tâches à partir des TaskTemplate des bornes utilisées
      const borneIds = Array.from(
        new Set(created.lines.map((l) => l.borneId)),
      );

      const templates = await this.prisma.taskTemplate.findMany({
        where: {
          active: true,
          borneId: { in: borneIds },
        },
        orderBy: [{ borneId: 'asc' }, { order: 'asc' }, { id: 'asc' }],
      });

      if (templates.length > 0) {
        await this.prisma.productionTask.createMany({
          data: templates.map((tpl) => ({
            productionId: created.id,
            taskTemplateId: tpl.id,
            label: tpl.label,
            description: tpl.description ?? null,
          })),
        });
      }

      // renvoyer la prod complète avec tâches
      return this.findOne(created.id);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new HttpException(
          'Référence de production déjà utilisée.',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

findAll(params?: { status?: ProductionStatus }) {
  return this.prisma.production.findMany({
    where: params?.status ? { status: params.status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      lines: { include: { borne: true } },
      tasks: {
        include: {
          assignedTo: true,
          template: {
            include: {
              pieces: { include: { piece: true } },
              sousAssemblages: { include: { sousAssemblage: true } },
              sousSousAssemblages: { include: { sousSousAssemblage: true } },
            },
          },
        },
      },
    },
  });
}

  async findOne(id: number) {
    const prod = await this.prisma.production.findUnique({
      where: { id },
      include: {
        lines: { include: { borne: true } },
        tasks: {
          include: {
            assignedTo: true,
            template: true,
            logs: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: { user: true },
            },
          },
        },
      },
    });

    if (!prod) {
      throw new NotFoundException(`Production ${id} introuvable`);
    }

    return prod;
  }

  async update(
    id: number,
    data: Partial<{
      nom: string;
      reference: string | null;
      description: string | null;
      dueDate: string | null;
      status: ProductionStatus;
    }>,
  ) {
    await this.findOne(id);

    return this.prisma.production.update({
      where: { id },
      data: {
        nom: data.nom,
        reference: data.reference,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.status,
      },
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    // dépendances (tasks, lines) supprimées via onDelete CASCADE si défini,
    // sinon tu peux deleteMany ici
    await this.prisma.productionTaskLog.deleteMany({
      where: { productionTask: { productionId: id } },
    });
    await this.prisma.productionTask.deleteMany({
      where: { productionId: id },
    });
    await this.prisma.productionLine.deleteMany({
      where: { productionId: id },
    });

    return this.prisma.production.delete({ where: { id } });
  }

  async syncTasksFromTemplates(productionId: number) {
    const production = await this.prisma.production.findUnique({
      where: { id: productionId },
      include: {
        lines: true,
        tasks: true,
      },
    });
    if (!production) {
      throw new NotFoundException(`Production ${productionId} introuvable`);
    }

    const borneIds = production.lines.map((l) => l.borneId);

    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        active: true,
        borneId: { in: borneIds },
      },
    });

    const existingTemplateIds = new Set(
      production.tasks
        .map((t) => t.taskTemplateId)
        .filter((id): id is number => id != null),
    );

    const toCreate = templates.filter((tpl) => !existingTemplateIds.has(tpl.id));

    if (toCreate.length > 0) {
      await this.prisma.productionTask.createMany({
        data: toCreate.map((tpl) => ({
          productionId: production.id,
          taskTemplateId: tpl.id,
          label: tpl.label,
          description: tpl.description ?? null,
        })),
      });
    }

    return this.findOne(productionId);
  }

  // 🔥 NOUVELLE MÉTHODE : pour un borneId, sync toutes les prods ouvertes
  async syncAllOpenProductionsForBorne(borneId: number) {
    // productions encore "vivantes" qui ont cette borne dans leurs lignes
    const prods = await this.prisma.production.findMany({
      where: {
        status: { in: [ProductionStatus.PLANNED, ProductionStatus.IN_PROGRESS] },
        lines: {
          some: { borneId },
        },
      },
      select: { id: true },
    });

    for (const p of prods) {
      await this.syncTasksFromTemplates(p.id);
    }
  }
}
