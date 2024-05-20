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
import { CurrentUser } from '../../decorators/user.decorator'
import { Authority, User } from '@prisma/client'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { AdminGuard } from '../../auth/guard/admin/admin.guard'
import { CreateUserDto } from '../dto/create.user/create.user'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags
} from '@nestjs/swagger'
import { BypassOnboarding } from '../../decorators/bypass-onboarding.decorator'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'
import { ForbidApiKey } from '../../decorators/forbid-api-key.decorator'
import { invalidAuthenticationResponse } from '../../common/static'

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' },
    profilePictureUrl: { type: 'string' },
    isAdmin: { type: 'boolean' },
    isActive: { type: 'boolean' },
    isOnboardingFinished: { type: 'boolean' }
  }
}

@ApiTags('User Controller')
@Controller('user')
@ApiBearerAuth()
@ApiSecurity('api_key')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @BypassOnboarding()
  @RequiredApiKeyAuthorities(Authority.READ_SELF)
  @ApiOperation({
    summary: 'Get current user',
    description:
      'This endpoint returns the details of the currently logged in user'
  })
  @ApiOkResponse({
    description: 'User details',
    schema: userSchema
  })
  @ApiForbiddenResponse(invalidAuthenticationResponse)
  async getCurrentUser(@CurrentUser() user: User) {
    return this.userService.getSelf(user)
  }

  @Put()
  @BypassOnboarding()
  @RequiredApiKeyAuthorities(Authority.UPDATE_SELF)
  @ApiOperation({
    summary: 'Update current user',
    description:
      'This endpoint updates the details of the currently logged in user'
  })
  @ApiOkResponse({
    description: 'Updated user details',
    schema: userSchema
  })
  @ApiForbiddenResponse(invalidAuthenticationResponse)
  async updateSelf(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return await this.userService.updateSelf(user, dto)
  }

  @Delete()
  @ApiNoContentResponse()
  @HttpCode(204)
  @ForbidApiKey()
  @ApiOperation({
    summary: 'Delete current user',
    description:
      'This endpoint deletes the details of the currently logged in user'
  })
  @ApiForbiddenResponse(invalidAuthenticationResponse)
  @ApiNoContentResponse({
    description: 'User deleted successfully'
  })
  async deleteSelf(@CurrentUser() user: User) {
    await this.userService.deleteSelf(user)
  }

  @Delete(':userId')
  @UseGuards(AdminGuard)
  @ApiNoContentResponse()
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
  @ApiCreatedResponse()
  async createUser(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto)
  }

  @Post('validate-otp/:userId')
  async validateOtp(
    @Param('userId') userId: User['id'],
    @Query('otp') otp: string
  ) {
    return await this.userService.validateOtp(userId, otp.trim())
  }

  @Post('resend-otp/:userId')
  async resendOtp(@Param('userId') userId: User['id']) {
    return await this.userService.resendOtp(userId)
  }
}
