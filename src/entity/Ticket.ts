import { Entity, ManyToOne } from "typeorm";
import { Event } from "./Event";
import { User } from "./User";
import { BaseModel } from "./BaseModel";

@Entity()
export class Ticket extends BaseModel{
  @ManyToOne(() => User, (user) => user.tickets)
  user: User;

  @ManyToOne(() => Event, (event) => event.tickets)
  event: Event;
}
