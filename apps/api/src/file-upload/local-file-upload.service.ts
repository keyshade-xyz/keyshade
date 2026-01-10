import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit
} from '@nestjs/common'
import * as fs from 'fs/promises'
import * as path from 'path'
import { FileUploadService } from '@/file-upload/file-upload.service'
import { constructErrorBody } from '@/common/util'

@Injectable()
export class LocalFileUploadService implements FileUploadService, OnModuleInit {
  private readonly logger = new Logger(LocalFileUploadService.name)
  private readonly storagePath = path.join(process.cwd(), 'uploads')
  private readonly fileUrlPrefix =
    process.env.LOCAL_FILE_URL_PREFIX || '/static'

  async onModuleInit() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true })
      this.logger.log(`Local upload directory ensured at: ${this.storagePath}`)
    } catch (error) {
      this.logger.error('Error creating local upload directory:', error)
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    this.logger.log(`Deleting ${keys.length} local files...`)

    const deletePromises = keys.map(async (key) => {
      const filePath = path.join(this.storagePath, key)
      try {
        await fs.unlink(filePath)
        this.logger.log(`Deleted local file: ${filePath}`)
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.logger.warn(`File not found, skipping delete: ${filePath}`)
        } else {
          this.logger.error(`Error deleting file ${filePath}:`, error)
          throw new InternalServerErrorException(
            constructErrorBody(
              'Error while deleting file',
              'We encountered an error while deleting the file. Please try again later. If the problem persists, please contact support.'
            )
          )
        }
      }
    })

    await Promise.all(deletePromises)
  }

  async getFiles(keys: string[]): Promise<File[]> {
    this.logger.log(`Getting ${keys.length} local files...`)

    const filePromises = keys.map(async (key) => {
      const filePath = path.join(this.storagePath, key)
      try {
        const buffer = await fs.readFile(filePath)
        const stats = await fs.stat(filePath)
        const fileName = path.basename(key)

        // Convert Node.js Buffer to ArrayBuffer to be compatible with File constructor
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        ) as ArrayBuffer

        return new File([arrayBuffer], fileName, {
          type: 'application/octet-stream', // MIME type isn't stored, provide a default
          lastModified: stats.mtime.getTime()
        })
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.logger.warn(`File not found: ${filePath}`)
          return null
        } else {
          this.logger.error(`Error reading file ${filePath}:`, error)
          throw new InternalServerErrorException(
            constructErrorBody(
              'Error while reading file',
              'We encountered an error while reading the file. Please try again later. If the problem persists, please contact support.'
            )
          )
        }
      }
    })

    const results = await Promise.all(filePromises)
    return results.filter((file): file is File => file !== null)
  }

  async uploadFiles(
    files: File[],
    subpath: string,
    expiresAfter: number
  ): Promise<string[]> {
    this.logger.log(`Uploading ${files.length} files to local storage...`)
    if (expiresAfter > 0) {
      this.logger.warn(
        `'expiresAfter' is not supported by LocalFileUploadService and will be ignored.`
      )
    }

    const uploadPromises = files.map(async (file) => {
      const key = path.join(subpath, file.name)
      const destinationPath = path.join(this.storagePath, key)

      // Ensure the subdirectory exists
      await fs.mkdir(path.dirname(destinationPath), { recursive: true })

      // Convert the File's ArrayBuffer to a Node.js Buffer for writing to disk
      const buffer = Buffer.from(await file.arrayBuffer())

      await fs.writeFile(destinationPath, buffer)
      this.logger.log(`Wrote file to: ${destinationPath}`)
      return key
    })

    return Promise.all(uploadPromises)
  }

  async getFileUrls(keys: string[]): Promise<string[]> {
    this.logger.log(`Generating ${keys.length} local file URLs...`)

    // These URLs require a static file server (e.g., @nestjs/serve-static)
    // to be configured to serve the `storagePath` directory.
    return keys.map((key) => `${this.fileUrlPrefix}/${key}`)
  }
}
