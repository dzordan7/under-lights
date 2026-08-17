import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Team } from '../teams/team.entity';
import { Tournament } from './tournament.entity';
import { RegistrationStatus } from './registration-status.enum';

@Entity()
@Unique(['team', 'tournament'])
export class TeamTournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.NA_CEKANJU,
  })
  status_prijave!: RegistrationStatus;

  @Column({ default: 0 })
  odigrano!: number;

  @Column({ default: 0 })
  pobede!: number;

  @Column({ default: 0 })
  neresenio!: number;

  @Column({ default: 0 })
  porazi!: number;

  @Column({ default: 0 })
  postignuti_golovi!: number;

  @Column({ default: 0 })
  primljeni_golovi!: number;

  @Column({ default: 0 })
  bodovi!: number;

  @CreateDateColumn()
  created_at!: Date;
}
