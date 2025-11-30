import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorneDto } from './dto/create-borne.dto';
import { UpdateBorneDto } from './dto/update-borne.dto';

@Injectable()
export class BornesService {
  constructor(private prisma: PrismaService) {}

  // ➕ Créer une borne
  async create(data: CreateBorneDto) {
	return this.prisma.borne.create({ data });
  }


  // 📋 Récupérer toutes les bornes
  findAll() {
    return this.prisma.borne.findMany();
  }

  // 🔍 Récupérer une borne par ID
  findOne(id: number) {
    return this.prisma.borne.findUnique({ where: { id } });
  }

  // ✏️ Mettre à jour une borne
  update(id: number, data: UpdateBorneDto) {
    return this.prisma.borne.update({
      where: { id },
      data,
    });
  }

  // ❌ Supprimer une borne
  remove(id: number) {
    return this.prisma.borne.delete({ where: { id } });
  }
}
