import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class E2ESetup implements OnModuleInit {
  private readonly prisma: PrismaClient
  private readonly logger: Logger = new Logger(E2ESetup.name)

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'e2e') {
      // Clean the DB
      await this.prisma.user.deleteMany()

      // Create admin user
      const adminUser = await this.prisma.user.create({
        data: {
          email: 'admin@keyshade.xyz',
          isActive: true,
          isAdmin: true,
          isOnboardingFinished: true,
          name: 'Admin'
        }
      })
      this.logger.log(`Created admin user: ${adminUser.email}`)

      // Create regular user
      const regularUser = await this.prisma.user.create({
        data: {
          email: 'johndoe@keyshade.xyz',
          isActive: true,
          isAdmin: false,
          isOnboardingFinished: true,
          name: 'John Doe'
        }
      })
      this.logger.log(`Created regular user: ${regularUser.email}`)

      // Create regular user's workspace
      await this.prisma.workspace.create({
        data: {
          name: `My Workspace`,
          description: 'My default workspace',
          ownerId: regularUser.id,
          lastUpdatedBy: {
            connect: {
              id: regularUser.id
            }
          }
        }
      })
    }
  }
}
