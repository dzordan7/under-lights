import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Tournament } from '../tournaments/tournament.entity';
import { Group } from '../tournaments/group.entity';
import { Team } from '../teams/team.entity';
import { MatchPhase } from './match-phase.enum';
import { MatchStatus } from './match-status.enum';

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne(() => Group, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'group_id' })
  group?: Group;

  @Column({ type: 'enum', enum: MatchPhase })
  faza!: MatchPhase;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_a_id' })
  teamA!: Team;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_b_id' })
  teamB!: Team;

  @Column({ nullable: true })
  rezultat_a?: number;

  @Column({ nullable: true })
  rezultat_b?: number;

  @Column({ type: 'timestamp', nullable: true })
  datum_termin?: Date;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.ZAKAZAN })
  status!: MatchStatus;

  @CreateDateColumn()
  created_at!: Date;
}
