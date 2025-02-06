import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { startTime } from "../index";

const ConnectDatabse = (
  app: any,
  httpapp: any,
  PORT: number,
  HTTPS_PORT: number,
  uri: string
) => {
  AppDataSource.initialize()
    .then(() => {
      console.log("Data Source has been initialized!");
    })
    .then(
      app.listen(PORT, "0.0.0.0", async (req: Request, res: Response) => {
        console.log(`Server is running on port http://localhost:${PORT}/api/docs`);
      })
    )
    .then(
      httpapp.listen(
        HTTPS_PORT,
        "0.0.0.0",
        async (req: Request, res: Response) => {
          console.log(
            `Server is running on port https://localhost:${HTTPS_PORT}/api/docs`
          );
        }
      )
    )
    .then(() => {
      const endTime = performance.now(); // Capture end time
      console.log(`🚀 App started in ${(endTime - startTime).toFixed(2)} ms`);
    })
    .catch((error) =>
      console.log("Error during Data Source initialization", error)
    );
};
export default ConnectDatabse;


export const disconnectDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    try {
      await AppDataSource.destroy();
      console.log("Data Source has been disconnected!");
    } catch (error) {
      console.error("Error during Data Source disconnect", error);
    }
  }
};
