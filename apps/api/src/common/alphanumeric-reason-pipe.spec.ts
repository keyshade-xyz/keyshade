import { AlphanumericReasonValidationPipe } from './alphanumeric-reason-pipe';
import { BadRequestException } from '@nestjs/common';

describe('AlphanumericReasonValidationPipe', () => {
  let pipe: AlphanumericReasonValidationPipe;

  beforeEach(() => {
    pipe = new AlphanumericReasonValidationPipe();
  });

  it('should allow alphanumeric string', () => {
    const validInput = 'Test123';
    expect(pipe.transform(validInput)).toBe(validInput);
  });

  it('should throw BadRequestException for non-alphanumeric string', () => {
    const invalidInput = 'Test123$%^';
    try {
      pipe.transform(invalidInput);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.message).toBe('Reason must only contain alphanumeric characters and spaces.');
    }
  });
});
