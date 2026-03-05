import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bot_schedules')
export class BotScheduleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  botId: string;

  @Column()
  cronExpression: string;

  @Column({ default: 1 })
  intervalValue: number;

  @Column({ default: 'hours' })
  intervalUnit: string; // 'minutes', 'hours', 'days'

  @Column({ nullable: true })
  keywords: string;

  @Column({ nullable: true })
  level: string;

  @Column({ nullable: true })
  salary: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  company: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
