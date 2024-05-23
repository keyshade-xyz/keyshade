import { InternalServerErrorException, Logger, Provider } from '@nestjs/common'
import * as Minio from 'minio'
import { exit } from 'process'

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
      exit(1)
    }

    const bucketName = process.env.MINIO_BUCKET_NAME
    await createBucketIfNotExists()
    if (isServiceLoaded) {
      logger.log('Minio Provider Loaded Successfully.')
    }

    async function createBucketIfNotExists() {
      if (!minioClient) return
      let bucketExists: boolean = false

      try {
        bucketExists = await minioClient.bucketExists(bucketName)
      } catch (error) {
        logger.error('Error while checking if bucket exists in Minio', error)
        throw new InternalServerErrorException(
          'Error while checking if bucket exists in Minio'
        )
      }
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
        return true
      } catch (error) {
        logger.error('Error deleting file from Minio', error)
        throw new InternalServerErrorException('Error deleting file from Minio')
      }
    }
  }
}
