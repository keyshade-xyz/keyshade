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
import { Authority, User } from '@prisma/client'
import { CurrentUser } from '@/decorators/user.decorator'
import { PrismaService } from '@/prisma/prisma.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { ApiKeyGuard } from '@/auth/guard/api-key/api-key.guard'
import { AuthGuard } from '@/auth/guard/auth/auth.guard'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AuthorityCheckerService } from '@/common/authority-checker.service'

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
    private readonly authorityCheckerService: AuthorityCheckerService
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
    this.logger.log('Initialized change notifier socket gateway')
    await this.redisSubscriber.subscribe(
      CHANGE_NOTIFIER_RSC,
      this.notifyConfigurationUpdate.bind(this)
    )
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
    @CurrentUser() user: User
  ) {
    // Check if the user has access to the workspace
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        name: data.workspaceName,
        members: {
          some: {
            userId: user.id
          }
        }
      }
    })
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspace.id },
      authorities: [Authority.READ_WORKSPACE],
      prisma: this.prisma
    })

    // Check if the user has access to the project
    const project = await this.prisma.project.findFirst({
      where: {
        name: data.projectName,
        workspaceId: workspace.id
      }
    })
    await this.authorityCheckerService.checkAuthorityOverProject({
      userId: user.id,
      entity: { id: project.id },
      authorities: [Authority.READ_PROJECT],
      prisma: this.prisma
    })

    // Check if the user has access to the environment
    const environment = await this.prisma.environment.findFirst({
      where: {
        name: data.environmentName,
        projectId: project.id
      }
    })
    await this.authorityCheckerService.checkAuthorityOverEnvironment({
      userId: user.id,
      entity: { id: environment.id },
      authorities: [Authority.READ_ENVIRONMENT],
      prisma: this.prisma
    })

    // Add the client to the environment
    await this.addClientToEnvironment(client, environment.id)

    const clientRegisteredResponse = {
      workspaceId: workspace.id,
      projectId: project.id,
      environmentId: environment.id
    }

    // Send ACK to client
    client.emit('client-registered', clientRegisteredResponse)

    this.logger.log(
      `Client registered: ${client.id} for configuration: ${JSON.stringify(
        clientRegisteredResponse
      )}`
    )
  }

  private async addClientToEnvironment(client: Socket, environmentId: string) {
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
