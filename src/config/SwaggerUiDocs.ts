import swaggerJSDoc, { Options } from "swagger-jsdoc";
import path from "path";
import dotenv from "dotenv";


dotenv.config();
const ENV = process.env.ENV;
let servers;

if (process.env.DEPLOYMENT as string === "TRUE") {
  servers = [
    {
      url: process.env.PRODUCTION_URL,
      description: "Deployment server",
    }
  ]
} else {
  servers = [
    {
      url: `http://localhost:${process.env.PORT}/`,
      description: "Development server",
    },
    {
      url: `https://localhost:${process.env.HTTPS_PORT}/`,
      description: "Production server",
    },
  ]
}


// LINUX
const directoryPath = path.join(__dirname, "..", "routes", "*.ts");
// WINDOWS
// const directoryPath = path.join(__dirname, "..", "routes", "*.js").slice(1);

const decodedPath = decodeURIComponent(directoryPath);

console.log(`decoded path is swagSets`,decodedPath);
const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Green Barter API",
      version: "1.7.1",
      description: "This is the api for green barter",
      // contact: {
      //   name: "Patrick",
      //   url: "folio.vercel.app",
      //   email: "pmohammed@chamsswitch.com",
      // },
    },
    servers: servers,
    basePath: "/",
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    explorer: true,
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [decodedPath],
};

const swaggerconfig = swaggerJSDoc(options);
export default swaggerconfig;
