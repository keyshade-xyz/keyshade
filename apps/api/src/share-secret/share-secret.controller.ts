import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { ShareSecretService } from './share-secret.service'
import { Public } from '@/decorators/public.decorator'
import { CreateShare } from './dto/create.share/create.share'

@Controller('share-secret')
export class ShareSecretController {
  constructor(private readonly shareSecretService: ShareSecretService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createShare(@Body() dto: CreateShare) {
    return await this.shareSecretService.createShare(dto)
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
