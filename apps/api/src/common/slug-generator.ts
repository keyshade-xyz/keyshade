import { PrismaService } from '@/prisma/prisma.service'

/**
 * Generates the base slug from the given name.
 *
 * @param name The name of the entity.
 * @returns The base slug.
 */
const generateBaseSlug = (name: string): string => {
  // Convert to lowercase
  const lowerCaseName = name.trim().toLowerCase()

  // Replace spaces with hyphens
  const hyphenatedName = lowerCaseName.replace(/\s+/g, '-')

  // Replace all non-alphanumeric characters with hyphens
  const alphanumericName = hyphenatedName.replace(/[^a-zA-Z0-9-]/g, '-')

  return alphanumericName
}

const convertEntityTypeToCamelCase = (entityType: string): string => {
  return entityType
    .toLowerCase() 
    .split('_')  
    .map((word, index) => 
      index === 0 
        ? word  // First word stays lowercase
        : word.charAt(0).toUpperCase() + word.slice(1) // Capitalize the first letter of subsequent words
    )
    .join('');
};

const incrementSlugSuffix = (suffix: string): string => {
  const charset = '0123456789abcdefghijklmnopqrstuvwxyz'; 

  if (!suffix) {
    return '0';
  }

  let result = '';
  let carry = true;

  for (let i = suffix.length - 1; i >= 0; i--) {
    if (carry) {
      const currentChar = suffix[i];
      const index = charset.indexOf(currentChar);

      if (index === -1) {
        throw new Error(`Invalid character in slug suffix: ${currentChar}`);
      }
      const nextIndex = (index + 1) % charset.length;
      result = charset[nextIndex] + result;

      // Carry over if we wrapped around to '0'
      carry = nextIndex === 0;
    } else {
      // No carry, just append the remaining part of the suffix
      result = suffix[i] + result;
    }
  }

  if (carry) {
    result = '0' + result;
  }

  return result;
};

/**
 * Generates a unique slug for the given entity type and name.
 * It queries existing slugs, determines the highest suffix, and generates a new unique slug.
 *
 * @param name The name of the entity.
 * @param entityType The type of the entity.
 * @param prisma The Prisma client to use.
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
  const baseSlug = generateBaseSlug(name)

  const existingSlugs = await prisma[convertEntityTypeToCamelCase(entityType)].findMany({
    where: {
      slug: {
        startsWith: baseSlug
      }
    },
    orderBy: {
      slug: 'desc'
    }
  });

  let highestSuffix = '';

  if (existingSlugs.length > 0) {
    for (const item of existingSlugs) {
      const slug = item.slug;
      const suffix = slug.substring(baseSlug.length + 1);

      if (suffix > highestSuffix) {
        highestSuffix = suffix;
      }
    }
  }

  // Increment the highest suffix to generate the new unique slug
  const newSuffix = incrementSlugSuffix(highestSuffix);
  const uniqueSlug = `${baseSlug}-${newSuffix}`;

  return uniqueSlug;
}
