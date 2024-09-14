import { PrismaService } from '@/prisma/prisma.service'
import generateEntitySlug, {
  generateSlugName,
  incrementSlugSuffix
} from './slug-generator'
import { mockDeep } from 'jest-mock-extended'

describe('generateEntitySlug', () => {
  let prisma

  beforeEach(() => {
    prisma = mockDeep<PrismaService>()
  })

  describe('generateSlugName', () => {
    it('should convert name to slug format', () => {
      expect(generateSlugName('Hello World')).toBe('hello-world')
      expect(generateSlugName('Entity with 123')).toBe('entity-with-123')
      expect(generateSlugName('Special #Name!')).toBe('special-name')
    })
  })

  describe('incrementSlugSuffix', () => {
    it('should return base slug with `-0` when no suffix is found', () => {
      const result = incrementSlugSuffix('', 'my-slug')
      expect(result).toBe('my-slug-0')
    })

    it('should increment suffix when found', () => {
      const result = incrementSlugSuffix('my-slug-0', 'my-slug')
      expect(result).toBe('my-slug-1')
    })

    it('should handle complex increment cases with carryover', () => {
      const result = incrementSlugSuffix('my-slug-z', 'my-slug')
      expect(result).toBe('my-slug-00')
    })
  })

  describe('generateEntitySlug for each entity type', () => {
    it('should generate a unique slug for WORKSPACE_ROLE', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          slug: 'workspace-role-0'
        }
      ])

      const slug = await generateEntitySlug(
        'Workspace Role',
        'WORKSPACE_ROLE',
        prisma
      )
      expect(slug).toBe('workspace-role-1')
    })

    it('should generate a unique slug for WORKSPACE', async () => {
      prisma.$queryRaw.mockResolvedValue([])

      const slug = await generateEntitySlug('Workspace', 'WORKSPACE', prisma)
      expect(slug).toBe('workspace-0')
    })

    it('should generate a unique slug for PROJECT', async () => {
      prisma.$queryRaw.mockResolvedValue([{ slug: 'project-z' }])

      const slug = await generateEntitySlug('Project', 'PROJECT', prisma)
      expect(slug).toBe('project-00')
    })

    it('should generate a unique slug for VARIABLE', async () => {
      prisma.$queryRaw.mockResolvedValue([{ slug: 'variable-az' }])

      const slug = await generateEntitySlug('Variable', 'VARIABLE', prisma)
      expect(slug).toBe('variable-b0')
    })

    it('should generate a unique slug for SECRET', async () => {
      prisma.$queryRaw.mockResolvedValue([{ slug: 'secret-9' }])

      const slug = await generateEntitySlug('Secret', 'SECRET', prisma)
      expect(slug).toBe('secret-a')
    })

    it('should generate a unique slug for INTEGRATION', async () => {
      prisma.$queryRaw.mockResolvedValue([{ slug: 'integration-b' }])

      const slug = await generateEntitySlug(
        'Integration',
        'INTEGRATION',
        prisma
      )
      expect(slug).toBe('integration-c')
    })

    it('should generate a unique slug for ENVIRONMENT', async () => {
      prisma.$queryRaw.mockResolvedValue([{ slug: 'environment-zz' }])

      const slug = await generateEntitySlug(
        'Environment',
        'ENVIRONMENT',
        prisma
      )
      expect(slug).toBe('environment-000')
    })

    it('should generate a unique slug for API_KEY', async () => {
      prisma.$queryRaw.mockResolvedValue([{ slug: 'api-key-09' }])

      const slug = await generateEntitySlug('Api @Key', 'API_KEY', prisma)
      expect(slug).toBe('api-key-0a')
    })
  })
})
