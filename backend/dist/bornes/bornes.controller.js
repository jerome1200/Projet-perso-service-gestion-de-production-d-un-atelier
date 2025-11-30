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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BornesController = void 0;
const common_1 = require("@nestjs/common");
const bornes_service_1 = require("./bornes.service");
const create_borne_dto_1 = require("./dto/create-borne.dto");
const update_borne_dto_1 = require("./dto/update-borne.dto");
let BornesController = class BornesController {
    constructor(bornesService) {
        this.bornesService = bornesService;
    }
    // ➕ Créer une borne
    create(createBorneDto) {
        return this.bornesService.create(createBorneDto);
    }
    // 📋 Récupérer toutes les bornes
    findAll() {
        return this.bornesService.findAll();
    }
    // 🔍 Récupérer une borne spécifique
    findOne(id) {
        return this.bornesService.findOne(id);
    }
    // ✏️ Mettre à jour une borne
    update(id, updateBorneDto) {
        return this.bornesService.update(id, updateBorneDto);
    }
    // ❌ Supprimer une borne
    remove(id) {
        return this.bornesService.remove(id);
    }
};
exports.BornesController = BornesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_borne_dto_1.CreateBorneDto]),
    __metadata("design:returntype", void 0)
], BornesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BornesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], BornesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_borne_dto_1.UpdateBorneDto]),
    __metadata("design:returntype", void 0)
], BornesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], BornesController.prototype, "remove", null);
exports.BornesController = BornesController = __decorate([
    (0, common_1.Controller)('bornes'),
    __metadata("design:paramtypes", [bornes_service_1.BornesService])
], BornesController);
//# sourceMappingURL=bornes.controller.js.map