import { emitSocketError } from "../../Utlis/socketError.js";

export default function socketAsyncHandler(socket, handler) {
  return async (...args) => {
    const lastArg = args[args.length - 1];
    const callback = typeof lastArg === "function" ? lastArg : null;

    try {
      await handler(...args);
    } catch (error) {
      const payload = {
        success: false,
        message: error.message,
        statusCode: error.cause || 500,
      };

      if (callback) {
        return callback(payload);
      }

      emitSocketError(socket, error);
    }
  };
}

