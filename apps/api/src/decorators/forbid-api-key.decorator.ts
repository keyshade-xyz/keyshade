import { SetMetadata } from '@nestjs/common'

export const FORBID_API_KEY = 'forbid-api-key'

export const ForbidApiKey = () => SetMetadata(FORBID_API_KEY, true)
