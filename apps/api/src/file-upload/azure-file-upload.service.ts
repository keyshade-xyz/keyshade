import { FileUploadService } from '@/file-upload/file-upload.service'
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { BlobSASPermissions, ContainerClient } from '@azure/storage-blob'
import { constructErrorBody, convertBufferToArrayBuffer } from '@/common/util'
import { AZURE_CONTAINER_CLIENT } from '@/provider/azure-container.provider'

// Expiry time for generated SAS URLs, in seconds
const SAS_URL_EXPIRY_SECONDS = 3600 // 1 hour

@Injectable()
export class AzureFileUploadService implements FileUploadService {
  private readonly logger = new Logger(AzureFileUploadService.name)
  @Inject(AZURE_CONTAINER_CLIENT)
  private readonly containerClient: ContainerClient

  async deleteFiles(keys: string[]): Promise<void> {
    this.logger.log(`Deleting ${keys.length} prefixes from Azure storage...`)

    for (const prefix of keys) {
      this.logger.log(`Deleting blobs with prefix: ${prefix}`)
      try {
        for await (const blob of this.containerClient.listBlobsFlat({
          prefix
        })) {
          this.logger.log(`Deleting blob: ${blob.name}`)
          await this.containerClient
            .getBlobClient(blob.name)
            .delete({ deleteSnapshots: 'include' })
          this.logger.log(`Successfully deleted blob: ${blob.name}`)
        }
      } catch (error) {
        this.logger.error(
          `Error deleting blobs with prefix "${prefix}":`,
          error
        )
      }
    }
  }

  async getFiles(keys: string[]): Promise<File[]> {
    this.logger.log(`Getting ${keys.length} files from Azure storage...`)

    const filePromises = keys.map(async (key) => {
      try {
        const blobClient = this.containerClient.getBlobClient(key)
        const buffer = await blobClient.downloadToBuffer()
        const properties = await blobClient.getProperties()
        const fileName = key.substring(key.lastIndexOf('/') + 1)
        const arrayBuffer = convertBufferToArrayBuffer(buffer)

        return new File([arrayBuffer], fileName, {
          type: properties.contentType,
          lastModified: properties.lastModified?.getTime()
        })
      } catch (error) {
        if (error.statusCode === 404) {
          this.logger.warn(`File with key "${key}" not found in Azure Storage.`)
          return null
        } else {
          this.logger.error(`Error getting file with key "${key}":`, error)
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
    // Filter out any null results from files that weren't found
    return results.filter((file): file is File => file !== null)
  }

  async getFileUrls(keys: string[]): Promise<string[]> {
    this.logger.log(`Getting ${keys.length} file URLs from Azure storage...`)

    const urlPromises = keys.map(async (key) => {
      try {
        const blobClient = this.containerClient.getBlobClient(key)

        // Ensure the blob exists before generating a URL
        if (!(await blobClient.exists())) {
          this.logger.warn(
            `File with key "${key}" not found, cannot generate URL.`
          )
          return null
        }

        const sasOptions = {
          permissions: BlobSASPermissions.parse('r'), // Read permission
          expiresOn: new Date(
            new Date().valueOf() + SAS_URL_EXPIRY_SECONDS * 1000
          )
        }

        return await blobClient.generateSasUrl(sasOptions)
      } catch (error) {
        this.logger.error(`Error generating SAS URL for key "${key}":`, error)
        throw new InternalServerErrorException(
          constructErrorBody(
            'Error while generating secure link',
            'We encountered an error while generating a secure link for the file. Please try again later. If the problem persists, please contact support.'
          )
        )
      }
    })

    const results = await Promise.all(urlPromises)
    return results.filter((url): url is string => url !== null)
  }

  async uploadFiles(files: File[], path: string): Promise<string[]> {
    this.logger.log(`Uploading ${files.length} files to Azure storage...`)

    const uploadPromises = files.map(async (file) => {
      const fileName = file.name
      const key = path ? `${path}/${fileName}` : fileName

      const blockBlobClient = this.containerClient.getBlockBlobClient(key)
      const buffer = await file.arrayBuffer()

      await blockBlobClient.uploadData(Buffer.from(buffer), {
        blobHTTPHeaders: {
          blobContentType: file.type
        }
      })
      this.logger.log(`Successfully uploaded file with key: ${key}`)
      return key
    })

    return Promise.all(uploadPromises)
  }
}
