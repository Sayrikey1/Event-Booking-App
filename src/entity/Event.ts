import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Ticket } from "./Ticket";
import { BaseModel } from "./BaseModel";
import { User } from "./User";
import { IsNotEmpty } from "class-validator";

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
  @IsNotEmpty({ message: "Event name is required" })
  name: string;

  @Column()
  @IsNotEmpty({ message: "Event description is required" })
  description: string;

  @Column()
  @IsNotEmpty({ message: "Event date is required" })
  date: Date;

  @Column({ type: "numeric", comment: "Duration in minutes" })
  @IsNotEmpty({ message: "Event duration is required" })
  duration: number;

  @Column({
    type: "enum",
    enum: EventStatus,
    default: EventStatus.ALLOWING_BOOKINGS
  })
  status: EventStatus;

  @Column()
  @IsNotEmpty({ message: "Event location is required" })
  location: string;

  @Column({ type: "numeric" })
  @IsNotEmpty({ message: "Event ticket price is required" })
  ticket_price: number;

  @Column({ type: "integer" })
  @IsNotEmpty({ message: "Event total tickets is required" })
  totalTickets: number;

  @Column({ type: "integer" })
  @IsNotEmpty({ message: "Event available tickets is required" })
  availableTickets: number;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @ManyToOne(() => User, (user) => user.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizer_id" })
  organizer: User;
}