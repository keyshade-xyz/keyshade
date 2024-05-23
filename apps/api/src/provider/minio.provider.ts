import { InternalServerErrorException, Logger, Provider } from '@nestjs/common'
import * as Minio from 'minio'

export const MINIO_CLIENT = 'MinioClient'

export const MinioProvider: Provider = {
  provide: MINIO_CLIENT,
  useFactory: async () => {
    let minioClient: Minio.Client
    let isServiceLoaded: boolean = false

    const logger = new Logger('MinioProvider')
    if (
      !process.env.MINIO_ENDPOINT ||
      !process.env.MINIO_PORT ||
      !process.env.MINIO_ACCESS_KEY ||
      !process.env.MINIO_SECRET_KEY ||
      !process.env.MINIO_BUCKET_NAME
    ) {
      logger.warn(
        'Missing one or more MinIO environment variables. Skipping initialization...'
      )
      return
    }

    try {
      minioClient = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: Number(process.env.MINIO_PORT),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY
      })
    } catch (error) {
      logger.error('Error initializing Minio Client', error)
      throw new InternalServerErrorException('Error initializing Minio Client')
    }

    const bucketName = process.env.MINIO_BUCKET_NAME
    await createBucketIfNotExists()
    if (isServiceLoaded) {
      logger.log('Minio Provider Loaded Successfully.')
    }

    async function createBucketIfNotExists() {
      if (!minioClient) return

      const bucketExists = await minioClient.bucketExists(bucketName)
      if (!bucketExists) {
        logger.warn(`Bucket ${bucketName} does not exist. Creating it.`)
        try {
          await minioClient.makeBucket(bucketName, 'ap-south-1')
        } catch (error) {
          logger.error('Error creating bucket in Minio', error)
          throw new InternalServerErrorException(
            'Error creating bucket in Minio'
          )
        }
        logger.log(`Bucket ${bucketName} created.`)
      }
      isServiceLoaded = true
    }

    async function uploadFile(file) {
      if (!isServiceLoaded) {
        return new InternalServerErrorException('Minio Client has not loaded')
      }
      const fileName = `${Date.now()}-${file.originalname}`
      try {
        await minioClient.putObject(
          bucketName,
          fileName,
          file.buffer,
          file.size
        )
      } catch (error) {
        logger.error('Error uploading file to Minio', error)
        throw new InternalServerErrorException('Error uploading file to Minio')
      }
      return fileName
    }

    async function getFileUrl(fileName: string) {
      if (!isServiceLoaded) {
        return new InternalServerErrorException('Minio Client has not loaded')
      }
      try {
        return await minioClient.presignedUrl('GET', bucketName, fileName)
      } catch (error) {
        logger.error('Error generating file URL from Minio', error)
        throw new InternalServerErrorException(
          'Error generating file URL from Minio'
        )
      }
    }

    async function deleteFile(fileName: string) {
      if (!isServiceLoaded) {
        return new InternalServerErrorException('Minio Client has not loaded')
      }
      try {
        await minioClient.removeObject(bucketName, fileName)
      } catch (error) {
        logger.error('Error deleting file from Minio', error)
        throw new InternalServerErrorException('Error deleting file from Minio')
      }
    }
  }
}
