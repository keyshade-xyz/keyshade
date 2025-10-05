import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { PrismaService } from '@/prisma/prisma.service'
import { RawProject } from '@/project/project.types'
import { InclusionQuery } from '@/common/inclusion-query'
import { constructErrorBody } from '@/common/util'
import { Environment, Project, Secret, Variable } from '@prisma/client'

@Injectable()
export class ProjectCacheService {
  private static readonly RAW_PROJECT_PREFIX = 'raw-project-'

  private readonly logger = new Logger(ProjectCacheService.name)

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: { publisher: RedisClientType },
    private readonly prisma: PrismaService
  ) {}

  async getRawProject(projectSlug: Project['slug']): Promise<RawProject> {
    this.logger.log(`Attempting to fetch project ${projectSlug} from cache`)

    const key = this.getRawProjectKey(projectSlug)
    const rawProjectJson = await this.redisClient.publisher.get(key)
    let rawProject: RawProject | null

    if (!rawProjectJson) {
      this.logger.log(
        `Raw project not found in cache for ${projectSlug}. Fetching from database...`
      )

      try {
        rawProject = await this.prisma.project.findUnique({
          where: {
            slug: projectSlug
          },
          include: InclusionQuery.Project
        })
      } catch (error) {
        this.logger.warn(`Project ${projectSlug} not found`)
        throw new NotFoundException(
          constructErrorBody(
            'Project not found',
            `Project ${projectSlug} not found`
          )
        )
      }

      if (!rawProject) {
        this.logger.warn(`Project ${projectSlug} not found`)
        throw new NotFoundException(
          constructErrorBody(
            'Project not found',
            `Project ${projectSlug} not found`
          )
        )
      }

      await this.setRawProject(rawProject)
    } else {
      this.logger.log(`Raw project found in cache for ${projectSlug}`)
      rawProject = JSON.parse(rawProjectJson) as RawProject
    }

    return rawProject
  }

  async setRawProject(rawProject: RawProject) {
    const projectSlug = rawProject.slug
    this.logger.log(`Caching raw project ${projectSlug}`)

    const key = this.getRawProjectKey(projectSlug)
    const rawProjectJson = JSON.stringify(rawProject)
    await this.redisClient.publisher.set(key, rawProjectJson)

    this.logger.log(`Raw project ${projectSlug} cached`)
  }

  async removeProjectCache(projectSlug: RawProject['slug']) {
    this.logger.log(`Removing raw project ${projectSlug} from cache`)

    const key = this.getRawProjectKey(projectSlug)
    await this.redisClient.publisher.del(key)

    this.logger.log(`Raw project ${projectSlug} removed from cache`)
  }

  async addSecretToProjectCache(
    projectSlug: RawProject['slug'],
    secret: Partial<Secret>
  ) {
    this.logger.log(`Adding secret to project ${projectSlug} in cache`)

    const rawProject = await this.getRawProject(projectSlug)
    if (rawProject !== null) {
      rawProject.secrets.push({
        id: secret.id,
        slug: secret.slug
      })
      await this.setRawProject(rawProject)
    }
  }

  async removeSecretFromProjectCache(
    projectSlug: RawProject['slug'],
    secretId: Secret['id']
  ) {
    this.logger.log(
      `Removing secret ${secretId} from project ${projectSlug} in cache`
    )

    const rawProject = await this.getRawProject(projectSlug)
    if (rawProject !== null) {
      rawProject.secrets = rawProject.secrets.filter((s) => s.id !== secretId)
      await this.setRawProject(rawProject)
    }
  }

  async addVariableToProjectCache(
    projectSlug: RawProject['slug'],
    variable: Partial<Variable>
  ) {
    this.logger.log(`Adding variable to project ${projectSlug} in cache`)

    const rawProject = await this.getRawProject(projectSlug)
    if (rawProject !== null) {
      rawProject.variables.push({
        id: variable.id,
        slug: variable.slug
      })
      await this.setRawProject(rawProject)
    }
  }

  async removeVariableFromProjectCache(
    projectSlug: RawProject['slug'],
    variableId: Variable['id']
  ) {
    this.logger.log(
      `Removing variable ${variableId} from project ${projectSlug} in cache`
    )

    const rawProject = await this.getRawProject(projectSlug)
    if (rawProject !== null) {
      rawProject.variables = rawProject.variables.filter(
        (v) => v.id !== variableId
      )
      await this.setRawProject(rawProject)
    }
  }

  async addEnvironmentToProjectCache(
    projectSlug: RawProject['slug'],
    environment: Environment
  ) {
    this.logger.log(
      `Adding environment ${environment} to project ${projectSlug} in cache`
    )

    const rawProject = await this.getRawProject(projectSlug)
    if (rawProject !== null) {
      rawProject.environments.push(environment)
      await this.setRawProject(rawProject)
    }
  }

  async removeEnvironmentFromProjectCache(
    projectSlug: RawProject['slug'],
    environmentId: Environment['id']
  ) {
    this.logger.log(
      `Removing environment ${environmentId} from project ${projectSlug} in cache`
    )

    const rawProject = await this.getRawProject(projectSlug)
    if (rawProject !== null) {
      rawProject.environments = rawProject.environments.filter(
        (e) => e.id !== environmentId
      )
      await this.setRawProject(rawProject)
    }
  }

  private getRawProjectKey(projectSlug: Project['slug']): string {
    return `${ProjectCacheService.RAW_PROJECT_PREFIX}${projectSlug}`
  }
}
