import { PrismaService } from '@/prisma/prisma.service'
import { Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'

async function generateUniqueSlug(
  name: string,
  model: keyof PrismaClient,
  prisma: PrismaService
): Promise<string> {
  const logger = new Logger('generateUniqueSlug')
  logger.log(`Generating unique slug for ${name} in ${model.toString()}...`)

  const baseSlug = slugify(name, { lower: true, strict: true })
  logger.log(`Generated base slug for ${name}: ${baseSlug}`)

  // Get all slugs that match baseSlug or baseSlug-N
  const existingSlugs = await (prisma[model] as any).findMany({
    where: {
      slug: {
        startsWith: baseSlug
      }
    },
    select: {
      slug: true
    }
  })
  logger.log(`Existing slugs for ${name}: ${existingSlugs.length}`)

  if (existingSlugs.length === 0) {
    return `${baseSlug}-0`
  }

  let max = 0

  for (const existingSlug of existingSlugs) {
    const numericPart = existingSlug.slug.split('-').pop()
    if (numericPart && !isNaN(parseInt(numericPart, 10))) {
      max = Math.max(max, parseInt(numericPart, 10))
    }
  }

  // Increment the max value by 1
  max += 1
  const newSlug = `${baseSlug}-${max}`
  logger.log(`Generated new slug for ${name}: ${newSlug}`)

  // Check if the new slug already exists
  logger.log(`Checking if slug already exists in ${model.toString()}...`)
  const slugExists = await (prisma[model] as any).findFirst({
    where: {
      slug: newSlug
    }
  })

  if (slugExists) {
    // If it exists, call the function recursively to generate a new slug
    logger.log(`Slug ${newSlug} already exists in ${model.toString()}.`)
    return generateUniqueSlug(name, model, prisma)
  } else {
    logger.log(`Slug ${newSlug} is unique in ${model.toString()}.`)
    return newSlug
  }
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
  switch (entityType) {
    case 'WORKSPACE_ROLE':
      return generateUniqueSlug(name, 'workspaceRole', prisma)
    case 'WORKSPACE':
      return generateUniqueSlug(name, 'workspace', prisma)
    case 'PROJECT':
      return generateUniqueSlug(name, 'project', prisma)
    case 'VARIABLE':
      return generateUniqueSlug(name, 'variable', prisma)
    case 'SECRET':
      return generateUniqueSlug(name, 'secret', prisma)
    case 'INTEGRATION':
      return generateUniqueSlug(name, 'integration', prisma)
    case 'ENVIRONMENT':
      return generateUniqueSlug(name, 'environment', prisma)
    case 'API_KEY':
      return generateUniqueSlug(name, 'apiKey', prisma)
  }
}
