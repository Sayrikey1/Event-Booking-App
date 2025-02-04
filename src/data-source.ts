import "reflect-metadata";
import { DataSource } from "typeorm";
import * as fs from 'fs';
import path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSGRES_HOST as string,
  port: parseInt(process.env.POSGRES_PORT as string),
  username: process.env.POSGRES_USERNAME as string,
  password: process.env.POSGRES_PASSWORD as string,
  database: process.env.POSGRES_DATABASE as string,
  synchronize: true,
  logging: false,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync("./ca.pem").toString(),
  },
  entities: [`${__dirname}/entity/*.ts`],
  migrations: [`${__dirname}/migration/*.ts`],
  subscribers: [`${__dirname}/subscriber/*.ts`],
});

export default AppDataSource;