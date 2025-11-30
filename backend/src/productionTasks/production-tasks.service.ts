import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskEventType, ProductionStatus } from '@prisma/client';

@Injectable()
export class ProductionTasksService {
  constructor(private prisma: PrismaService) {}

  findByProduction(productionId: number) {
    return this.prisma.productionTask.findMany({
      where: { productionId },
      orderBy: { id: 'asc' },
      include: {
        assignedTo: true,
        template: {
          include: {
            pieces: { include: { piece: true } },
            sousAssemblages: { include: { sousAssemblage: true } },
            sousSousAssemblages: {
              include: { sousSousAssemblage: true },
            },
          },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });
  }

  // ✅ toutes les tâches de prod NON terminées
	// ✅ toutes les tâches de prod NON terminées + estimation du temps
findOpen() {
  return this.prisma.$transaction(async (tx) => {
    // ---------------------------
    // 1) Tâches ouvertes
    // ---------------------------
    const openTasks = await tx.productionTask.findMany({
      where: {
        isDone: false,
      },
      orderBy: [{ productionId: 'asc' }, { id: 'asc' }],
      include: {
        assignedTo: true,
        production: {
          include: {
            lines: true, // ← important pour compter les machines
          },
        },
        template: {
          include: {
            pieces: { include: { piece: true } },
            sousAssemblages: { include: { sousAssemblage: true } },
            sousSousAssemblages: { include: { sousSousAssemblage: true } },
          },
        },
      },
    });

    // aucun template → pas de stats
    const templateIds = Array.from(
      new Set(
        openTasks
          .map((t) => t.taskTemplateId)
          .filter((id): id is number => id != null)
      )
    );

    if (templateIds.length === 0) {
      return openTasks.map((t) => ({
        ...t,
        avgSecondsPerMachine: null,
        estimatedSecondsTotal: null,
        machinesCount: null,
      }));
    }

    // ---------------------------
    // 2) Historique des tâches terminées
    // ---------------------------
    const history = await tx.productionTask.findMany({
      where: {
        isDone: true,
        taskTemplateId: { in: templateIds },
        totalSeconds: { gt: 0 },
      },
      include: {
        production: { include: { lines: true } },
        template: {
          include: {
            pieces: { include: { piece: true } },
            sousAssemblages: { include: { sousAssemblage: true } },
            sousSousAssemblages: {
              include: { sousSousAssemblage: true },
            },
          },
        },
      },
    });

    // ---------------------------
    // 3) Calcul des moyennes / machine par template
    // ---------------------------
    const stats: Record<number, { sumPerMachine: number; count: number }> = {};

    for (const h of history) {
      if (!h.taskTemplateId || !h.template) continue;

      const borneId = h.template.borneId;
      let machines = 1;

      if (borneId != null) {
        const m = h.production.lines
          .filter((l) => l.borneId === borneId)
          .reduce((sum, l) => sum + l.quantity, 0);

        machines = m > 0 ? m : 1;
      }

      // temps par machine
      const perMachine = h.totalSeconds / machines;
      const key = h.taskTemplateId;

      if (!stats[key]) {
        stats[key] = { sumPerMachine: 0, count: 0 };
      }

      stats[key].sumPerMachine += perMachine;
      stats[key].count++;
    }

    // ---------------------------
    // 4) Ajouter les estimations aux tâches ouvertes
    // ---------------------------
    const enriched = openTasks.map((task) => {
      const tplId = task.taskTemplateId;
      if (!tplId || !stats[tplId]) {
        return {
          ...task,
          avgSecondsPerMachine: null,
          estimatedSecondsTotal: null,
          machinesCount: null,
        };
      }

      const { sumPerMachine, count } = stats[tplId];
      const avgSecondsPerMachine = Math.round(sumPerMachine / count);

      // machines de la production actuelle
      let machinesCurrent = 1;
      if (task.template?.borneId != null) {
        const m = task.production.lines
          .filter((l) => l.borneId === task.template!.borneId)
          .reduce((sum, l) => sum + l.quantity, 0);

        machinesCurrent = m > 0 ? m : 1;
      }

      const estimatedSecondsTotal = Math.round(
        avgSecondsPerMachine * machinesCurrent
      );

      return {
        ...task,
        avgSecondsPerMachine,
        estimatedSecondsTotal,
        machinesCount: machinesCurrent,
      };
    });

    return enriched;
  });
}

  async findOne(id: number) {
    const task = await this.prisma.productionTask.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        template: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });
    if (!task) throw new NotFoundException(`ProductionTask ${id} introuvable`);
    return task;
  }

