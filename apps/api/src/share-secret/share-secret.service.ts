import { PrismaService } from '@/prisma/prisma.service'
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateShareDto } from './dto/create.share/create.share'
import { ShareResponse } from './share-secret.types'
import { Share } from '@prisma/client'
import { Cron, CronExpression } from '@nestjs/schedule'
import { sDecrypt, sEncrypt, toSHA256 } from '@/common/cryptography'
import dayjs from 'dayjs'
import { constructErrorBody } from '@/common/util'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'

@Injectable()
export class ShareSecretService {
  private readonly logger = new Logger(ShareSecretService.name)

  constructor(
    @Inject() private readonly prisma: PrismaService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService
  ) {}

  public async createShare(
    dto: CreateShareDto
  ): Promise<Omit<ShareResponse, 'secret'>> {
    this.logger.log('Creating a shared secret...')

    // Encrypts the secret using the password if provided.
    // If null, gets encrypted by server secret
    const encryptedSecret = sEncrypt(dto.secret, dto.password)

    // Hash that will be used to access the secret
    const hash = toSHA256(`${encryptedSecret}-${new Date().getTime()}`)

    const share = await this.prisma.share.create({
      data: {
        hash,
        secret: encryptedSecret,
        expiresAt: new Date(
          dayjs().add(dto.expiresAfterDays, 'day').toDate().getTime()
        ),
        viewLimit: dto.viewLimit,
        isPasswordProtected: !!dto.password
      },
      select: {
        id: true,
        hash: true,
        createdAt: true,
        expiresAt: true,
        isPasswordProtected: true
      }
    })

    this.logger.log(`Shared secret created successfully with hash ${hash}`)
    return share
  }

  public async addEmailToShare(hash: Share['hash'], email: string) {
    this.logger.log(`Adding email ${email} to share with hash ${hash}`)

    this.logger.log(`Fetching share with hash ${hash}`)
    const share = await this.prisma.share.findUnique({
      where: { hash }
    })

    if (!share) {
      this.logger.log(`Share with hash ${hash} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Share not found!',
          `The share you are looking for has either expired or does not exist.`
        )
      )
    }

    this.logger.log(`Updating share with hash ${hash}`)
    await this.prisma.share.update({
      where: { hash },
      data: {
        recepientEmails: {
          set: [...new Set([...(share.recepientEmails ?? []), email])]
        }
      }
    })
    this.logger.log(`Email ${email} added to share with hash ${hash}`)

    this.logger.log(`Sharing secret ${hash} with ${email} over email`)
    await this.mailService.shareSecret(email, {
      expiresAt: share.expiresAt,
      isPasswordProtected: share.isPasswordProtected,
      url: `${process.env.PLATFORM_FRONTEND_URL}/share/${share.hash}`
    })

    this.logger.log(`Email sent to ${email}`)
  }

  public async getShare(hash: Share['hash']): Promise<ShareResponse> {
    this.logger.log(`Fetching share with hash ${hash}`)
    const share = await this.prisma.share.findUnique({
      where: { hash },
      select: {
        id: true,
        hash: true,
        createdAt: true,
        expiresAt: true,
        isPasswordProtected: true,
        secret: true
      }
    })

    if (!share) {
      this.logger.log(`Share with hash ${hash} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Share not found!',
          `The share you are looking for has either expired or does not exist.`
        )
      )
    }

    // Update the share view count
    this.logger.log(`Updating share view count with hash ${hash}`)
    const updatedShare = await this.prisma.share.update({
      where: { hash },
      data: {
        timesViewed: {
          increment: 1
        }
      }
    })
    this.logger.log(
      `Share view count updated with hash ${hash}. View count: ${updatedShare.timesViewed}`
    )

    // If the share has reached its view limit, delete it
    if (updatedShare.timesViewed === updatedShare.viewLimit) {
      this.logger.log(
        `Share with hash ${hash} has reached its view limit. Deleting share`
      )
      await this.prisma.share.delete({
        where: { hash }
      })
      this.logger.log(`Share with hash ${hash} deleted`)
    }

    // Decrypt the secret if it's not password protected
    if (!share.isPasswordProtected) share.secret = sDecrypt(share.secret)

    return share
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  public async deleteExpiredShares() {
    this.logger.log('Deleting expired shares...')
    await this.prisma.share.deleteMany({
      where: {
        expiresAt: {
          lte: new Date()
        }
      }
    })
    this.logger.log('Expired shares deleted')
  }
}
