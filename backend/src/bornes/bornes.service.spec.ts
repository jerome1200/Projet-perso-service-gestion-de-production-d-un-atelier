import { Test, TestingModule } from '@nestjs/testing';
import { BornesService } from './bornes.service';

describe('BornesService', () => {
  let service: BornesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BornesService],
    }).compile();

    service = module.get<BornesService>(BornesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
