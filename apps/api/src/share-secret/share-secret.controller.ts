import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common'
import { ShareSecretService } from './share-secret.service'
import { Public } from '@/decorators/public.decorator'
import { FilesInterceptor } from '@nestjs/platform-express'
import { CreateShare } from '@/share-secret/dto/create.share/create.share'
import { convertBufferToArrayBuffer } from '@/common/util'

@Controller('share-secret')
export class ShareSecretController {
  constructor(private readonly shareSecretService: ShareSecretService) {}

  @Post()
  @Public()
  @UseInterceptors(FilesInterceptor('files', 10))
  @HttpCode(HttpStatus.CREATED)
  async createShare(
    @Body() dto: CreateShare,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 })]
      })
    )
    files?: Express.Multer.File[]
  ) {
    const convertedFiles: File[] = files.map(
      (file) =>
        new File([convertBufferToArrayBuffer(file.buffer)], file.originalname, {
          type: file.mimetype
        })
    )
    return await this.shareSecretService.createShare({
      ...dto,
      medias: convertedFiles
    })
  }

  @Put(':hash/add-email')
  @Public()
  async addEmailToShare(
    @Param('hash') hash: string,
    @Query('email') email: string
  ) {
    return await this.shareSecretService.addEmailToShare(hash, email)
  }

  @Get(':hash')
  @Public()
  async getShare(@Param('hash') hash: string) {
    return await this.shareSecretService.getShare(hash)
  }
}
