import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Role } from './role.enum';
import { Team } from 'src/teams/team.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column()
  ime!: string;

  @Column({ type: 'enum', enum: Role })
  uloga!: Role;

  @OneToOne(() => Team, (team) => team.kapiten)
  tim?: Team;

  @CreateDateColumn()
  created_at!: Date;
}
