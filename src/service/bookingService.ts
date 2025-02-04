import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import AppDataSource from "src/data-source";
import { Ticket } from "src/entity/Ticket";
import { WaitingList } from "src/entity/WaitingList";
import { ICreateBooking, IUpdateBooking } from "src/types";
import { Event } from "../entity/Event";
import { User } from "src/entity/User";
import { mailer } from "src/config/Mailer";
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

    private async sendConfirmationEmail(user: User, ticketCount: number, ticketIds: string[]) {
        mailer({
            mail: user.email,
            subject: "Booking Confirmation",
            text: `Your booking has been confirmed. You have successfully booked ${ticketCount} tickets for the event. Your ticket IDs are: ${ticketIds.join(', ')}`,
        });
    }

    private async handleWaitingList(event: Event, user: User, ticketCount: number) {
        const waitingList = this.waitingListRepo.create({ event, user, ticket_count: ticketCount });
        await this.waitingListRepo.save(waitingList);
        return {
            status: StatusCodes.OK,
            message: "Tickets are not available. You have been added to the waiting list",
        };
    }

    async CreateBooking(userId: string, load: ICreateBooking) {
        try {
            const user = await this.getUserById(userId);
            const event = await this.getEventById(load.event_id);

            if (event.availableTickets < load.ticket_count) {
                return await this.handleWaitingList(event, user, load.ticket_count);
            }

            const ticketsToCreate = await this.createTicketsForUser(event, user, load.ticket_count);
            await this.updateEventTickets(event, load.ticket_count);

            const ticketIds = ticketsToCreate.map(ticket => ticket.id);
            await this.sendConfirmationEmail(user, load.ticket_count, ticketIds);

            return {
                status: StatusCodes.CREATED,
                message: "Booking created successfully",
                id: ticketIds,
            };
        } catch (err: any) {
            return handleError(err);  // Use handleError for consistent error handling
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
            return handleError(err);  // Use handleError for consistent error handling
        }
    }

    async GetAllBookings(userId: string) {
        try {
            const user = await this.getUserById(userId);
            const tickets = await this.ticketRepo.find({ where: { user: user } });
            return {
                status: StatusCodes.OK,
                message: "Tickets found",
                bookings: tickets,
            };
        } catch (err: any) {
            return handleError(err);  // Use handleError for consistent error handling
        }
    }

    async DeleteBooking(userId: string, id: string) {
        try {
            const user = await this.getUserById(userId);
    
            // Find the ticket by its ID
            const ticket = await this.ticketRepo.findOneBy({ id });
            if (!ticket) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    message: "Ticket not found",
                    id: "",
                };
            }
    
            const { event } = ticket;
    
            // Delete the ticket and update the event's ticket count
            await this.ticketRepo.delete({ id });
            await this.updateEventTickets(event, -1);
    
            // Check and process the waiting list
            const waitingList = await this.waitingListRepo.find({ where: { event }, order: { created_at: "ASC" } });
            if (waitingList.length > 0) {
                let remainingTickets = 1;
                for (const entry of waitingList) {
                    // Check if the current waiting user has enough ticket count
                    const ticketsToAssign = Math.min(remainingTickets, entry.ticket_count);
                    const newTicket = this.ticketRepo.create({
                        event,
                        user: entry.user,
                    });
    
                    // Create the ticket and send email if there are tickets to assign
                    await this.ticketRepo.save(newTicket);
                    await this.updateEventTickets(event, ticketsToAssign);
                    await this.waitingListRepo.delete({ id: entry.id });
    
                    await this.sendConfirmationEmail(entry.user, ticketsToAssign, [newTicket.id]);
    
                    // Reduce remaining tickets to allocate
                    remainingTickets -= ticketsToAssign;
    
                    // Break the loop if there are no more tickets to assign
                    if (remainingTickets <= 0) break;
                }
            }
    
            return {
                status: StatusCodes.OK,
                message: "Ticket deleted successfully",
                id: ticket.id,
            };
        } catch (err: any) {
            return handleError(err);  // Use handleError for consistent error handling
        }
    }
    
    async DeleteAllBookings(userId: string, event_id: string) {
        try {
            const user = await this.getUserById(userId);
            const event = await this.getEventById(event_id);
    
            // Get all tickets for the user for the specified event
            const tickets = await this.ticketRepo.find({ where: { user, event } });
            const ticketCount = tickets.length;
            if (ticketCount === 0) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    message: "No bookings found for this user",
                };
            }
    
            // Delete the user's tickets
            await this.ticketRepo.delete({ user, event });
    
            // Update available tickets for the event
            await this.updateEventTickets(event, -ticketCount);
    
            // Check the waiting list and assign tickets to waiting users
            const waitingList = await this.waitingListRepo.find({
                where: { event },
                order: { created_at: "ASC" },  // Ensure waiting list is in the order it was created
            });
    
            let availableTickets = event.availableTickets;
            for (const waitingEntry of waitingList) {
                if (availableTickets <= 0) break;  // No more tickets to assign
    
                const ticketsToAssign = Math.min(waitingEntry.ticket_count, availableTickets);
                // Create tickets for the user on the waiting list
                const ticketsToCreate = await this.createTicketsForUser(event, waitingEntry.user, ticketsToAssign);
    
                // Update the available tickets in the event
                availableTickets -= ticketsToAssign;
                await this.updateEventTickets(event, ticketsToAssign);
    
                // Send email to the user notifying them of their assigned tickets
                const ticketIds = ticketsToCreate.map(ticket => ticket.id);
                await this.sendConfirmationEmail(waitingEntry.user, ticketsToAssign, ticketIds);
    
                // If the user has received all tickets they requested, remove from waiting list
                if (waitingEntry.ticket_count <= ticketsToAssign) {
                    await this.waitingListRepo.delete({ id: waitingEntry.id });
                } else {
                    // Update the waiting list count for this user
                    waitingEntry.ticket_count -= ticketsToAssign;
                    await this.waitingListRepo.save(waitingEntry);
                }
            }
    
            return {
                status: StatusCodes.OK,
                message: "All bookings deleted and tickets reassigned to waiting list users successfully",
            };
        } catch (err: any) {
            return handleError(err);  // Use handleError for consistent error handling
        }
    }  
}
