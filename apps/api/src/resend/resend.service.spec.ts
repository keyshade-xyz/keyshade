import { Test, TestingModule } from '@nestjs/testing';
import { IResendService } from './services/resend.service.interface';
import { TestResend } from './services/test.resend';

describe('ResendService', () => {
  let service: IResendService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestResend],
    }).compile();

    service = module.get<TestResend>(TestResend);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
