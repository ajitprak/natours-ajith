const path = require('path');
const express = require('express');

const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/app-error');
const globalErrorHandler = require('./controllers/error-controller');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/review-routes');
const bookingRouter = require('./routes/booking-routes');
const bookingController = require('./controllers/booking-controller');
const viewsRouter = require('./routes/views-routes');
const { urlencoded } = require('express');

// Start Express
const app = express();

// we need this setting so that x-forwarded-proto header will be creectly set to https when we have https
// Does it create vulnerabilities
app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
// app.use(
//     cors({
//         origin: 'https://www.natours.com',
//     })
// );

// Here app.options is similar to app.get or app.post, options is just a verb
// * means it is applicable for all routes
app.options('*', cors());
// For a specifc route - only resources in this route will have access on cross orgin
// app.options('api/v1/tour/:id', cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// 1) GLOBAL Middlewares
// Security, Setting headers
// app.use(helmet()); // TODO commented out to support CSP - Ned to find another solution because we need security

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests, Please try again after 1 hour',
});
// Request limitter
app.use(limiter);

app.post('/webhook-checkout', express.raw({ type: 'application/json' }), bookingController.webhookCheckout);

// Body parser, copies the body into req.body, options:limits the amount of data in req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // To get values from form posts
// extended allows us to pass complex data

app.use(cookieParser());
// Data sanitize against No SQL injection
app.use(mongoSanitize());

// To prevent xs attacks
app.use(xss());

// To prevent parameter polution attacks
app.use(
    hpp({
        whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price'],
    })
);

// app.use((req, res, next) => {
//     console.log('Hello from the middleware');
//     next();
// });

app.use(compression());
// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// Routes
app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter); // reviewRouter is just a middleware fn lllr to others above ll get called for above route
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server`,
    // });
    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
