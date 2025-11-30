// src/task-templates/task-templates.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskEventType } from '@prisma/client';
import { ProductionsService } from '../productions/productions.service';

type CreateTaskTemplateInput = {
  borneId?: number | null;
  label: string;
  description?: string;
  order?: number;
  pieces?: { pieceId: number; quantity: number }[];
  sousAssemblages?: { sousAssemblageId: number; quantity: number }[];
  sousSousAssemblages?: { sousSousAssemblageId: number; quantity: number }[];
};

type UpdateTaskTemplateInput = Partial<{
  label: string;
  description: string;
  order: number;
  active: boolean;
  borneId: number | null;
  pieces: { pieceId: number; quantity: number }[];
  sousAssemblages: { sousAssemblageId: number; quantity: number }[];
  sousSousAssemblages: { sousSousAssemblageId: number; quantity: number }[];
}>;


@Injectable()
export class TaskTemplatesService {
  constructor(
    private prisma: PrismaService,
    private productionsService: ProductionsService, // 👈 injection
  ) {}

  private includeDefault = {
    borne: true,
    pieces: {
      include: {
        piece: true,
      },
    },
    sousAssemblages: {
      include: {
        sousAssemblage: true,
      },
    },
    sousSousAssemblages: {
      include: {
        sousSousAssemblage: true,
      },
    },
  };

  async findAll(borneId?: number | null) {
    try {
      return await this.prisma.taskTemplate.findMany({
        where:
          borneId === undefined
            ? {}
            : borneId === null
            ? { borneId: null }
            : { borneId },
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        include: this.includeDefault,
      });
    } catch (e) {
      console.error('Erreur Prisma findAll taskTemplates:', e);
      throw e;
    }
  }

  async create(data: CreateTaskTemplateInput) {
    const {
      borneId,
      label,
      description,
      order,
      pieces,
      sousAssemblages,
      sousSousAssemblages,
    } = data;

    const template = await this.prisma.taskTemplate.create({
      data: {
        label,
        description: description || null,
        order: order ?? null,
        borneId: borneId ?? null,
      },
    });

    const promises: Promise<any>[] = [];

    if (pieces?.length) {
      promises.push(
        this.prisma.taskTemplatePiece.createMany({
          data: pieces.map((p) => ({
            taskTemplateId: template.id,
            pieceId: p.pieceId,
            quantity: p.quantity ?? 1,
          })),
        }),
      );
    }

    if (sousAssemblages?.length) {
      promises.push(
        this.prisma.taskTemplateSousAssemblage.createMany({
          data: sousAssemblages.map((sa) => ({
            taskTemplateId: template.id,
            sousAssemblageId: sa.sousAssemblageId,
            quantity: sa.quantity ?? 1,
          })),
        }),
      );
    }

    if (sousSousAssemblages?.length) {
      promises.push(
        this.prisma.taskTemplateSousSousAssemblage.createMany({
          data: sousSousAssemblages.map((ssa) => ({
            taskTemplateId: template.id,
            sousSousAssemblageId: ssa.sousSousAssemblageId,
            quantity: ssa.quantity ?? 1,
          })),
        }),
      );
    }

    await Promise.all(promises);

    // 🔥 rétroactivité : si la tâche est liée à une borne,
    // on met à jour toutes les productions PLANNED / IN_PROGRESS qui utilisent cette borne
    if (borneId != null) {
      await this.productionsService.syncAllOpenProductionsForBorne(borneId);
    }

    return this.prisma.taskTemplate.findUnique({
      where: { id: template.id },
      include: this.includeDefault,
    });
  }

