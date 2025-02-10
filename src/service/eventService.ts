import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import { AppDataSource } from "../data-source";
import { ICreateEvent, IUpdateEvent } from "src/types";
import { Event } from "../entity/Event";
import { handleError, updateEntity } from "../utils/serviceUtils";
import { User } from "../entity/User";

dotenv.config();

export interface IEvent {
    CreateEvent: (userId: string, load: ICreateEvent) => Promise<any>;
    GetEvent: (id: string) => Promise<any>;
    GetAllEvents: () => Promise<any>;
    UpdateEvent: (userId: string, load: IUpdateEvent) => Promise<any>;
    DeleteEvent: (userId: string, id: string) => Promise<any>;
    GetEventWaitlist: (eventId: string) => Promise<any>;
}

export class EventService implements IEvent {
    private userRepository = AppDataSource.getRepository(User)
    private eventRepository = AppDataSource.getRepository(Event);

    private async findEventById(id: string) {
        return this.eventRepository.findOne({ where: { id }, relations: ["user"] });
      }
      

    private async checkEventOwnership(event: Event, userId: string) {
        if (event.user.id !== userId) {
            throw new Error("You are not authorized to modify this event");
        }
    }

    async CreateEvent(userId: string, load: ICreateEvent) {
        try {
            // Find the user by the userId
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    message: "User not found",
                };
            }
    
            // Create the event with the user that created it
            const event = this.eventRepository.create({
                ...load,
                availableTickets: load.totalTickets,
                user: user, // Set the user who created the event
            });
    
            // Save the event
            const createdEvent = await this.eventRepository.save(event);
    
            return {
                status: StatusCodes.CREATED,
                message: "Event created successfully",
                id: createdEvent.id,
            };
        } catch (err: any) {
            return handleError(err);
        }
    }
    

    async GetEvent(id: string) {
        try {
            const event = await this.findEventById(id);
            if (!event) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    message: "Event not found",
                    id: "",
                };
            }
            return {
                status: StatusCodes.OK,
                message: "Event found",
                event,
            };
        } catch (err: any) {
            return handleError(err);
        }
    }

    async GetAllEvents() {
        try {
            const events = await this.eventRepository.find();
            return {
                status: StatusCodes.OK,
                message: "Events found",
                events,
            };
        } catch (err: any) {
            return handleError(err);
        }
    }

    async UpdateEvent(userId: string, load: IUpdateEvent) {
        try {
            const event = await this.findEventById(load.id);
            if (!event) {
                return { status: StatusCodes.NOT_FOUND, message: "Event not found" };
            }
    
            await this.checkEventOwnership(event, userId);
    
            // Use the updateEntity utility to update the event entity
            updateEntity(event, load);
    
            await this.eventRepository.save(event);
            return { status: StatusCodes.OK, message: "Event updated successfully", id: event.id };
        } catch (err: any) {
            return handleError(err); // Handle error as before
        }
    }

    async DeleteEvent(userId: string, id: string) {
        try {
            const event = await this.findEventById(id);
            if (!event) {
                return { status: StatusCodes.NOT_FOUND, message: "Event not found" };
            }

            await this.checkEventOwnership(event, userId);

            await this.eventRepository.delete(id);
            return { status: StatusCodes.OK, message: "Event deleted successfully" };
        } catch (err: any) {
            return handleError(err);
        }
    }

    async GetEventWaitlist(eventId: string) {
        try {
            const event = await this.findEventById(eventId);
            if (!event) {
                return { status: StatusCodes.NOT_FOUND, message: "Event not found" };
            }

            const waitlist = event.waitlist;
            return { status: StatusCodes.OK, message: "Waitlist found", waitlist };
        } catch (err: any) {
            return handleError(err);
        }
    }
}
