import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Team } from '../teams/team.entity';
import { User } from '../users/user.entity';
import { Position } from './position.enum';

@Entity()
export class Player {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  ime!: string;

  @Column()
  prezime!: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  broj_dresa!: number;

  @Column({ type: 'enum', enum: Position })
  pozicija!: Position;

  @Column({ type: 'date', nullable: true })
  datum_rodjenja?: string;

  @ManyToOne(() => Team, (team) => team.igraci, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  nalog?: User;

  @CreateDateColumn()
  created_at!: Date;
}