  async update(id: number, data: UpdateTaskTemplateInput) {
	// 1) On récupère l’existant
	const exists = await this.prisma.taskTemplate.findUnique({
		where: { id },
		include: {
		pieces: true,
		sousAssemblages: true,
		sousSousAssemblages: true,
		},
	});

	if (!exists) {
		throw new NotFoundException('TaskTemplate introuvable');
	}

	const previousBorneId = exists.borneId;
	const labelBefore = exists.label;

	// 2) On met à jour les champs "simples"
	const updated = await this.prisma.taskTemplate.update({
		where: { id },
		data: {
		label: data.label ?? undefined,
		description: data.description ?? undefined,
		order: data.order ?? undefined,
		active: data.active ?? undefined,
		borneId: data.borneId ?? undefined, // tu peux commenter si tu ne veux pas changer la borne ici
		},
		include: this.includeDefault,
	});

	// 3) Mise à jour des liens PIECES / SA / SSA
	// On ne touche que si le front nous envoie les tableaux (≠ undefined)

	// --- PIECES ---
	if (data.pieces !== undefined) {
		await this.prisma.taskTemplatePiece.deleteMany({
		where: { taskTemplateId: id },
		});

		if (data.pieces.length > 0) {
		await this.prisma.taskTemplatePiece.createMany({
			data: data.pieces.map((p) => ({
			taskTemplateId: id,
			pieceId: p.pieceId,
			quantity: p.quantity ?? 1,
			})),
		});
		}
	}

	// --- SA ---
	if (data.sousAssemblages !== undefined) {
		await this.prisma.taskTemplateSousAssemblage.deleteMany({
		where: { taskTemplateId: id },
		});

		if (data.sousAssemblages.length > 0) {
		await this.prisma.taskTemplateSousAssemblage.createMany({
			data: data.sousAssemblages.map((sa) => ({
			taskTemplateId: id,
			sousAssemblageId: sa.sousAssemblageId,
			quantity: sa.quantity ?? 1,
			})),
		});
		}
	}

	// --- SSA ---
	if (data.sousSousAssemblages !== undefined) {
		await this.prisma.taskTemplateSousSousAssemblage.deleteMany({
		where: { taskTemplateId: id },
		});

		if (data.sousSousAssemblages.length > 0) {
		await this.prisma.taskTemplateSousSousAssemblage.createMany({
			data: data.sousSousAssemblages.map((ssa) => ({
			taskTemplateId: id,
			sousSousAssemblageId: ssa.sousSousAssemblageId,
			quantity: ssa.quantity ?? 1,
			})),
		});
	  }
  }

	// 4) Propagation du label sur les tâches de prod existantes (optionnel mais pratique)
	if (data.label && data.label.trim() && data.label !== labelBefore) {
		await this.prisma.productionTask.updateMany({
		where: {
			taskTemplateId: id,
			// si tu veux aussi renommer les DONE, enlève la condition isDone
			// isDone: false,
		},
		data: {
			label: data.label.trim(),
		},
		});
	}

	// 5) Rétroactivité sur les productions ouvertes pour cette borne
	// Si tu autorises à changer la borne, on gère ancienne + nouvelle
	const borneIdsToSync = new Set<number>();

	if (previousBorneId != null) {
		borneIdsToSync.add(previousBorneId);
	}
	if (updated.borneId != null && updated.borneId !== previousBorneId) {
		borneIdsToSync.add(updated.borneId);
	}

	for (const bId of borneIdsToSync) {
		await this.productionsService.syncAllOpenProductionsForBorne(bId);
	}

	return updated;
	}


  async delete(id: number) {
    const exists = await this.prisma.taskTemplate.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('TaskTemplate introuvable');
    }

    await this.prisma.taskTemplatePiece.deleteMany({
      where: { taskTemplateId: id },
    });
    await this.prisma.taskTemplateSousAssemblage.deleteMany({
      where: { taskTemplateId: id },
    });
    await this.prisma.taskTemplateSousSousAssemblage.deleteMany({
      where: { taskTemplateId: id },
    });

    return this.prisma.taskTemplate.delete({ where: { id } });
  }

  // 🔹 log d'exécution d'une tâche générique
  async logExecution(
    taskTemplateId: number,
    userId?: number | null,
    note?: string | null,
  ) {
    const tpl = await this.prisma.taskTemplate.findUnique({
      where: { id: taskTemplateId },
    });
    if (!tpl) {
      throw new NotFoundException(`TaskTemplate ${taskTemplateId} introuvable`);
    }

    return this.prisma.taskTemplateLog.create({
      data: {
        taskTemplateId,
        userId: userId ?? null,
        eventType: TaskEventType.COMPLETED,
        note: note ?? null,
      },
      include: { user: true, taskTemplate: true },
    });
  }

  async findLogs(taskTemplateId: number) {
    return this.prisma.taskTemplateLog.findMany({
      where: { taskTemplateId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
      take: 20,
    });
  }

  async findAllUntypedWithLogs() {
    return this.prisma.taskTemplate.findMany({
      where: { borneId: null, active: true },
      orderBy: { label: 'asc' },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
          take: 10,
        },
      },
    });
  }
}
