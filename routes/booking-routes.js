const express = require('express');

const router = express.Router();

const bookingController = require('../controllers/booking-controller');
const authController = require('../controllers/auth-controller');

const userTypes = require('../constants/user-types');

router.post('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession);

router.use(authController.protect, authController.restrictTo(userTypes.Admin, userTypes.LeadGuide));

router.route('/').get(bookingController.getAllBookings).post(bookingController.createBooking);

router
    .route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = router;
