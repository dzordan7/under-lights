import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CompleteMatchDto } from './dto/complete-match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/role.enum';

@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findOne(id);
  }

  @Get(':id/stats')
  findStats(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findStats(id);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  completeMatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteMatchDto,
  ) {
    return this.matchesService.completeMatch(id, dto);
  }
}
