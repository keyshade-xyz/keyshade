import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AlphanumericReasonValidationPipe implements PipeTransform {
  transform(value: string) {
  if (/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(value)) {
    return value;
  } else {
    throw new BadRequestException('Reason must contain only alphanumeric characters and no leading or trailing spaces.');
  }
}
}
