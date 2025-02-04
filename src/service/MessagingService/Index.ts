import { Server } from "socket.io";
import Notification from "./notifications";


const NotificationJob = async(io: Server) => {
    console.log("Notifications job is initialized");
    await Notification(io);

  };
  
  export default NotificationJob;