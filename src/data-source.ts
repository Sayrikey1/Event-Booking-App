import "reflect-metadata";
import { DataSource } from "typeorm";
import fs from 'fs';
import path from 'path';

// Check if we're in test mode.
const isTest = process.env.NODE_ENV === 'test';

// Use test environment variables if in test mode, otherwise use production variables.
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: isTest
    ? process.env.TEST_POSTGRES_HOST as string
    : process.env.POSTGRES_HOST as string,
  port: isTest
    ? parseInt(process.env.TEST_POSTGRES_PORT as string, 10)
    : parseInt(process.env.POSTGRES_PORT as string, 10),
  username: isTest
    ? process.env.TEST_POSTGRES_USERNAME as string
    : process.env.POSTGRES_USERNAME as string,
  password: isTest
    ? process.env.TEST_POSTGRES_PASSWORD as string
    : process.env.POSTGRES_PASSWORD as string,
  database: isTest
    ? process.env.TEST_POSTGRES_DATABASE as string
    : process.env.POSTGRES_DATABASE as string,
  
  // You might want to have different synchronize or logging settings in test mode.
  synchronize: true,
  logging: false,
  
  // In test mode you might not need SSL.
  ssl: isTest
    ? false
    : {
        rejectUnauthorized: false,
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem')).toString(),
      },
  
  // Use a glob pattern that loads both .ts and .js files
  entities: [path.join(__dirname, 'entity', '*.{ts,js}')],
  migrations: [path.join(__dirname, 'migration', '*.{ts,js}')],
  subscribers: [path.join(__dirname, 'subscriber', '*.{ts,js}')],
});

export default AppDataSource;
