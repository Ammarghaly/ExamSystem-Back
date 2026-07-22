import { SOCKET_EVENTS, CHAT_EVENTS } from "../socket/events.js";
import { cleanupSocketState } from "../socket/socket.cleanup.js";
import {
  validateGroupAccess,
  createMessageService,
  updateLastSeenService,
} from "./chat.service.js";
import socketAsyncHandler from "../socket/socketAsyncHandler.js";

const typingTimers = new Map();

export default function registerChatSocket(io) {
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    socket.typingKeys = new Set();
    console.log(`Socket Connected: ${socket.id}`);

    socket.on(
      CHAT_EVENTS.JOIN,
      socketAsyncHandler(socket, async (data, callback) => {
        const { groupId } = data;
        await validateGroupAccess(groupId, socket.user._id);
        socket.join(groupId);
        callback?.({
          status: "success",
          message: "Joined chat group",
        });
      }),
    );

    socket.on(
      CHAT_EVENTS.SEND,
      socketAsyncHandler(socket, async (data, callback) => {
        const { groupId, content } = data;
        await validateGroupAccess(groupId, socket.user._id);
        const message = await createMessageService({
          groupId,
          content,
          senderId: socket.user._id,
          senderType: socket.user.role,
        });
        io.to(groupId).emit(CHAT_EVENTS.RECEIVE, message);
        callback?.({
          success: true,
        });
      }),
    );

    socket.on(
      CHAT_EVENTS.TYPING,
      socketAsyncHandler(socket, async ({ groupId }) => {
        await validateGroupAccess(groupId, socket.user._id);
        const key = `${groupId}:${socket.user._id}`;
        const existingTimer = typingTimers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        } else {
          socket.to(groupId).emit(CHAT_EVENTS.TYPING, {
            groupId,
            user: {
              id: socket.user._id,
              name: socket.user.name,
              role: socket.user.role,
              avatar: socket.user.avatar,
            },
          });
        }

        const timer = setTimeout(() => {
          typingTimers.delete(key);
          socket.typingKeys.delete(key);
          socket.to(groupId).emit(CHAT_EVENTS.STOP_TYPING, {
            groupId,
            userId: socket.user._id,
          });
        }, 3000);

        typingTimers.set(key, timer);
        socket.typingKeys.add(key);
      }),
    );

    socket.on(
      CHAT_EVENTS.STOP_TYPING,
      socketAsyncHandler(socket, async ({ groupId }) => {
        await validateGroupAccess(groupId, socket.user._id);
        const key = `${groupId}:${socket.user._id}`;
        const existingTimer = typingTimers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
          typingTimers.delete(key);
          socket.typingKeys.delete(key);
          socket.to(groupId).emit(CHAT_EVENTS.STOP_TYPING, {
            groupId,
            userId: socket.user._id,
          });
        }
      }),
    );

    socket.on(
      CHAT_EVENTS.SEEN,
      socketAsyncHandler(socket, async ({ groupId, messageId }) => {
        const lastSeen = await updateLastSeenService({
          groupId,
          userId: socket.user._id,
          messageId,
        });
        if (!lastSeen) {
          return;
        }
        socket.to(groupId).emit(CHAT_EVENTS.SEEN, {
          groupId,
          userId: socket.user._id,
          messageId,
          seenAt: lastSeen.seenAt,
        });
      }),
    );

    socket.on(
      CHAT_EVENTS.LEAVE,
      socketAsyncHandler(socket, async ({ groupId }, callback) => {
        await validateGroupAccess(groupId, socket.user._id);
        socket.leave(groupId);
        callback?.({
          success: true,
          message: "Left chat group",
        });
      }),
    );

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      cleanupSocketState(socket, typingTimers);
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });
}
