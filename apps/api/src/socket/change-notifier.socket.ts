import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import {
  ChangeNotificationEvent,
  ChangeNotifierRegistration
} from './socket.types'
import { Authority } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { Cron, CronExpression } from '@nestjs/schedule'
import { constructErrorBody } from '@/common/util'
import { AuthenticatedUserContext } from '@/auth/auth.types'
import { toSHA256 } from '@/common/cryptography'
import SlugGenerator from '@/common/slug-generator.service' // The redis subscription channel for configuration updates
export const CHANGE_NOTIFIER_RSC = 'configuration-updates'

// This will store the mapping of environmentId -> socketId[]
const ENV_TO_SOCKET_PREFIX = 'env_to_socket:'

@WebSocketGateway({
  namespace: 'change-notifier',
  transports: ['websocket'],
  cors: false
})
export default class ChangeNotifier
  implements OnGatewayDisconnect, OnGatewayConnection, OnGatewayInit
{
  @WebSocketServer() server: Server
  private readonly logger = new Logger(ChangeNotifier.name)
  private readonly redis: RedisClientType
  private readonly redisSubscriber: RedisClientType

  constructor(
    @Inject(REDIS_CLIENT)
    readonly redisClient: {
      subscriber: RedisClientType
      publisher: RedisClientType
    },
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly slugGenerator: SlugGenerator
  ) {
    this.redis = redisClient.publisher
    this.redisSubscriber = redisClient.subscriber
  }

  /**
   * We want the socket gateway to subscribe to the Redis channel.
   * This approach allows us to handle distributed computing where
   * multiple clients can connect to different instances of the API.
   * Any server that will get an update, will publish it to the Redis
   * channel, and all connected clients will receive the update. Out
   * of them, the ones that have sockets registered for the particular
   * environmentId will receive the update.
   */
  async afterInit() {
    this.logger.log('Initializing change notifier socket gateway')
    await this.redisSubscriber.subscribe(
      CHANGE_NOTIFIER_RSC,
      this.notifyConfigurationUpdate.bind(this)
    )
    this.logger.log('Subscribed to configuration update channel')
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}.`)
    this.logger.log(
      `Auth headers - x-keyshade-token: ${client.handshake.headers['x-keyshade-token'] ? 'present' : 'missing'}`
    )
  }

  async handleDisconnect(client: Socket) {
    await this.removeClientFromEnvironment(client)
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  /**
   * This event is emitted from the client app to register
   * itself with our services so that it can receive updates.
   */
  @SubscribeMessage('register-client-app')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChangeNotifierRegistration
  ) {
    /**
     * This event is emitted from the CLI to register
     * itself with our services so that it can receive live updates.
     *
     * The CLI will send a `ChangeNotifierRegistration` object
     * as the message body, containing the workspace slug, project slug,
     * and environment slug that the client app wants to receive updates for.
     *
     * We will then check if the user has access to the workspace,
     * project, and environment, and if so, add the client to the
     * list of connected clients for that environment.
     *
     * Finally, we will send an ACK to the client with a status code of 200.
     */

    this.logger.log(
      `Registering client: ${client.id} for configuration: ${JSON.stringify(
        data
      )}`
    )

    try {
      // First, we need to authenticate the user from the socket connection
      const user = await this.extractAndValidateUser(client)

      // Check if the user has access to the workspace
      this.logger.log('Checking user access to workspace')
      const workspace =
        await this.authorizationService.authorizeUserAccessToWorkspace({
          user,
          slug: data.workspaceSlug,
          authorities: [
            Authority.READ_WORKSPACE,
            Authority.READ_VARIABLE,
            Authority.READ_SECRET
          ]
        })

      if (workspace.isDisabled) {
        this.logger.log(`Workspace ${workspace.slug} is disabled`)
        throw new BadRequestException(
          constructErrorBody(
            'This workspace has been disabled',
            'To use the workspace again, remove the previum resources, or upgrade to a paid plan'
          )
        )
      }

      // Check if the user has access to the project
      this.logger.log(`Checking user access to project ${data.projectSlug}`)
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: data.projectSlug,
        authorities: [Authority.READ_PROJECT]
      })

      // Check if the user has access to the environment
      this.logger.log(
        `Checking user access to environment ${data.environmentSlug}`
      )
      const environment =
        await this.authorizationService.authorizeUserAccessToEnvironment({
          user,
          slug: data.environmentSlug,
          authorities: [Authority.READ_ENVIRONMENT]
        })

      // Add the client to the environment
      await this.addClientToEnvironment(client, environment.id)

      // Send ACK to client
      this.logger.log('Sending ACK to client')
      client.emit('client-registered', {
        success: true,
        message: 'Registration Successful'
      })

      this.logger.log(
        `Client registered: ${client.id} for configuration: ${JSON.stringify(
          data
        )}`
      )
    } catch (error) {
      // User friendly feedback on error
      let errorMessage = 'An unknown error occurred.'

      this.logger.error({
        message: 'Error during client registration',
        body: error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      })

      if (error instanceof Error) {
        // If the error is an instance of Error, we can get the message directly
        errorMessage = error.message
      } else if (typeof error === 'string') {
        // If the error is a string, use it directly
        errorMessage = error
      } else if (typeof error === 'object' && error !== null) {
        // Try multiple ways to extract a meaningful error message
        let messageToParse = null

        // Check various common error object structures
        if (error.response?.message) {
          messageToParse = error.response.message
        } else if (error.message) {
          messageToParse = error.message
        } else if (error.error?.message) {
          messageToParse = error.error.message
        } else if (error.response?.data?.message) {
          messageToParse = error.response.data.message
        }

        if (messageToParse) {
          if (typeof messageToParse === 'string') {
            try {
              // Try to parse as JSON first (for structured error messages)
              const parsedMessage = JSON.parse(messageToParse)
              if (parsedMessage.header && parsedMessage.body) {
                errorMessage = `${parsedMessage.header}: ${parsedMessage.body}`
              } else if (parsedMessage.message) {
                errorMessage = parsedMessage.message
              } else {
                errorMessage = messageToParse
              }
            } catch {
              // If JSON parsing fails, use the raw message
              errorMessage = messageToParse
            }
          } else {
            // If messageToParse is an object, try to extract meaningful info
            errorMessage =
              messageToParse.message || JSON.stringify(messageToParse)
          }
        } else {
          // Try to extract useful information from the error object
          if (error.statusCode && error.error) {
            errorMessage = `${error.statusCode}: ${error.error}`
          } else if (error.code && error.detail) {
            errorMessage = `${error.code}: ${error.detail}`
          } else {
            // Stringify the entire error as a fallback, but try to make it readable
            try {
              errorMessage = JSON.stringify(error, null, 2)
            } catch {
              errorMessage =
                'An error occurred but could not be formatted for display'
            }
          }
        }
      }

      client.emit('client-registered', {
        success: false,
        message: errorMessage
      })
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async rehydrateCache() {
    this.logger.log('Rehydrating ChangeNotifier cache')
    const socketMaps = await this.prisma.changeNotificationSocketMap.findMany()
    this.logger.log(`Found ${socketMaps.length} socket maps`)

    for (const socketMap of socketMaps) {
      await this.redis.sAdd(
        `${ENV_TO_SOCKET_PREFIX}${socketMap.environmentId}`,
        socketMap.socketId
      )
    }
    this.logger.log('Rehydrated ChangeNotifier cache')
  }

  private async addClientToEnvironment(client: Socket, environmentId: string) {
    this.logger.log('Adding client to environment')

    await this.prisma.changeNotificationSocketMap.create({
      data: {
        socketId: client.id,
        environmentId
      }
    })
    await this.redis.sAdd(`${ENV_TO_SOCKET_PREFIX}${environmentId}`, client.id)

    this.logger.log(
      `Client registered: ${client.id} for environment: ${environmentId}`
    )
  }

  private async removeClientFromEnvironment(client: Socket) {
    this.logger.log('Removing client from environment')

    // Get the environment that the client was connected to
    const socketMap = await this.prisma.changeNotificationSocketMap.findFirst({
      where: {
        socketId: client.id
      }
    })
    if (!socketMap) {
      return
    }
    const environmentId = socketMap.environmentId

    // Remove the client from the environment's list of connected clients
    await this.redis.sRem(`${ENV_TO_SOCKET_PREFIX}${environmentId}`, client.id)

    // Remove socketId -> environmentId mapping
    await this.prisma.changeNotificationSocketMap.deleteMany({
      where: {
        socketId: client.id,
        environmentId
      }
    })

    this.logger.log(
      `Client deregistered: ${client.id} from environment: ${environmentId}`
    )
  }

  private async notifyConfigurationUpdate(rawData: string) {
    this.logger.log('Received configuration update notification')

    const data = JSON.parse(rawData) as ChangeNotificationEvent

    // Get the environment that the entity belongs to
    const environmentId: string = data.environmentId

    // Get the list of connected clients
    const clientIds: string[] = await this.redis.sMembers(
      `${ENV_TO_SOCKET_PREFIX}${environmentId}`
    )

    data.environmentId = undefined

    // Notify each connected client
    if (clientIds) {
      for (const clientId of clientIds) {
        this.server.to(clientId).emit('configuration-updated', data)
      }
      this.logger.log(
        `Notified ${clientIds.length} clients for environment: ${environmentId}`
      )
    }
  }

  /**
   * Extract and validate user authentication from socket connection
   * This mimics the behavior of AuthGuard and ApiKeyGuard but allows us to handle errors gracefully
   */
  private async extractAndValidateUser(
    client: Socket
  ): Promise<AuthenticatedUserContext> {
    const X_KEYSHADE_TOKEN = 'x-keyshade-token'

    // Extract API key from socket headers (similar to how AuthGuard does it)
    const headers = client.handshake.headers
    const apiKeyValue = headers[X_KEYSHADE_TOKEN] as string

    if (!apiKeyValue) {
      throw new ForbiddenException('No API key provided')
    }

    // Validate API key
    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        value: toSHA256(apiKeyValue)
      },
      include: {
        user: true
      }
    })

    if (!apiKey) {
      throw new ForbiddenException('Invalid API key')
    }

    // Check if user is active
    if (!apiKey.user.isActive) {
      throw new UnauthorizedException('User account is not active')
    }

    // Get default workspace
    const defaultWorkspace = await this.prisma.workspace.findFirst({
      where: {
        ownerId: apiKey.userId,
        isDefault: true
      }
    })

    // Create authenticated user context
    const userContext: AuthenticatedUserContext = {
      ...apiKey.user,
      defaultWorkspace,
      ipAddress: client.handshake.address,
      isAuthViaApiKey: true,
      apiKeyAuthorities: new Set(apiKey.authorities)
    }

    // Check required authorities for this socket endpoint
    const requiredAuthorities = [
      Authority.READ_WORKSPACE,
      Authority.READ_PROJECT,
      Authority.READ_ENVIRONMENT
    ]

    // If user has ADMIN authority, bypass individual authority checks
    if (!userContext.apiKeyAuthorities.has(Authority.ADMIN)) {
      for (const requiredAuthority of requiredAuthorities) {
        if (!userContext.apiKeyAuthorities.has(requiredAuthority)) {
          throw new UnauthorizedException(
            `API key is missing the required authority: ${requiredAuthority}`
          )
        }
      }
    }

    return userContext
  }
}
