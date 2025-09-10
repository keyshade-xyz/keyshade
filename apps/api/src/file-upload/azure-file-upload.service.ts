import { FileUploadService } from '@/file-upload/file-upload.service'
import {
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient
} from '@azure/storage-blob'
import { exit } from 'process'
import { v4 as uuidv4 } from 'uuid'
import { constructErrorBody } from '@/common/util'

// Expiry time for generated SAS URLs, in seconds
const SAS_URL_EXPIRY_SECONDS = 3600 // 1 hour

@Injectable()
export class AzureFileUploadService implements FileUploadService {
  private readonly logger = new Logger(AzureFileUploadService.name)
  private readonly containerClient: ContainerClient

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME

    if (connectionString && containerName) {
      this.logger.log(
        'Azure storage connection string and container name found. Initializing...'
      )
      try {
        const blobServiceClient =
          BlobServiceClient.fromConnectionString(connectionString)

        this.containerClient =
          blobServiceClient.getContainerClient(containerName)

        // Ensure the container exists
        this.containerClient
          .createIfNotExists()
          .then(() => {
            this.logger.log('Azure storage container created successfully')
          })
          .catch((error) => {
            this.logger.error('Error creating Azure storage container:', error)
            exit(1)
          })

        this.logger.log('Azure storage client initialized successfully')
      } catch (error) {
        this.logger.error('Error initializing Azure storage client: ', error)
        exit(1)
      }
    } else {
      this.logger.warn(
        'Azure storage connection string and container name not found. File uploads will work locally.'
      )
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    this.logger.log(`Deleting ${keys.length} files from Azure storage...`)

    const deletePromises = keys.map(async (key) => {
      try {
        const blockBlobClient = this.containerClient.getBlockBlobClient(key)
        await blockBlobClient.delete()
        this.logger.log(`Successfully deleted file with key: ${key}`)
      } catch (error) {
        if (error.statusCode === 404) {
          this.logger.warn(`File with key "${key}" not found, skipping delete.`)
        } else {
          this.logger.error(`Error deleting file with key "${key}":`, error)
        }
      }
    })

    await Promise.all(deletePromises)
  }

  async getFiles(keys: string[]): Promise<File[]> {
    this.logger.log(`Getting ${keys.length} files from Azure storage...`)

    const filePromises = keys.map(async (key) => {
      try {
        const blobClient = this.containerClient.getBlobClient(key)
        const buffer = await blobClient.downloadToBuffer()
        const properties = await blobClient.getProperties()
        const fileName = key.substring(key.lastIndexOf('/') + 1)

        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        ) as ArrayBuffer

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

  async uploadFiles(
    files: File[],
    path: string,
    expiresAfter: number
  ): Promise<string[]> {
    this.logger.log(`Uploading ${files.length} files to Azure storage...`)

    const uploadPromises = files.map(async (file) => {
      // Create a unique name to avoid collisions
      const uniqueFileName = `${uuidv4()}-${file.name}`
      const key = path ? `${path}/${uniqueFileName}` : uniqueFileName

      const blockBlobClient = this.containerClient.getBlockBlobClient(key)
      const buffer = await file.arrayBuffer()

      await blockBlobClient.uploadData(Buffer.from(buffer), {
        blobHTTPHeaders: {
          blobContentType: file.type,
          // Set expiry on the blob if a value is provided
          ...(expiresAfter > 0 && {
            expiresOn: new Date(Date.now() + expiresAfter * 1000)
          })
        }
      })
      this.logger.log(`Successfully uploaded file with key: ${key}`)
      return key
    })

    return Promise.all(uploadPromises)
  }
}
