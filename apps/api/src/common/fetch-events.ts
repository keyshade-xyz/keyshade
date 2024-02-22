import { User } from '@prisma/client'
import { NestFastifyApplication } from '@nestjs/platform-fastify'

export default async function fetchEvents(
  app: NestFastifyApplication,
  user: User,
  query?: string
): Promise<any> {
  return app.inject({
    method: 'GET',
    headers: {
      'x-e2e-user-email': user.email
    },
    url: `/event${query ? '?' + query : ''}`
  })
}
