const Tour = require('../models/tourModel');
const User = require('../models/user-model');
const Booking = require('../models/booking-model');
const catchAsync = require('../utils/catch-async');
const AppError = require('../utils/app-error');

exports.getAlerts = (req, res, next) => {
    const { alert } = req.query;
    if (alert === 'booking') {
        res.locals.alert =
            "Booking Successful, Please check your email for confirmation. If it doesn't show Please wait for sometime and reload";
    }

    next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
    const tours = await Tour.find();
    if (!tours) {
        return next(new AppError('No tours found', 404));
    }
    res.status(200).render('overview', {
        title: 'All Tours',
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const {
        params: { slug },
    } = req;
    if (!slug) {
        next(new AppError('Please specify a tour', 400));
    }
    const tour = await Tour.findOne({ slug }).populate({ path: 'reviews', select: 'review rating user' });

    if (!tour) {
        return next(new AppError('No tour with that name', 404));
    }

    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour,
    });
});

exports.getLogin = (req, res) => {
    res.status(200).render('login', { title: 'Log into your Account' });
};

exports.getCurrentAccountPage = (req, res) => {
    res.status(200).render('account', { title: 'Your Account' });
};

exports.getMyTours = catchAsync(async (req, res) => {
    const bookings = await Booking.find({ user: req.user.id });

    const tourIds = bookings.map((booking) => booking.tour);
    // A very handy way of getting all documents with array of Ids $in operator
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const { email, name } = req.body;
    if (!email || !name) {
        return next(new AppError('User name or Email cannot be empty', 400));
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name,
            email,
        },
        {
            new: true,
            runValidators: true,
        }
    );
    res.status(200).render('account', { title: 'Your Account', user: updatedUser });
});
