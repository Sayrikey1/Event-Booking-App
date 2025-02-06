# Event Ticket Booking App 🎟️🎉

## Overview

The Event Ticket Booking App is a comprehensive solution for managing and booking tickets for various events. Built with TypeScript, Node.js, TypeORM, and PostgreSQL, this application provides a robust and scalable platform for event organizers and attendees.

## Features ✨

- 🛡️ User authentication and authorization
- 📅 Event creation and management
- 🎫 Ticket booking and payment processing
- 🔔 Real-time notifications and updates
- 🔒 Secure data handling and encryption

## Architecture 🏗️

The architecture of the Event Ticket Booking App is designed to be modular and scalable. The main components include:

1. **Backend**: Built with Node.js and TypeScript, the backend handles all the business logic, data processing, and API endpoints.
2. **Database**: PostgreSQL is used as the primary database, managed through TypeORM for object-relational mapping.
3. **Services**: Various services handle specific functionalities such as user management, event management, booking, and payment processing.
4. **Middleware**: Custom middleware for authentication, authorization, and encryption ensures secure and efficient request handling.
5. **Entities**: TypeORM entities represent the database tables and are used for data manipulation and querying.

## Project Structure 📂

```plaintext
.
├── .gitignore
├── .env
├── README.md
├── jest.config.ts
├── jest.setup.ts
├── package.json
├── tsconfig.json
├── src
│   ├── config
│   │   ├── Database.ts
│   │   ├── SwaggerUiDocs.ts
│   │   ├── Mailer.ts
│   │   ├── logger.ts
│   │   ├── Multer.ts
│   │   ├── Socket.ts
│   │   ├── sslConfig.ts
│   │   ├── Sms.ts
│   │   └── parseCsv.ts
│   ├── controller
│   │   ├── bookingController.ts
│   │   ├── paymentController.ts
│   │   ├── encryptionController.ts
│   │   ├── eventController.ts
│   │   └── userController.ts
│   ├── entity
│   │   ├── BaseModel.ts
│   │   ├── Event.ts
│   │   ├── Message.ts
│   │   ├── Otp.ts
│   │   ├── Payment.ts
│   │   ├── Ticket.ts
│   │   ├── User.ts
│   │   └── WaitingList.ts
│   ├── middlewares
│   │   ├── TokenVerification.ts
│   │   ├── AdminAuth.ts
│   │   ├── Encryption.ts
│   │   └── IsOwner.ts
│   ├── routes
│   │   ├── bookingRouter.ts
│   │   ├── userRouter.ts
│   │   ├── eventRouter.ts
│   │   ├── paymentRouter.ts
│   │   └── encryptionRouter.ts
│   ├── service
│   │   ├── eventService.ts
│   │   ├── bookingService.ts
│   │   ├── userService.ts
│   │   ├── MessagingService
│   │   │   ├── Index.ts
│   │   │   ├── notifications.ts
│   │   │   └── messaging.ts
│   │   ├── PaymentService
│   │   │   ├── paymentFactory.ts
│   │   │   ├── paystackPaymentService.ts
│   │   │   └── stripePaymentService.ts
│   ├── templates
│   │   ├── passwordReset.html
│   │   ├── bookingConfirmation.html
│   │   ├── otpTemplate.html
│   │   ├── accountVerifiedTemplate.html
│   │   └── waitingAssignment.html
│   ├── utils
│   │   ├── serviceUtils.ts
│   │   ├── authUtils.ts
│   │   └── otpGenerator.ts
│   ├── data-source.ts
│   ├── index.ts
│   ├── redis-client.ts
│   └── types.ts
└── tests
    └── userRoutes.test.ts
```

## Installation 🛠️

1. Clone the repository:
   ```bash
   git clone https://github.com/Sayrikey1/event-ticket-booking.git
   cd event-ticket-booking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a 

.env

 file in the root directory and add the necessary environment variables:
   ```plaintext
   POSGRES_HOST=your_postgres_host
   POSGRES_PORT=your_postgres_port
   POSGRES_USERNAME=your_postgres_username
   POSGRES_PASSWORD=your_postgres_password
   POSGRES_DATABASE=your_postgres_database
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Run the project:
   ```bash
   npm start
   ```

## Running Tests 🧪

To run the tests, use the following command:
```bash
npm test
```

## Deployment 🚀

The application is deployed at [Deployment Link](http://your-deployment-link.com).

## Contributing 🤝

Contributions are welcome! Please fork the repository and submit a pull request.

## License 📄

This project is licensed under the MIT License.

## Author 👨‍💻

Developed by [Sayrikey1](https://github.com/Sayrikey1).