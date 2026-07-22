class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.cause = statusCode;
  }
}

export default AppError;
