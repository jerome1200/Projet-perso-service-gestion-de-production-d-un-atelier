"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const bornes_controller_1 = require("./bornes.controller");
const bornes_service_1 = require("./bornes.service");
describe('BornesController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [bornes_controller_1.BornesController],
            providers: [bornes_service_1.BornesService],
        }).compile();
        controller = module.get(bornes_controller_1.BornesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=bornes.controller.spec.js.map