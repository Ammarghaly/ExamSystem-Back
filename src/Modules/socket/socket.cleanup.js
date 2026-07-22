import { CHAT_EVENTS } from "./events.js";

export const cleanupSocketState = (socket, typingTimers) => {
  if (!socket.typingKeys?.size) return;

  for (const key of socket.typingKeys) {
    const [groupId] = key.split(":");

    const timer = typingTimers.get(key);

    if (timer) {
      clearTimeout(timer);
      typingTimers.delete(key);
    }

    socket.to(groupId).emit(CHAT_EVENTS.STOP_TYPING, {
      groupId,
      userId: socket.user._id,
    });
  }

  socket.typingKeys.clear();
};
