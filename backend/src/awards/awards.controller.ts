import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AwardsService } from './awards.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/role.enum';

@Controller()
export class AwardsController {
  constructor(private awardsService: AwardsService) {}

  @Get('tournaments/:id/awards')
  findByTournament(@Param('id', ParseIntPipe) id: number) {
    return this.awardsService.findByTournament(id);
  }

  @Get('players/:id/awards')
  findByPlayer(@Param('id', ParseIntPipe) id: number) {
    return this.awardsService.findByPlayer(id);
  }

  @Get('tournaments/:id/awards/suggestions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getSuggestions(@Param('id', ParseIntPipe) id: number) {
    return this.awardsService.getSuggestions(id);
  }

  @Post('tournaments/:id/awards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateAwardDto) {
    return this.awardsService.create(id, dto);
  }

  @Delete('awards/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.awardsService.remove(id);
  }
}
