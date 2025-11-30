import { Test, TestingModule } from '@nestjs/testing';
import { BornesController } from './bornes.controller';
import { BornesService } from './bornes.service';

describe('BornesController', () => {
  let controller: BornesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BornesController],
      providers: [BornesService],
    }).compile();

    controller = module.get<BornesController>(BornesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
