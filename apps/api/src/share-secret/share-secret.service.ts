import { PrismaService } from '@/prisma/prisma.service'
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit
} from '@nestjs/common'
import { CreateShare } from './dto/create.share/create.share'
import { ShareResponse } from './share-secret.types'
import { Share } from '@prisma/client'
import { Cron, CronExpression } from '@nestjs/schedule'
import {
  decryptFile,
  encryptFile,
  sDecrypt,
  sEncrypt,
  toSHA256
} from '@/common/cryptography'
import dayjs from 'dayjs'
import { constructErrorBody } from '@/common/util'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import {
  FILE_UPLOAD_SERVICE,
  FileUploadService
} from '@/file-upload/file-upload.service'
import { Job, Queue, Worker } from 'bullmq'

@Injectable()
export class ShareSecretService implements OnModuleInit {
  private readonly logger = new Logger(ShareSecretService.name)
  private readonly bullMqQueue: Queue
  private readonly queueName = 'scheduled-media-deletion-jobs'

  constructor(
    @Inject() private readonly prisma: PrismaService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
    @Inject(FILE_UPLOAD_SERVICE)
    private readonly fileUploadService: FileUploadService
  ) {
    this.bullMqQueue = new Queue(this.queueName, {
      connection: {
        url: process.env.REDIS_URL
      }
    })
  }

  async onModuleInit() {
    const worker = new Worker(
      this.queueName,
      async (job: Job<{ key: string }>) => {
        const key = job.data.key
        this.logger.log(`Worker triggered with key ${key} to delete files`)

        await this.fileUploadService.deleteFiles([key])
      },
      {
        connection: {
          url: process.env.REDIS_URL
        }
      }
    )

    worker.on('completed', (job: Job) => {
      const key = job.data.key
      this.logger.log(`Files with keys ${key} deleted`)
    })
  }

  public async createShare(
    dto: CreateShare
  ): Promise<Omit<ShareResponse, 'secret' | 'mediaKeys' | 'note' | 'isText'>> {
    if (dto.isText) {
      this.logger.log('Creating a text-based share...')

      const encryptedSecret = sEncrypt(dto.secret, dto.password)
      const hash = this.generateHashFromEncryptedSecret(encryptedSecret)

      const share = await this.prisma.share.create({
        data: {
          hash,
          secret: encryptedSecret,
          isText: true,
          note: dto.note,
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
    } else {
      this.logger.log('Creating a file-based share...')

      const encryptedFiles: File[] = []
      const hash = this.generateHashFromFilenames(dto.medias)

      for (const media of dto.medias) {
        this.logger.log(`Encrypting file ${media.name}...`)
        encryptedFiles.push(await encryptFile(media, dto.password))
      }

      this.logger.log(
        `Uploading ${encryptedFiles.length} files to file upload service...`
      )
      const keys = await this.fileUploadService.uploadFiles(
        encryptedFiles,
        `share/${hash}/encrypted`
      )
      this.logger.log(`Files uploaded successfully`)

      const share = await this.prisma.share.create({
        data: {
          hash,
          mediaKeys: keys,
          isText: false,
          note: dto.note,
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
      url: `${process.env.WEB_FRONTEND_URL}/share/${share.hash}`
    })

    this.logger.log(`Email sent to ${email}`)
  }

  public async getShare(hash: Share['hash']): Promise<ShareResponse> {
    this.logger.log(`Fetching share with hash ${hash}`)

    // Fetch the share from the database
    const share = await this.prisma.share.findUnique({
      where: { hash },
      select: {
        id: true,
        hash: true,
        isText: true,
        mediaKeys: true,
        note: true,
        createdAt: true,
        expiresAt: true,
        isPasswordProtected: true,
        secret: true
      }
    })

    // Check if the share exists and is not expired
    if (!share || dayjs(share.expiresAt).isBefore(new Date())) {
      this.logger.log(`Share with hash ${hash} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Share not found!',
          `The share you are looking for has either expired or does not exist.`
        )
      )
    }

    // Decrypt contents if the share is not password-protected
    if (!share.isPasswordProtected) {
      if (share.isText) {
        this.logger.log(`Decrypting text-based share with hash ${hash}`)
        share.secret = sDecrypt(share.secret)
        this.logger.log(`Text-based share with hash ${hash} decrypted`)
      } else {
        // For file-based shares, we want to fetch the file, decrypt it,
        // upload it to the file upload service, and then return the signed url

        this.logger.log(`Decrypting file-based share with hash ${hash}`)

        const encryptedFiles = await this.fileUploadService.getFiles(
          share.mediaKeys
        )
        const decryptedFiles: File[] = []

        for (const encryptedFile of encryptedFiles) {
          decryptedFiles.push(await decryptFile(encryptedFile))
        }

        share.mediaKeys = await this.fileUploadService.uploadFiles(
          decryptedFiles,
          `share/${hash}/decrypted`
        )

        this.logger.log(`File-based share with hash ${hash} decrypted`)
      }
    }

    // Parse the public URL for the share
    if (!share.isText) {
      this.logger.log(
        `Parsing public URL for file-based share with hash ${hash}`
      )
      share.mediaKeys = await this.fileUploadService.getFileUrls(
        share.mediaKeys
      )
      this.logger.log(
        `Public URL for file-based share with hash ${hash} parsed`
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

    // If the share has reached its view limit, obfuscate it
    // Also delete the files from the file upload service if the share is file-based
    if (updatedShare.timesViewed === updatedShare.viewLimit) {
      this.logger.log(
        `Share with hash ${hash} has reached its view limit. Obfuscating share...`
      )
      await this.prisma.share.update({
        where: { hash },
        data: {
          secret: share.secret && toSHA256(share.secret),
          hash: toSHA256(share.hash),
          mediaKeys: [toSHA256(share.mediaKeys.join('-'))],
          note: share.note && toSHA256(share.note),
          expiresAt: new Date(0)
        }
      })
      if (!share.isText) {
        await this.bullMqQueue.add(
          `delete-share/${hash}`,
          {
            key: `share/${hash}`
          },
          {
            delay: 60_000 // 1-minute delay
          }
        )
      }
      this.logger.log(`Share with hash ${hash} obfuscated`)
    }

    return share
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  public async obfuscateExpiredShares() {
    this.logger.log('Deleting expired shares...')

    const expiredShares = await this.prisma.share.findMany({
      where: {
        expiresAt: {
          lte: new Date()
        }
      }
    })

    const ops = []
    const deleteMediaKeys = []
    for (const share of expiredShares) {
      ops.push(
        this.prisma.share.update({
          where: { hash: share.hash },
          data: {
            secret: toSHA256(share.secret),
            mediaKeys: [toSHA256(share.mediaKeys.join('-'))],
            note: share.note ?? toSHA256(share.note),
            hash: toSHA256(share.hash),
            expiresAt: new Date(0)
          }
        })
      )

      if (!share.isText) {
        deleteMediaKeys.push(`share/${share.hash}`)
      }
    }

    try {
      await this.prisma.$transaction(ops)
      await this.fileUploadService.deleteFiles(deleteMediaKeys)
      this.logger.log('Expired shares obfuscated')
    } catch (error) {
      this.logger.error('Error obfuscating expired shares', error)
    }
  }

  private generateHashFromEncryptedSecret(encryptedSecret: string) {
    return toSHA256(`${encryptedSecret}-${new Date().getTime()}`)
  }

  private generateHashFromFilenames(files: File[]) {
    const fileNames = files.map((file) => file.name).join('-')
    return toSHA256(`${fileNames}-${new Date().getTime()}`)
  }
}
