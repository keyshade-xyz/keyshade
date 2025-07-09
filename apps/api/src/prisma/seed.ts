import { PrismaClient, ProjectAccessLevel, AuthProvider } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { Logger } from '@nestjs/common'
import { sEncrypt } from '@/common/cryptography'
import { generateReferralCode } from '@/common/util'

const prisma = new PrismaClient()

async function main() {
  const logger = new Logger('DB Seeder')
  // @ts-expect-error -- false alarm
  if (process.env.NODE_ENV === 'dev') {
    logger.log('Database seeding started')

    const userEmail = process.env.FEEDBACK_FORWARD_EMAIL

    // Create user
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        referralCode: await generateReferralCode(prisma),
        name: faker.person.fullName(),
        isActive: true,
        isOnboardingFinished: true,
        isAdmin: true,
        authProvider: AuthProvider.EMAIL_OTP
      }
    })

    // Create workspace first
    const workspace = await prisma.workspace.create({
      data: {
        id: faker.string.uuid(),
        name: faker.company.name(),
        isFreeTier: true,
        createdAt: new Date(),
        ownerId: user.id,
        isDefault: true,
        slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
        blacklistedIpAddresses: []
      }
    })

    // Create workspace role
    const workspaceRole = await prisma.workspaceRole.create({
      data: {
        id: faker.string.uuid(),
        name: 'Admin',
        colorCode: '#FF0000',
        hasAdminAuthority: true,
        createdAt: new Date(),
        authorities: ['WORKSPACE_ADMIN'],
        workspaceId: workspace.id,
        slug: 'admin'
      }
    })

    // Create workspace member
    const workspaceMember = await prisma.workspaceMember.create({
      data: {
        id: faker.string.uuid(),
        userId: user.id,
        workspaceId: workspace.id,
        invitationAccepted: true,
        createdOn: new Date()
      }
    })

    // Associate role with member
    await prisma.workspaceMemberRoleAssociation.create({
      data: {
        id: faker.string.uuid(),
        roleId: workspaceRole.id,
        workspaceMemberId: workspaceMember.id
      }
    })

    // Create two projects
    const projects = await Promise.all([
      prisma.project.create({
        data: {
          name: 'Private Keys Project',
          slug: 'private-keys',
          description: 'Project for storing private keys',
          createdAt: new Date(),
          publicKey: faker.string.alphanumeric(32),
          privateKey: sEncrypt(faker.string.alphanumeric(32)),
          storePrivateKey: true,
          workspaceId: workspace.id,
          accessLevel: ProjectAccessLevel.PRIVATE,
          isForked: false,
          workspaceRoles: {
            create: {
              roleId: workspaceRole.id
            }
          }
        }
      }),
      prisma.project.create({
        data: {
          name: 'Global Config Project',
          slug: 'global-config',
          description: 'Project for global configuration',
          createdAt: new Date(),
          publicKey: faker.string.alphanumeric(32),
          privateKey: sEncrypt(faker.string.alphanumeric(32)),
          storePrivateKey: false,
          workspaceId: workspace.id,
          accessLevel: ProjectAccessLevel.GLOBAL,
          workspaceRoles: {
            create: {
              roleId: workspaceRole.id
            }
          }
        }
      })
    ])

    // Create environments for each project
    const environments = await Promise.all(
      projects.flatMap((project) =>
        ['development', 'staging', 'production'].map(async (envName, index) => {
          return prisma.environment.create({
            data: {
              id: faker.string.uuid(),
              name: envName,
              slug: `${envName}-${index}`,
              description: `${envName} environment for ${project.name}`,
              createdAt: new Date(),
              lastUpdatedById: user.id,
              projectId: project.id
            }
          })
        })
      )
    )

    // Create secrets and variables for each project
    for (const project of projects) {
      const projectEnvironments = environments.filter(
        (env) => env.projectId === project.id
      )
      for (const env of projectEnvironments) {
        // Create 5 secrets for each environment
        for (let i = 0; i < 5; i++) {
          const secretName = faker.word.words(2)
          const secretSlug = faker.helpers.slugify(secretName).toLowerCase()
          const secretValue = faker.string.alphanumeric(32)

          const secret = await prisma.secret.create({
            data: {
              id: faker.string.uuid(),
              name: secretName,
              slug: secretSlug,
              note: faker.lorem.sentence(),
              createdAt: new Date(),
              lastUpdatedById: user.id,
              projectId: project.id,
              versions: {
                create: {
                  id: faker.string.uuid(),
                  value: secretValue,
                  createdById: user.id,
                  environmentId: env.id
                }
              }
            }
          })

          // Create 2 more versions for each secret
          for (let j = 1; j < 3; j++) {
            await prisma.secretVersion.create({
              data: {
                id: faker.string.uuid(),
                secretId: secret.id,
                value: faker.string.alphanumeric(32),
                createdById: user.id,
                environmentId: env.id
              }
            })
          }
        }

        // Create 5 variables for each environment
        for (let i = 0; i < 5; i++) {
          const varName = faker.word.words(2)
          const varSlug = faker.helpers.slugify(varName).toLowerCase()
          const varValue = faker.string.alphanumeric(32)

          const variable = await prisma.variable.create({
            data: {
              id: faker.string.uuid(),
              name: varName,
              slug: varSlug,
              note: faker.lorem.sentence(),
              createdAt: new Date(),
              lastUpdatedById: user.id,
              projectId: project.id,
              versions: {
                create: {
                  id: faker.string.uuid(),
                  value: varValue,
                  createdById: user.id,
                  environmentId: env.id
                }
              }
            }
          })

          // Create 2 more versions for each variable
          for (let j = 1; j < 3; j++) {
            await prisma.variableVersion.create({
              data: {
                id: faker.string.uuid(),
                variableId: variable.id,
                value: faker.string.alphanumeric(32),
                createdById: user.id,
                environmentId: env.id
              }
            })
          }
        }
      }
    }

    logger.log('Database seeded successfully')
  } else {
    logger.log('Seed script will only run in development mode')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
