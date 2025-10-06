import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { AuthenticatedUserContext } from '@/auth/auth.types'
import { CreatePatDto } from '@/user/dto/create.pat/create.pat'
import { PersonalAccessTokenResponse } from '@/user/user.types'
import { UpdatePatDto } from '@/user/dto/update.pat/update.pat'
import { PersonalAccessToken, User } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { constructErrorBody } from '@/common/util'
import { TokenService } from '@/common/token.service'
import dayjs from 'dayjs'
import { generateRandomBytes } from '@/common/cryptography'

@Injectable()
export class PersonalAccessTokenService {
  private readonly logger = new Logger(PersonalAccessTokenService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService
  ) {}

  public async createPersonalAccessToken(
    user: AuthenticatedUserContext,
    dto: CreatePatDto
  ): Promise<PersonalAccessTokenResponse> {
    this.logger.log(
      `User ${user.id} attempted to create a PAT with name ${dto.name}`
    )

    // Check if a PAT with the same name already exists
    await this.checkForDuplicatePAT(dto.name, user.id)

    // Generate the token
    const { token, personalAccessToken } =
      await this.tokenService.generatePersonalAccessToken(user.id, dto)

    delete personalAccessToken.hash
    return {
      token,
      ...personalAccessToken
    }
  }

  public async updatePersonalAccessToken(
    user: AuthenticatedUserContext,
    tokenId: PersonalAccessToken['id'],
    dto: UpdatePatDto
  ): Promise<PersonalAccessTokenResponse> {
    this.logger.log(`User ${user.id} attempted to update PAT ${tokenId}`)

    // Fetch the token
    const personalAccessToken = await this.getPersonalAccessToken(
      tokenId,
      user.id
    )

    // Check if the name is unique for the user if a new name is
    // provided, and it doesn't match the name of the existing token
    if (dto.name && personalAccessToken.name !== dto.name) {
      await this.checkForDuplicatePAT(dto.name, user.id)
    }

    // Update the token
    this.logger.log(`Updating PAT ${tokenId}`)
    const updatedPersonalAccessToken =
      await this.prisma.personalAccessToken.update({
        where: {
          id: tokenId
        },
        data: {
          name: dto.name,
          expiresOn: dto.expiresAfterDays
            ? dayjs().add(dto.expiresAfterDays, 'days').toDate()
            : undefined
        }
      })
    this.logger.log(`Updated PAT ${tokenId}`)

    delete updatedPersonalAccessToken.hash
    return updatedPersonalAccessToken
  }

  public async regeneratePersonalAccessToken(
    user: AuthenticatedUserContext,
    tokenId: PersonalAccessToken['id']
  ): Promise<PersonalAccessTokenResponse> {
    this.logger.log(
      `User ${user.id} attempted to regenerate the token of PAT ${tokenId}`
    )

    // Check if the token exists
    await this.getPersonalAccessToken(tokenId, user.id)

    // Generate a new hash
    this.logger.log(`Regenerating token for PAT ${tokenId}`)
    const { plaintext, hash } = generateRandomBytes(32)
    const token = `ks.pat.${plaintext}`

    // Update the PAT
    this.logger.log(`Updating token hash of PAT ${tokenId}`)
    const updatedPersonalAccessToken =
      await this.prisma.personalAccessToken.update({
        where: {
          id: tokenId
        },
        data: {
          hash
        }
      })
    this.logger.log(`Regenerated token for PAT ${tokenId}`)

    delete updatedPersonalAccessToken.hash
    return {
      token,
      ...updatedPersonalAccessToken
    }
  }

  public async getAllPersonalAccessTokens(
    user: AuthenticatedUserContext
  ): Promise<PersonalAccessTokenResponse[]> {
    this.logger.log(`User ${user.id} attempted to get all PATs`)
    const personalAccessTokens = await this.prisma.personalAccessToken.findMany(
      {
        where: {
          userId: user.id
        }
      }
    )
    this.logger.log(`User ${user.id} fetched all PATs`)

    personalAccessTokens.forEach((personalAccessToken) => {
      delete personalAccessToken.hash
    })

    this.logger.log(
      `Fetched ${personalAccessTokens.length} PATs for user ${user.id}`
    )

    return personalAccessTokens
  }

  public async revokePersonalAccessToken(
    user: AuthenticatedUserContext,
    tokenId: PersonalAccessToken['id']
  ): Promise<void> {
    this.logger.log(`User ${user.id} attempted to revoke PAT ${tokenId}`)

    // Check if the PAT exists for the user
    await this.getPersonalAccessToken(tokenId, user.id)

    // Delete the PAT
    this.logger.log(`Deleting PAT ${tokenId}`)
    await this.prisma.personalAccessToken.delete({
      where: {
        id: tokenId
      }
    })
    this.logger.log(`Revoked PAT ${tokenId}`)
  }

  private async getPersonalAccessToken(
    tokenId: PersonalAccessToken['id'],
    userId: User['id']
  ) {
    this.logger.log(`Fetching PAT ${tokenId} for user ${userId}`)
    const personalAccessToken =
      await this.prisma.personalAccessToken.findUnique({
        where: {
          id: tokenId,
          userId
        }
      })
    if (!personalAccessToken) {
      throw new NotFoundException(
        constructErrorBody(
          'Personal access token not found',
          `Personal access token ${tokenId} not found`
        )
      )
    }
    this.logger.log(`Fetched PAT ${tokenId} for user ${userId}`)
    return personalAccessToken
  }

  private async checkForDuplicatePAT(
    name: PersonalAccessToken['name'],
    userId: User['id']
  ) {
    this.logger.log(`Checking if PAT ${name} already exists for user ${userId}`)
    const personalAccessToken =
      await this.prisma.personalAccessToken.findUnique({
        where: {
          name_userId: {
            name,
            userId
          }
        }
      })
    if (personalAccessToken) {
      throw new ConflictException(
        constructErrorBody(
          'Personal access token already exists',
          `A personal access token named ${name} already exists`
        )
      )
    }
    this.logger.log(`PAT ${name} is unique for user ${userId}`)
  }
}
