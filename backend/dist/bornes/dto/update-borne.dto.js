"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBorneDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_borne_dto_1 = require("./create-borne.dto");
class UpdateBorneDto extends (0, mapped_types_1.PartialType)(create_borne_dto_1.CreateBorneDto) {
}
exports.UpdateBorneDto = UpdateBorneDto;
//# sourceMappingURL=update-borne.dto.js.map