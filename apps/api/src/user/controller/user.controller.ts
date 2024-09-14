import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common'
import { UserService } from '../service/user.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { Authority } from '@prisma/client'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { AdminGuard } from '@/auth/guard/admin/admin.guard'
import { CreateUserDto } from '../dto/create.user/create.user'
import { BypassOnboarding } from '@/decorators/bypass-onboarding.decorator'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { ForbidApiKey } from '@/decorators/forbid-api-key.decorator'
import { UserWithWorkspace } from '../user.types'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @BypassOnboarding()
  @RequiredApiKeyAuthorities(Authority.READ_SELF)
  async getCurrentUser(@CurrentUser() user: UserWithWorkspace) {
    return this.userService.getSelf(user)
  }

  @Put()
  @BypassOnboarding()
  @RequiredApiKeyAuthorities(Authority.UPDATE_SELF)
  async updateSelf(
    @CurrentUser() user: UserWithWorkspace,
    @Body() dto: UpdateUserDto
  ) {
    return await this.userService.updateSelf(user, dto)
  }

  @Delete()
  @HttpCode(204)
  @ForbidApiKey()
  async deleteSelf(@CurrentUser() user: UserWithWorkspace) {
    await this.userService.deleteSelf(user)
  }

  @Delete(':userId')
  @UseGuards(AdminGuard)
  @HttpCode(204)
  async deleteUser(@Param('userId') userId: string) {
    await this.userService.deleteUser(userId)
  }

  @Put(':userId')
  @UseGuards(AdminGuard)
  async updateUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto
  ) {
    return await this.userService.updateUser(userId, dto)
  }

  @Get(':userId')
  @UseGuards(AdminGuard)
  async getUserById(@Param('userId') userId: string) {
    return await this.userService.getUserById(userId)
  }

  @Get('all')
  @UseGuards(AdminGuard)
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.userService.getAllUsers(page, limit, sort, order, search)
  }

  @Post()
  @UseGuards(AdminGuard)
  async createUser(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto)
  }

  @Post('validate-email-change-otp')
  async validateEmailChangeOtp(
    @CurrentUser() user: UserWithWorkspace,
    @Query('otp') otp: string
  ) {
    return await this.userService.validateEmailChangeOtp(user, otp.trim())
  }

  @Post('resend-email-change-otp')
  async resendEmailChangeOtp(@CurrentUser() user: UserWithWorkspace) {
    return await this.userService.resendEmailChangeOtp(user)
  }
}
