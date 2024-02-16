import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'

/**
 * Currently, NestJS doesn't have the inbuilt functionality to transform
 * numeric query parameters to numbers. This pipe is a workaround for that.
 */
@Injectable()
export class QueryTransformPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'query') {
      if (metadata.data === 'limit')
        return isNaN(value) || value === 0 ? 10 : parseInt(value)
      if (metadata.data === 'page') return isNaN(value) ? 0 : parseInt(value)
    }
    return value
  }
}
