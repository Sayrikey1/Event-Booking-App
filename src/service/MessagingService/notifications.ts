import { Server } from "socket.io";

const Notification = async (io: Server) => {
  console.log(`
     ------------   Notification service has been initialized  ---------------
        `);

  setInterval(() => {
    io.emit("open_notification", "Heyyyyyyoooo Fucking world!");
  }, 60000);


  setInterval(() => {
    io.to("1").emit("close_notification","Hello room 1")
  }, 10000);
  
  
  
};

export default Notification;





