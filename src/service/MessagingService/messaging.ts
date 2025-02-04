import { Server } from "socket.io";
import { Message } from "../../entity/Message";

const ChatHandler = async (io: Server, message: Message) => {
  io.to(message.room_id).emit("receive_message",`${message.message_text}`);
};

export default ChatHandler;
