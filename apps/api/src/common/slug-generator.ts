import { PrismaService } from '@/prisma/prisma.service'
import { Workspace } from '@prisma/client'

/**
 * Generates a unique slug for the given name. It keeps generating slugs until it finds
 * one that does not exist in the database.
 *
 * @param name The name of the entity.
 * @returns A unique slug for the given entity.
 */
const generateSlug = (name: string,counter:number): string => {
  // Convert to lowercase
  const lowerCaseName = name.trim().toLowerCase()

  // Replace spaces with hyphens
  const hyphenatedName = lowerCaseName.replace(/\s+/g, '-')

  // Replace all non-alphanumeric characters with hyphens
  const alphanumericName = hyphenatedName.replace(/[^a-zA-Z0-9-]/g, '-')

  // Append the name with 5 alphanumeric characters
  const slug =
    alphanumericName + '-' + counter.toString(36)
  return slug
}

const checkWorkspaceRoleSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<boolean> => {
  return (await prisma.workspaceRole.count({ where: { slug } })) > 0
}

const checkWorkspaceSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<boolean> => {
  return (await prisma.workspace.count({ where: { slug } })) > 0
}

const checkProjectSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<boolean> => {
  return (await prisma.project.count({ where: { slug } })) > 0
}

const checkVariableSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<boolean> => {
  return (await prisma.variable.count({ where: { slug } })) > 0
}

const checkSecretSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<boolean> => {
  return (await prisma.secret.count({ where: { slug } })) > 0
}

const checkIntegrationSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<boolean> => {
  return (await prisma.integration.count({ where: { slug } })) > 0
}

const checkEnvironmentSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<boolean> => {
  return (await prisma.environment.count({ where: { slug } })) > 0
}

const checkApiKeySlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<boolean> => {
  return (await prisma.apiKey.count({ where: { slug } })) > 0
}

/**
 * Generates a unique slug for the given entity type and name. It keeps
 * generating slugs until it finds one that does not exist in the database.
 *
 * @param name The name of the entity.
 * @param entityType The type of the entity.
 * @param prisma The Prisma client to use to check the existence of the slug.
 * @returns A unique slug for the given entity.
 */
export default async function generateEntitySlug(
  name: string,
  entityType:
    | 'WORKSPACE_ROLE'
    | 'WORKSPACE'
    | 'PROJECT'
    | 'VARIABLE'
    | 'SECRET'
    | 'INTEGRATION'
    | 'ENVIRONMENT'
    | 'API_KEY',
  prisma: PrismaService
): Promise<string> {
  let counter=0
  while (true) {
    const slug = generateSlug(name,counter)
    switch (entityType) {
      case 'WORKSPACE_ROLE':
        if (await checkWorkspaceRoleSlugExists(slug, prisma)) {
          counter++
          continue
        }
        return slug
      case 'WORKSPACE':
        if (await checkWorkspaceSlugExists(slug, prisma)) {
          counter++
          continue
        }
        return slug
      case 'PROJECT':
        if (await checkProjectSlugExists(slug, prisma)) {
          counter++
          continue
        }
        return slug
      case 'VARIABLE':
        if (await checkVariableSlugExists(slug, prisma)) {
          counter++
          continue
        }
        return slug
      case 'SECRET':
        if (await checkSecretSlugExists(slug, prisma)) {
          counter++
          continue
        }
        return slug
      case 'INTEGRATION':
        if (await checkIntegrationSlugExists(slug, prisma)) {
          counter++
          continue
        }
        return slug
      case 'ENVIRONMENT':
        if (await checkEnvironmentSlugExists(slug, prisma)) {
          counter++
          continue
        }
        return slug
      case 'API_KEY':
        if (await checkApiKeySlugExists(slug, prisma)) {
          counter++
          continue
        }
        return slug
    }
  }
}
