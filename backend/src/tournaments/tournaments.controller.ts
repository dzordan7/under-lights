import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { RegistrationStatus } from './registration-status.enum';
import { TournamentStatus } from './tournament-status.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlayersService } from 'src/players/players.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private tournamentsService: TournamentsService,
    private playersService: PlayersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(
    @Body() dto: CreateTournamentDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.tournamentsService.create(dto, user.userId);
  }

  @Get()
  findAll(
    @Query('grad') grad?: string,
    @Query('status') status?: TournamentStatus,
  ) {
    return this.tournamentsService.findAll(grad, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.findOne(id);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.KAPITEN)
  registerTeam(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.tournamentsService.registerTeam(id, user.userId);
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findRegistrations(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.findRegistrations(id);
  }

  @Patch('registrations/:registrationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateRegistrationStatus(
    @Param('registrationId', ParseIntPipe) registrationId: number,
    @Body('status') status: RegistrationStatus,
    @CurrentUser() user: { userId: number },
  ) {
    return this.tournamentsService.updateRegistrationStatus(
      registrationId,
      status,
      user.userId,
    );
  }

  @Post(':id/draw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  generateGroupStage(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.generateGroupStage(id);
  }

  @Get(':id/groups')
  findGroups(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.findGroups(id);
  }

  @Get(':id/matches')
  findMatches(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.findMatches(id);
  }

  @Get(':id/standings')
  findStandings(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.findStandings(id);
  }

  @Post(':id/knockout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  generateKnockoutStage(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.generateKnockoutStage(id);
  }

  @Post(':id/knockout/advance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  advanceKnockoutRound(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.advanceKnockoutRound(id);
  }

  @Get(':id/top-scorers')
  getTopScorers(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.getTopScorers(id);
  }

  @Get(':id/top-goalkeepers')
  getTopGoalkeepers(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.getTopGoalkeepers(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateTournamentDto>,
  ) {
    return this.tournamentsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.remove(id);
  }
}
