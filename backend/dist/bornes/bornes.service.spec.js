"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const bornes_service_1 = require("./bornes.service");
describe('BornesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [bornes_service_1.BornesService],
        }).compile();
        service = module.get(bornes_service_1.BornesService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=bornes.service.spec.js.map