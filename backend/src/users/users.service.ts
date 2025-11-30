import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ✅ Création utilisateur (rôle "DEFAULT" par défaut)
  async create(
    email: string,
    password: string,
    role: 'USER' | 'ADMIN' | 'DEFAULT' = 'DEFAULT',
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { email, password: hashedPassword, role },
    });
  }

  // ✅ Récupère un utilisateur par email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // ✅ Vérifie la validité d’un utilisateur
  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result; // retourne tout sauf le mdp
    }
    return null;
  }

  // ✅ Récupère tous les utilisateurs (pour la page Admin)
  async findAll() {
    return this.prisma.user.findMany({
      select: {
		id: true,
		email: true,
		nom: true,
		role: true,
		createdAt: true },
    });
  }

  // ✅ Met à jour le rôle d’un utilisateur
  async updateRole(id: number, role: Role) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  // users.service.ts
  async updateName(id: number, nom: string) {
	return this.prisma.user.update({
		where: { id },
		data: { nom },
	});
  }

}
