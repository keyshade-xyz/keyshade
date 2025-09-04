import { Logger, Provider } from '@nestjs/common'
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import { exit } from 'process'

export const AZURE_CONTAINER_CLIENT = 'AzureContainerClient'

export const AzureContainerProvider: Provider = {
  provide: AZURE_CONTAINER_CLIENT,
  useFactory: async (): Promise<ContainerClient> => {
    const logger = new Logger('AzureContainerProvider')

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME

    if (connectionString && containerName) {
      logger.log(
        'Azure storage connection string and container name found. Initializing...'
      )
      try {
        const blobServiceClient =
          BlobServiceClient.fromConnectionString(connectionString)

        const containerClient =
          blobServiceClient.getContainerClient(containerName)

        // Ensure the container exists
        await containerClient.createIfNotExists()

        logger.log('Azure storage client initialized successfully')

        return containerClient
      } catch (error) {
        logger.error('Error initializing Azure storage client: ', error)
        exit(1)
      }
    } else {
      logger.warn(
        'Azure container credentials are not set. Skipping initialization...'
      )
      return null
    }
  }
}
