import { Global, Module } from '@nestjs/common'
import { AzureFileUploadService } from '@/file-upload/azure-file-upload.service'
import { LocalFileUploadService } from '@/file-upload/local-file-upload.service'
import { FILE_UPLOAD_SERVICE } from '@/file-upload/file-upload.service'

@Global()
@Module({
  providers: [
    {
      provide: FILE_UPLOAD_SERVICE,
      useClass:
        (!process.env.AZURE_STORAGE_CONNECTION_STRING &&
          !process.env.AZURE_STORAGE_CONTAINER_NAME) ||
        process.env.NODE_ENV !== 'prod'
          ? AzureFileUploadService
          : LocalFileUploadService
    }
  ],
  exports: [FILE_UPLOAD_SERVICE]
})
export class FileUploadModule {}
