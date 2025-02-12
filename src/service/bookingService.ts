import dotenv from "dotenv";
import QRCode from "qrcode";
import { StatusCodes } from "http-status-codes";
import AppDataSource from "../data-source";
import { Ticket } from "../entity/Ticket";
import { WaitingList } from "../entity/WaitingList";
import { ICreateBooking, IUpdateBooking } from "src/types";
import { Event, EventStatus } from "../entity/Event";
import { User } from "../entity/User";
import { mailer } from "../config/Mailer";
import { handleError } from '../utils/serviceUtils';  // Import the handleError function

dotenv.config();

export interface IBooking {
  CreateBooking: (userId: string, load: ICreateBooking) => Promise<any>;
  GetBooking: (userId: string, id: string) => Promise<any>;
  GetAllBookings: (userId: string) => Promise<any>;
  DeleteBooking: (userId: string, id: string) => Promise<any>;
  DeleteAllBookings: (userId: string, event_id: string) => Promise<any>;
}

export class BookingService implements IBooking {
  private userRepo = AppDataSource.getRepository(User);
  private eventRepo = AppDataSource.getRepository(Event);
  private ticketRepo = AppDataSource.getRepository(Ticket);
  private waitingListRepo = AppDataSource.getRepository(WaitingList);

  private async getUserById(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  private async getEventById(eventId: string) {
    const event = await this.eventRepo.findOneBy({ id: eventId });
    if (!event) {
      throw new Error("Event not found");
    }
    return event;
  }

  private async createTicketsForUser(event: Event, user: User, ticketCount: number) {
    const ticketsToCreate = [];
    for (let i = 0; i < ticketCount; i++) {
      const ticket = this.ticketRepo.create({ event, user });
      ticketsToCreate.push(ticket);
    }
    await this.ticketRepo.save(ticketsToCreate);
    return ticketsToCreate;
  }

  private async updateEventTickets(event: Event, ticketCount: number) {
    event.availableTickets -= ticketCount;
    await this.eventRepo.save(event);
  }

  private async sendConfirmationEmail(
    user: User,
    event: Event,
    ticketCount: number,
    ticketIds: string[]
  ): Promise<void> {
    try {
      // Generate QR code data URLs for each ticket
      const qrCodes: { ticketId: string, qrCode: string }[] = [];
      for (let i = 0; i < ticketIds.length; i++) {
        const ticketData = JSON.stringify({
          ticketId: ticketIds[i],
          userId: user.id,
          eventName: event.name,
          eventDate: event.date,
        });

        const qrCodeDataUrl = await QRCode.toDataURL(ticketData);
        qrCodes.push({
          ticketId: ticketIds[i],
          qrCode: qrCodeDataUrl,
        });
      }

      // Prepare the email template data
      const templateData = {
        userName: user.first_name + " " + user.last_name,
        eventName: event.name,
        eventDate: event.date.toLocaleString(),
        ticketCount: ticketCount.toString(),
        ticketIds: ticketIds.join(", "),
        qrCodes: qrCodes,
      };

      // Send the confirmation email with QR code attachments
      await mailer({
        mail: user.email,
        subject: "Booking Confirmation",
        template: "bookingConfirmation",
        templateData: templateData,
        attachments: qrCodes.map((code) => ({
          filename: `${code.ticketId}.png`,
          content: code.qrCode.split(",")[1], // Extract base64 content from the data URL
          encoding: "base64",
          cid: `${code.ticketId}.png`,  // Must match the CID used in the template
        })),
      });
    } catch (error: any) {
      console.error("Error sending confirmation email:", error.message);
    }
  }

  private async sendWaitingAssignmentEmail(
    user: User,
    event: Event,
    ticketCount: number,
    ticketIds: string[]
  ): Promise<void> {
    try {
      // Generate QR code data URLs for each ticket
      const qrCodes: { ticketId: string, qrCode: string }[] = [];
      for (let i = 0; i < ticketIds.length; i++) {
        const ticketData = JSON.stringify({
          ticketId: ticketIds[i],
          userId: user.id,
          eventName: event.name,
          eventDate: event.date,
        });

        const qrCodeDataUrl = await QRCode.toDataURL(ticketData);
        qrCodes.push({
          ticketId: ticketIds[i],
          qrCode: qrCodeDataUrl,
        });
      }

      // Prepare the email template data
      const templateData = {
        userName: user.first_name + " " + user.last_name,
        eventName: event.name,
        eventDate: event.date.toLocaleString(),
        ticketCount: ticketCount.toString(),
        ticketIds: ticketIds.join(", "),
        qrCodes: qrCodes,
      };

      // Send the waiting list assignment email with QR code attachments
      await mailer({
        mail: user.email,
        subject: "Ticket Assignment from Waiting List",
        template: "waitingAssignment",
        templateData: templateData,
        attachments: qrCodes.map((code) => ({
          filename: `${code.ticketId}.png`,
          content: code.qrCode.split(",")[1], // Extract base64 content from the data URL
          encoding: "base64",
          cid: `${code.ticketId}.png`, // Must match the CID used in the template
        })),
      });
    } catch (error: any) {
      console.error("Error sending waiting assignment email:", error.message);
    }
  }

  private async handleWaitingList(event: Event, user: User, ticketCount: number) {
    const waitingList = this.waitingListRepo.create({ event, user, ticket_count: ticketCount });
    await this.waitingListRepo.save(waitingList);
    return {
      status: StatusCodes.CREATED,
      message: "Tickets are not available. You have been added to the waiting list",
    };
  }

  async CreateBooking(userId: string, load: ICreateBooking) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.getUserById(userId);
      if (!user) {
        await queryRunner.rollbackTransaction();
        return { status: StatusCodes.NOT_FOUND, message: "User not found" };
      }

      // Fetch event with user relation loaded
      const event = await queryRunner.manager
        .createQueryBuilder(Event, "event")
        .innerJoinAndSelect("event.user", "user")
        .setLock("pessimistic_write")
        .where("event.id = :id", { id: load.event_id })
        .getOne();

      if (!event) {
        await queryRunner.rollbackTransaction();
        return { status: StatusCodes.NOT_FOUND, message: "Event not found" };
      }

      // Prevent event creator from booking their own event.
      if (event.user.id === userId) {
        await queryRunner.rollbackTransaction();
        return { status: StatusCodes.FORBIDDEN, message: "You cannot book your own event" };
      }

      // CASE 1: No tickets available → add all requested to waiting list.
      if (event.availableTickets === 0) {
        await queryRunner.rollbackTransaction();
        return await this.handleWaitingList(event, user, load.ticket_count);
      }

      // CASE 2: Partial assignment → availableTickets is less than requested but > 0.
      if (event.availableTickets < load.ticket_count) {
        const assignedCount = event.availableTickets; // All remaining tickets will be assigned.
        const waitingCount = load.ticket_count - assignedCount;

        // Create tickets for the available amount.
        const ticketsToCreate = [];
        for (let i = 0; i < assignedCount; i++) {
          const ticket = this.ticketRepo.create({ event, user });
          ticketsToCreate.push(ticket);
        }
        await queryRunner.manager.save(ticketsToCreate);

        // Exhaust the tickets and update event status.
        event.availableTickets = 0;
        event.status = EventStatus.BOOKINGS_CLOSED;
        await queryRunner.manager.save(event);

        await queryRunner.commitTransaction();

        // Send confirmation email for the assigned tickets.
        const ticketIds = ticketsToCreate.map(ticket => ticket.id);
        await this.sendConfirmationEmail(user, event, assignedCount, ticketIds);

        // Add the remaining tickets to the waiting list.
        await this.handleWaitingList(event, user, waitingCount);

        return {
          status: StatusCodes.CREATED,
          message: "Partial booking assigned; remaining tickets added to waiting list",
          id: ticketIds,
        };
      }

      // CASE 3: Full assignment → enough tickets available.
      {
        const ticketsToCreate = [];
        for (let i = 0; i < load.ticket_count; i++) {
          const ticket = this.ticketRepo.create({ event, user });
          ticketsToCreate.push(ticket);
        }
        await queryRunner.manager.save(ticketsToCreate);

        event.availableTickets -= load.ticket_count;
        if (event.availableTickets <= 0) {
          event.status = EventStatus.BOOKINGS_CLOSED;
        }
        await queryRunner.manager.save(event);

        await queryRunner.commitTransaction();

        const ticketIds = ticketsToCreate.map(ticket => ticket.id);
        await this.sendConfirmationEmail(user, event, load.ticket_count, ticketIds);

        return {
          status: StatusCodes.CREATED,
          message: "Booking created successfully",
          id: ticketIds,
        };
      }
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: err.message || "Internal server error",
      };
    } finally {
      await queryRunner.release();
    }
  }

  async GetBooking(userId: string, id: string) {
    try {
      const user = await this.getUserById(userId);

      const ticket = await this.ticketRepo.findOneBy({ id });
      if (!ticket) {
        return {
          status: StatusCodes.NOT_FOUND,
          message: "Ticket not found",
          id: "",
        };
      }

      return {
        status: StatusCodes.OK,
        message: "Ticket found",
        id: ticket.id,
      };
    } catch (err: any) {
      return handleError(err);
    }
  }

  async GetAllBookings(userId: string) {
    try {
      const user = await this.getUserById(userId);
      const tickets = await this.ticketRepo.find({
        where: { user: { id: userId } },
        // Optionally, load relations if needed
        relations: ["event"]
      });
      return {
        status: StatusCodes.OK,
        message: "Tickets found",
        bookings: tickets,
      };
    } catch (err: any) {
      return handleError(err);
    }
  }

  async DeleteBooking(userId: string, id: string) {
    try {
      const user = await this.getUserById(userId);

      const ticket = await this.ticketRepo.findOne({
        where: { id },
        relations: ["event"]
      });
      if (!ticket) {
        return {
          status: StatusCodes.NOT_FOUND,
          message: "Ticket not found",
          id: "",
        };
      }

      const { event } = ticket;
      if (!event) {
        return {
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          message: "Associated event not found for this ticket",
          id: "",
        };
      }

      await this.ticketRepo.delete({ id });
      await this.updateEventTickets(event, -1);

      console.log("Fetching waiting list for event ID:", event.id);
      const waitingList = await this.waitingListRepo.find({
        where: { event: { id: event.id } },
        order: { created_at: "ASC" },
        relations: ["user"],
      });
      console.log("Waiting list entries found:", waitingList);

      if (waitingList.length > 0) {
        let remainingTickets = 1; // One ticket was freed.
        for (const entry of waitingList) {
          // Determine the number of tickets to assign to this waiting list entry.
          const ticketsToAssign = Math.min(remainingTickets, entry.ticket_count);
          const newTicket = this.ticketRepo.create({ event, user: entry.user });
          await this.ticketRepo.save(newTicket);
          await this.updateEventTickets(event, ticketsToAssign);

          // If more than one ticket was requested in the waiting list, update the ticket_count; otherwise, delete the entry.
          if (entry.ticket_count > ticketsToAssign) {
            entry.ticket_count -= ticketsToAssign;
            await this.waitingListRepo.save(entry);
          } else {
            await this.waitingListRepo.delete({ id: entry.id });
          }
          // Send the waiting assignment email with the newly assigned ticket(s).
          await this.sendWaitingAssignmentEmail(entry.user, event, ticketsToAssign, [newTicket.id]);

          remainingTickets -= ticketsToAssign;
          if (remainingTickets <= 0) break;
        }
      }

      return {
        status: StatusCodes.OK,
        message: "Ticket deleted successfully and waiting list users notified",
        id: ticket.id,
      };
    } catch (err: any) {
      return handleError(err);
    }
  }

  async DeleteAllBookings(userId: string, event_id: string) {
    try {
      const user = await this.getUserById(userId);
      const event = await this.getEventById(event_id);

      // Get all tickets for the user for the specified event.
      const tickets = await this.ticketRepo.find({ where: { user, event } });
      const ticketCount = tickets.length;
      if (ticketCount === 0) {
        return {
          status: StatusCodes.NOT_FOUND,
          message: "No bookings found for this user",
        };
      }

      // Delete the user's tickets.
      await this.ticketRepo.delete({ user, event });

      // Increase available tickets for the event by the number of deleted tickets.
      await this.updateEventTickets(event, -ticketCount);

      // Check the waiting list and assign tickets to waiting users.
      const waitingList = await this.waitingListRepo.find({
        where: { event },
        order: { created_at: "ASC" },
        relations: ["user"],
      });

      for (const waitingEntry of waitingList) {
        // Calculate how many tickets to assign for this waiting list entry.
        const ticketsToAssign = Math.min(waitingEntry.ticket_count, event.availableTickets);
        if (ticketsToAssign > 0) {
          // Create tickets for the waiting list user.
          const ticketsToCreate = await this.createTicketsForUser(event, waitingEntry.user, ticketsToAssign);
          // Update event's available tickets.
          await this.updateEventTickets(event, ticketsToAssign);
          // Send email notification with assigned tickets.
          const assignedTicketIds = ticketsToCreate.map(ticket => ticket.id);
          await this.sendWaitingAssignmentEmail(waitingEntry.user, event, ticketsToAssign, assignedTicketIds);

          // If the waiting entry was fully satisfied, remove it; otherwise update ticket_count.
          if (waitingEntry.ticket_count <= ticketsToAssign) {
            await this.waitingListRepo.delete({ id: waitingEntry.id });
          } else {
            waitingEntry.ticket_count -= ticketsToAssign;
            await this.waitingListRepo.save(waitingEntry);
          }
        }
      }

      return {
        status: StatusCodes.OK,
        message: "All bookings deleted and waiting list users notified",
      };
    } catch (err: any) {
      return handleError(err);
    }
  }
}
