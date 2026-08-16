import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class PlayersController {
  constructor(private playersService: PlayersService) {}

  @Post('teams/:teamId/players')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.KAPITEN)
  create(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: CreatePlayerDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.playersService.create(teamId, dto, user.userId);
  }

  @Get('teams/:teamId/players')
  findAllForTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.playersService.findAllForTeam(teamId);
  }

  @Get('players/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOne(id);
  }

  @Patch('players/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.KAPITEN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlayerDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.playersService.update(id, dto, user.userId);
  }

  @Delete('players/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.KAPITEN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.playersService.remove(id, user.userId);
  }
}
