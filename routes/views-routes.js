const express = require('express');

const viewsController = require('../controllers/views-controller');
const authController = require('../controllers/auth-controller');
// const bookingController = require('../controllers/booking-controller');

const router = express.Router();

router.use(authController.isLoggedIn);

router.get('/login', authController.isLoggedIn, viewsController.getLogin);

router.get('/', authController.isLoggedIn, viewsController.getOverview); //  bookingController.createBookingCheckout,
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/me', authController.protect, viewsController.getCurrentAccountPage);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
router.post('/update-user-data', authController.protect, viewsController.updateUserData);

module.exports = router;
