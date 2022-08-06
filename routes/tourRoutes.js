const express = require('express');
// const fs = require('fs');

const router = express.Router();

const tourController = require('../controllers/tourController');
const authController = require('../controllers/auth-controller');
// const reviewController = require('../controllers/review-controller');
const reviewRouter = require('./review-routes');

const UserTypes = require('../constants/user-types');

// router.param('id', tourController.checkId);

// When this route pattern is mached use the review Router
router.use('/:tourId/reviews', reviewRouter);
// router.route('/:tourId/reviews').post(authController.protect, reviewController.createReview);

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

// GET /tours-within/400/center/8.221951,77.354137/unit/km
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

// GET /distances/8.221951,77.354137/unit/km
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo(UserTypes.Admin, UserTypes.LeadGuide, UserTypes.Guide),
        tourController.getMonthlyPlan
    );

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo(UserTypes.Admin, UserTypes.LeadGuide),
        tourController.createTour
    );
router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo(UserTypes.Admin, UserTypes.LeadGuide),
        tourController.uploadToMemory,
        tourController.resizeImagesAndSave,
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo(UserTypes.Admin, UserTypes.LeadGuide),
        tourController.deleteTour
    );

module.exports = router;
