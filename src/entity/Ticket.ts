import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Event } from "./Event";
import { User } from "./User";
import { BaseModel } from "./BaseModel";

@Entity()
export class Ticket extends BaseModel{
  @ManyToOne(() => User, (user) => user.tickets)
  @JoinColumn({ name: "user_id" })  // Explicitly define the column mapping
  user: User;

  @ManyToOne(() => Event, (event) => event.tickets)
  @JoinColumn({ name: "event_id" })  // Explicitly define the column mapping
  event: Event;
}
