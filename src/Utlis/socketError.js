export const emitSocketError = (socket, error) => {
  socket.emit(CHAT_EVENTS.ERROR, {
    success: false,
    message: error.message,
    statusCode: error.cause || 500,
  });
};
