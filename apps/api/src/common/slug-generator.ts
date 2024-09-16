import { PrismaService } from '@/prisma/prisma.service'
import { Workspace } from '@prisma/client'

export const incrementSlugSuffix = (
  existingSlug: string,
  baseSlug: string
): string => {
  const charset = '0123456789abcdefghijklmnopqrstuvwxyz'

  let suffix = ''

  if (existingSlug) {
    suffix = existingSlug.substring(baseSlug.length + 1)
  }

  if (!suffix) {
    return `${baseSlug}-0`
  }

  let result = ''
  let carry = true

  for (let i = suffix.length - 1; i >= 0; i--) {
    if (carry) {
      const currentChar = suffix[i]
      const index = charset.indexOf(currentChar)

      if (index === -1) {
        throw new Error(`Invalid character in slug suffix: ${currentChar}`)
      }
      const nextIndex = (index + 1) % charset.length
      result = charset[nextIndex] + result

      // Carry over if we wrapped around to '0'
      carry = nextIndex === 0
    } else {
      // No carry, just append the remaining part of the suffix
      result = suffix[i] + result
    }
  }

  if (carry) {
    result = '0' + result
  }

  return `${baseSlug}-${result}`
}

/**
 * Generates a slug for the given name. It keeps generating slugs until it finds
 * one that does not exist in the database.
 *
 * @param name The name of the entity.
 * @returns A alphanumeric slug for the given name.
 */
export const generateSlugName = (name: string): string => {
  // Convert to lowercase
  const lowerCaseName = name.trim().toLowerCase()

  // Replace spaces with hyphens
  const hyphenatedName = lowerCaseName.replace(/\s+/g, '-')

  // Replace all non-alphanumeric characters with hyphens
  const alphanumericName = hyphenatedName.replace(/[^a-zA-Z0-9-]/g, '')

  return alphanumericName
}

const getWorkspaceRoleIfSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<string> => {
  const search = `${slug}-[a-z0-9]*`
  const existingSlug: { slug: string }[] = await prisma.$queryRaw<
    { slug: string }[]
  >`
    SELECT slug
    FROM "WorkspaceRole"
    WHERE slug ~ ${search}
    ORDER BY slug DESC
    LIMIT 1
  `
  return existingSlug.length > 0 ? existingSlug[0].slug : ''
}

const getWorkspaceSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<string> => {
  const search = `${slug}-[a-z0-9]*`
  const existingSlug = await prisma.$queryRaw<{ slug: string }[]>`
    SELECT slug
    FROM "Workspace"
    WHERE slug ~ ${search}
    ORDER BY slug DESC
    LIMIT 1
  `
  return existingSlug.length > 0 ? existingSlug[0].slug : ''
}

const getProjectSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<string> => {
  const search = `${slug}-[a-z0-9]*`
  const existingSlug = await prisma.$queryRaw<{ slug: string }[]>`
    SELECT slug
    FROM "Project"
    WHERE slug ~ ${search}
    ORDER BY slug DESC
    LIMIT 1
  `
  return existingSlug.length > 0 ? existingSlug[0].slug : ''
}

const getVariableSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<string> => {
  const search = `${slug}-[a-z0-9]*`
  const existingSlug = await prisma.$queryRaw<{ slug: string }[]>`
    SELECT slug
    FROM "Variable"
    WHERE slug ~ ${search}
    ORDER BY slug DESC
    LIMIT 1
  `
  return existingSlug.length > 0 ? existingSlug[0].slug : ''
}

const getSecretSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<string> => {
  const search = `${slug}-[a-z0-9]*`
  const existingSlug = await prisma.$queryRaw<{ slug: string }[]>`
    SELECT slug
    FROM "Secret"
    WHERE slug ~ ${search}
    ORDER BY slug DESC
    LIMIT 1
  `
  return existingSlug.length > 0 ? existingSlug[0].slug : ''
}

const getIntegrationSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<string> => {
  const search = `${slug}-[a-z0-9]*`
  const existingSlug = await prisma.$queryRaw<{ slug: string }[]>`
    SELECT slug
    FROM "Integration"
    WHERE slug ~ ${search}
    ORDER BY slug DESC
    LIMIT 1
  `
  return existingSlug.length > 0 ? existingSlug[0].slug : ''
}

const getEnvironmentSlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<string> => {
  const search = `${slug}-[a-z0-9]*`
  const existingSlug = await prisma.$queryRaw<{ slug: string }[]>`
    SELECT slug
    FROM "Environment"
    WHERE slug ~ ${search}
    ORDER BY slug DESC
    LIMIT 1
  `
  return existingSlug.length > 0 ? existingSlug[0].slug : ''
}

const getApiKeySlugExists = async (
  slug: Workspace['slug'],
  prisma: PrismaService
): Promise<string> => {
  const search = `${slug}-[a-z0-9]*`
  const existingSlug = await prisma.$queryRaw<{ slug: string }[]>`
    SELECT slug
    FROM "ApiKey"
    WHERE slug ~ ${search}
    ORDER BY slug DESC
    LIMIT 1
  `
  return existingSlug.length > 0 ? existingSlug[0].slug : ''
}

/**
 * Generates a slug for the given name and entity type. It keeps generating slugs until it finds
 * one that does not exist in the database.
 *
 * @param name The name of the entity.
 * @param entityType The type of the entity.
 * @returns A alphanumeric slug for the given name.
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
  const baseSlug = generateSlugName(name)
  let existingSlug = ''
  switch (entityType) {
    case 'WORKSPACE_ROLE':
      existingSlug = await getWorkspaceRoleIfSlugExists(baseSlug, prisma)
      break
    case 'WORKSPACE':
      existingSlug = await getWorkspaceSlugExists(baseSlug, prisma)
      break
    case 'PROJECT':
      existingSlug = await getProjectSlugExists(baseSlug, prisma)
      break
    case 'VARIABLE':
      existingSlug = await getVariableSlugExists(baseSlug, prisma)
      break
    case 'SECRET':
      existingSlug = await getSecretSlugExists(baseSlug, prisma)
      break
    case 'INTEGRATION':
      existingSlug = await getIntegrationSlugExists(baseSlug, prisma)
      break
    case 'ENVIRONMENT':
      existingSlug = await getEnvironmentSlugExists(baseSlug, prisma)
      break
    case 'API_KEY':
      existingSlug = await getApiKeySlugExists(baseSlug, prisma)
      break
  }
  return incrementSlugSuffix(existingSlug, baseSlug)
}
