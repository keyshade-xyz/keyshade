import { NonEmptyTrimmedString } from '@/decorators/non-empty-trimmed-string.decorator'

export class Entry {
  @NonEmptyTrimmedString()
  environmentSlug: string

  @NonEmptyTrimmedString()
  value: string
}
