import { Inject, Logger, UseGuards } from '@nestjs/common'
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
import { CurrentUser } from '@/decorators/user.decorator'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { ApiKeyGuard } from '@/auth/guard/api-key/api-key.guard'
import { AuthGuard } from '@/auth/guard/auth/auth.guard'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AuthenticatedUser } from '@/user/user.types'

// The redis subscription channel for configuration updates
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
  private readonly logger = new Logger(ChangeNotifier.name)
  @WebSocketServer() server: Server
  private readonly redis: RedisClientType
  private readonly redisSubscriber: RedisClientType

  constructor(
    @Inject(REDIS_CLIENT)
    readonly redisClient: {
      subscriber: RedisClientType
      publisher: RedisClientType
    },
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService
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
  }

  async handleDisconnect(client: Socket) {
    await this.removeClientFromEnvironment(client)
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  /**
   * This event is emitted from the client app to register
   * itself with our services so that it can receive updates.
   */
  @RequiredApiKeyAuthorities(
    Authority.READ_WORKSPACE,
    Authority.READ_PROJECT,
    Authority.READ_ENVIRONMENT
  )
  @UseGuards(AuthGuard, ApiKeyGuard)
  @SubscribeMessage('register-client-app')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChangeNotifierRegistration,
    @CurrentUser() user: AuthenticatedUser
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
      // Check if the user has access to the workspace
      this.logger.log('Checking user access to workspace')
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        slug: data.workspaceSlug,
        authorities: [
          Authority.READ_WORKSPACE,
          Authority.READ_VARIABLE,
          Authority.READ_SECRET
        ]
      })

      // Check if the user has access to the project
      this.logger.log('Checking user access to project')
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: data.projectSlug,
        authorities: [Authority.READ_PROJECT]
      })

      // Check if the user has access to the environment
      this.logger.log('Checking user access to environment')
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
      this.logger.error(error)
      client.emit('client-registered', {
        success: false,
        message: error as string
      })
    }
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
}
