import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { TournamentStatus } from './tournament-status.enum';

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  naziv!: string;

  @Column()
  grad!: string;

  @Column({ nullable: true })
  lokacija?: string;

  @Column()
  broj_grupa!: number;

  @Column({
    type: 'enum',
    enum: TournamentStatus,
    default: TournamentStatus.PRIJAVE_OTVORENE,
  })
  status!: TournamentStatus;

  @Column({ type: 'date', nullable: true })
  datum_pocetka?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'kreirao_id' })
  kreirao?: User;

  @CreateDateColumn()
  created_at!: Date;
}
