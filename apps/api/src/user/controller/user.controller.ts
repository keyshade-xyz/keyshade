import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common'
import { UserService } from '../service/user.service'
import { CurrentUser } from '../../decorators/user.decorator'
import { User } from '@prisma/client'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { AdminGuard } from '../../auth/guard/admin.guard'
import { ICrateUserDTO } from '../dto/create.user/create.user'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getCurrentUser(@CurrentUser() user: User) {
    return this.userService.getSelf(user)
  }

  @Put()
  async updateSelf(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
    @Query('finishOnboarding') finishOnboarding: boolean = false
  ) {
    return await this.userService.updateSelf(user, dto, finishOnboarding)
  }

  @Put(':userId')
  @UseGuards(AdminGuard)
  async updateUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
    @Query('finishOnboarding') finishOnboarding: boolean = false
  ) {
    return await this.userService.updateUser(userId, dto, finishOnboarding)
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

  @Post('')
  @UseGuards(AdminGuard)
  async createUser(@Body() dto: ICrateUserDTO) {
    return await this.userService.createUser(dto);
  }
}
