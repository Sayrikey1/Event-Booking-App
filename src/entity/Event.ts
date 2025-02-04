import { Entity, Column, OneToMany } from "typeorm";
import { Ticket } from "./Ticket";
import { BaseModel } from "./BaseModel";

export enum EventStatus {
  ALLOWING_BOOKINGS = "ALLOWING_BOOKINGS",
  BOOKINGS_CLOSED = "BOOKINGS_CLOSED",
  EVENT_CANCELLED = "EVENT_CANCELLED",
  EVENT_ONGOING = "EVENT_ONGOING",
  EVENT_COMPLETED = "EVENT_COMPLETED"
}

@Entity()
export class Event extends BaseModel {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  date: Date;

  @Column({ type: "numeric", comment: "Duration in minutes" })
  duration: number;

  @Column({
    type: "enum",
    enum: EventStatus,
    default: EventStatus.ALLOWING_BOOKINGS
  })
  status: EventStatus;

  @Column()
  location: string;

  @Column({ type: "numeric" })
  ticket_price: number;

  @Column({ type: "integer" })
  totalTickets: number;

  @Column({ type: "integer" })
  availableTickets: number;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];
}