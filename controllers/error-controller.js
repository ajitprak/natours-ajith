const AppError = require('../utils/app-error');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path} : ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.keyValue;
    const message = `Duplicate field value ${JSON.stringify(value)}. Please use another value`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((val) => val.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid Token!. Please login again', 401);
const handleJWTExpiredError = () => new AppError('Token Expired!. Please login again', 401);

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message,
        });
    }
};

const sendErrorProd = (err, req, res) => {
    // Operational errors that we trust: send message to clent
    if (err.isOperational) {
        if (req.originalUrl.startsWith('/api')) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong',
                msg: err.message,
            });
        }
    } else {
        // Programing or other unknown errors; so we dont want to send it to the client
        // 1) Log the error
        console.error(err); // Use logs library in npm - heroku these errors are accesible

        // 2) send a generic message
        if (req.originalUrl.startsWith('/api')) {
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!',
            });
        } else {
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong',
                msg: 'Please try again later',
            });
        }
    }
};

module.exports = (err, req, res, next) => {
    // console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;
        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (err.code === 11000) error = handleDuplicateFieldsDB(error);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};