  private async logEvent(
    productionTaskId: number,
    eventType: TaskEventType,
    userId?: number | null,
    note?: string | null,
  ) {
    return this.prisma.productionTaskLog.create({
      data: {
        productionTaskId,
        eventType,
        userId: userId ?? null,
        note: note ?? null,
      },
    });
  }

  // Assigner un monteur
  async assignTask(taskId: number, userId: number | null) {
    const task = await this.findOne(taskId);

    const updated = await this.prisma.productionTask.update({
      where: { id: taskId },
      data: {
        assignedToId: userId,
      },
    });

    await this.logEvent(
      taskId,
      TaskEventType.ASSIGNED,
      userId ?? undefined,
      null,
    );

    return updated;
  }

  // Démarrer / reprendre le chrono
  async startTask(taskId: number, userId?: number) {
    const task = await this.prisma.productionTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Tâche introuvable');

    if (task.running) {
      throw new BadRequestException('Le chrono est déjà en cours pour cette tâche');
    }

    const updated = await this.prisma.productionTask.update({
      where: { id: taskId },
      data: {
        running: true,
        lastStartedAt: new Date(),
      },
    });

    await this.logEvent(taskId, TaskEventType.STARTED, userId, null);

    return updated;
  }

  // Mettre en pause le chrono
  async pauseTask(taskId: number, userId?: number) {
    const task = await this.prisma.productionTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Tâche introuvable');

    if (!task.running || !task.lastStartedAt) {
      throw new BadRequestException('La tâche n’est pas en cours');
    }

    const now = new Date();
    const diffMs = now.getTime() - task.lastStartedAt.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    const updated = await this.prisma.productionTask.update({
      where: { id: taskId },
      data: {
        running: false,
        lastStartedAt: null,
        totalSeconds: task.totalSeconds + diffSec,
      },
    });

    await this.logEvent(taskId, TaskEventType.PAUSED, userId, null);

    return updated;
  }

  // Marquer comme terminée
  async completeTask(taskId: number, userId?: number) {
    const task = await this.prisma.productionTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Tâche introuvable');

    let totalSeconds = task.totalSeconds;

    if (task.running && task.lastStartedAt) {
      const now = new Date();
      const diffMs = now.getTime() - task.lastStartedAt.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      totalSeconds += diffSec;
    }

    const updated = await this.prisma.productionTask.update({
      where: { id: taskId },
      data: {
        isDone: true,
        running: false,
        lastStartedAt: null,
        totalSeconds,
      },
    });

    await this.logEvent(taskId, TaskEventType.COMPLETED, userId, null);

    return updated;
  }

  // Réouvrir une tâche terminée
  async reopenTask(taskId: number, userId?: number) {
    const task = await this.prisma.productionTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Tâche introuvable');

    const updated = await this.prisma.productionTask.update({
      where: { id: taskId },
      data: {
        isDone: false,
      },
    });

    await this.logEvent(taskId, TaskEventType.REOPENED, userId, null);

    return updated;
  }

  async resetTime(taskId: number, userId?: number) {
    const task = await this.prisma.productionTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Tâche introuvable');

    const updated = await this.prisma.productionTask.update({
      where: { id: taskId },
      data: {
        totalSeconds: 0,
        running: false,
        lastStartedAt: null,
      },
    });

    // on log un event (tu peux changer le type / note si tu veux)
    await this.logEvent(
      taskId,
      TaskEventType.PAUSED,
      userId,
      'Reset du temps',
    );

    return updated;
  }
}
