import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { Event } from "./Event";
import { BaseModel } from "./BaseModel";

@Entity()
export class Payment extends BaseModel {
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Event)
  event: Event;

  @Column()
  transactionId: string;

  @Column()
  provider: string;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column()
  status: string;
}