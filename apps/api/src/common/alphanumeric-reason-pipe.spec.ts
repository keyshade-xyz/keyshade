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

  it('should not allow strings with only spaces', () => {
    expect(() => pipe.transform('   ')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for non-alphanumeric string', () => {
    const invalidInput = 'Test123$%^';
    try {
      pipe.transform(invalidInput);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.message).toBe('Reason must contain only alphanumeric characters and no leading or trailing spaces.');
    }
  });
});
