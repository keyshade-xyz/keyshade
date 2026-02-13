import { Matches } from 'class-validator'
import { applyDecorators } from '@nestjs/common'

// For names (allows alphanumeric, spaces, hyphens, underscores)
export function IsName() {
  return applyDecorators(
    Matches(/^[a-zA-Z0-9\s\-_]+$/, {
      message:
        'Name can only contain letters, numbers, spaces, hyphens, and underscores'
    })
  )
}

// For names with slashes (for roles like "Developer / Engineer")
export function IsNameWithSlash() {
  return applyDecorators(
    Matches(/^[a-zA-Z0-9\s\-_/]+$/, {
      message:
        'Name can only contain letters, numbers, spaces, hyphens, underscores, and slashes'
    })
  )
}

// For team size (allows numbers, hyphens, plus signs, spaces)
export function IsTeamSize() {
  return applyDecorators(
    Matches(/^[a-zA-Z0-9\s\-+]+$/, {
      message:
        'Team size can only contain letters, numbers, spaces, hyphens, and plus signs'
    })
  )
}

// For descriptions/notes (allows all printable ASCII plus newlines, tabs, carriage returns)
export function IsDescriptive() {
  return applyDecorators(
    Matches(/^[\x20-\x7E\n\r\t]*$/, {
      message: 'Description can only contain printable ASCII characters'
    })
  )
}

// For ASCII strings (allows all printable ASCII plus newlines, tabs, carriage returns)
export function IsASCII() {
  return applyDecorators(
    Matches(/^[\x20-\x7E\n\r\t]+$/, {
      message: 'Value can only contain printable ASCII characters'
    })
  )
}
