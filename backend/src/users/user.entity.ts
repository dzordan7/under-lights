import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Role } from './role.enum';

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

  @CreateDateColumn()
  created_at!: Date;
}
