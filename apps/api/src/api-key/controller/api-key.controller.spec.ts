import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyController } from './api-key.controller';

describe('ApiKeyController', () => {
  let controller: ApiKeyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeyController],
    }).compile();

    controller = module.get<ApiKeyController>(ApiKeyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
