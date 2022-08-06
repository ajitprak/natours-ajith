class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Only our errors will have this property, so programing errors or some other errors wil not

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
