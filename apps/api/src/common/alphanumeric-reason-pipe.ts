import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AlphanumericReasonValidationPipe implements PipeTransform {
  transform(value: any): string {
    if (typeof value === 'string' && /^[a-zA-Z0-9\s]*$/.test(value)) {
      return value;
    }
    throw new BadRequestException('Reason must only contain alphanumeric characters and spaces.');
  }
}
