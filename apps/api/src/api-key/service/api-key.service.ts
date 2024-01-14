import { Inject, Injectable } from '@nestjs/common'
import {
  API_KEY_REPOSITORY,
  IApiKeyRepository
} from '../repository/interface.repository'
import {
  IProjectRepository,
  PROJECT_REPOSITORY
} from '../../project/repository/interface.repository'
import {
  IUserRepository,
  USER_REPOSITORY
} from '../../user/repository/interface.repository'
import { ApiKeyProjectRole, Project, User } from '@prisma/client'
// import { CreateApiKey } from '../dto/create.api-key/create.api-key'
import { ProjectPermission } from '../../project/misc/project.permission'

@Injectable()
export class ApiKeyService {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    private readonly projectPermissionService: ProjectPermission,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository
  ) {}

  async getPermissableScopesOfProjecr(user: User, projectId: Project['id']) {
    const roles: ApiKeyProjectRole[] = []

    if (this.projectPermissionService.isProjectMember(user, projectId)) {
      roles.push(
        ...[
          ApiKeyProjectRole.READ_PROJECT,
          ApiKeyProjectRole.READ_SECRET,
          ApiKeyProjectRole.READ_ENVIRONMENT
        ]
      )
    }
  }

  // async createApiKey(user: User, dto: CreateApiKey) {
  //   // For each project scope, check if the user has the required roles to perform the action.
  // }
}
