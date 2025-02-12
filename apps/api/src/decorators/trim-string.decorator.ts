import { Transform } from 'class-transformer'

export function TrimString() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value?.trim() : value
  )
}
