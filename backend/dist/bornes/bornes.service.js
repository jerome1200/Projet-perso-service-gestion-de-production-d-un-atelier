"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BornesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BornesService = class BornesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ➕ Créer une borne
    create(data) {
        return this.prisma.borne.create({
            data: {
                ...data,
                dateInstallation: data.dateInstallation
                    ? new Date(data.dateInstallation)
                    : undefined,
            },
        });
    }
    // 📋 Récupérer toutes les bornes
    findAll() {
        return this.prisma.borne.findMany();
    }
    // 🔍 Récupérer une borne par ID
    findOne(id) {
        return this.prisma.borne.findUnique({ where: { id } });
    }
    // ✏️ Mettre à jour une borne
    update(id, data) {
        return this.prisma.borne.update({
            where: { id },
            data,
        });
    }
    // ❌ Supprimer une borne
    remove(id) {
        return this.prisma.borne.delete({ where: { id } });
    }
};
exports.BornesService = BornesService;
exports.BornesService = BornesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BornesService);
//# sourceMappingURL=bornes.service.js.map