const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('../models/tourModel');
const User = require('../models/user-model');
const Booking = require('../models/booking-model');
const catchAsync = require('../utils/catch-async');
const factory = require('./handler-factory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], // There are other payment types, Here card indicated credit card
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${tour._id}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/?tour`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email, // Current customer's email - Curr user's email
        client_reference_id: req.params.tourId, // custom field where we can spicify info abt the current session
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary, // All these are parameters that stripe requires
                images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`], // Must be a live image( image hosted somewhere)
                amount: tour.price * 100, // Need to convert it to cents or paisa
                currency: 'inr',
                quantity: 1, // The quantity of items purchased
            },
        ],
    });

    // 3) Send back the session
    res.status(200).json({
        status: 'success',
        session,
    });
    // res.redirect(303, session.url);
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     const { tour, user, price } = req.query;

//     if (!tour && !user && !price) return next();

//     await Booking.create({
//         tour,
//         user,
//         price,
//     });

//     res.redirect(req.originalUrl.split('?')[0]);
// });
const createBooking = catchAsync(async (session) => {
    // We have set all these values when we configure stripe above
    const tour = session.client_reference_id;
    const user = (await User.find({ email: session.customer_email })).id;
    const price = session.display_items[0].amount / 100; // We should loop thru line_items and create multiple bookings if there are

    await Booking.create({
        tour,
        user,
        price,
    });
});

exports.webhookCheckout = async (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        res.status(400).send(`Webhook error ${error.message}`);
    }
    if (event.type === 'checkout.session.completed') {
        createBooking(event.data.object);
    }

    res.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking, { path: 'user' });
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
