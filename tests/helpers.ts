// tests/helpers.ts
import { v4 as uuidv4 } from "uuid";

// Generate random user details with randomized first and last names.
export function generateRandomUser() {
  const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
  const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson"];

  const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];

  const randomSuffix = uuidv4().split("-")[0];

  return {
    first_name: randomFirst,
    last_name: randomLast,
    username: `${randomFirst.toLowerCase()}_${randomLast.toLowerCase()}_${randomSuffix}`,
    email: `${randomFirst.toLowerCase()}_${randomLast.toLowerCase()}_${randomSuffix}@example.com`,
    password: "TestPassword123!",
    user_type: "Basic",
  };
}

// Generate random event details with random name and location,
// and randomize totalTickets between 5 and 10.
export function generateRandomEvent() {
  const eventNames = [
    "Concert",
    "Festival",
    "Conference",
    "Workshop",
    "Meetup",
    "Exhibition",
    "Seminar",
    "Showcase"
  ];

  const eventLocations = [
    "Central Park",
    "Convention Center",
    "City Hall",
    "Downtown Arena",
    "Outdoor Stage",
    "Community Center",
    "Grand Theater",
    "Local Pub"
  ];

  const randomName = eventNames[Math.floor(Math.random() * eventNames.length)];
  const randomLocation = eventLocations[Math.floor(Math.random() * eventLocations.length)];

  const randomSuffix = uuidv4().split("-")[0];
  const randomTickets = Math.floor(Math.random() * (10 - 5 + 1)) + 5;

  return {
    name: `${randomName} ${randomSuffix}`,
    description: `This is a ${randomName.toLowerCase()} event held at ${randomLocation}.`,
    date: new Date(Date.now() + 86400000).toISOString(), // 1 day in the future
    location: randomLocation,
    totalTickets: randomTickets,
    ticket_price: 50.0,
    duration: 2,
  };
}
