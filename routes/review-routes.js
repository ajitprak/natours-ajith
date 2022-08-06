const express = require('express');

const router = express.Router({ mergeParams: true });

const reviewController = require('../controllers/review-controller');
const authController = require('../controllers/auth-controller');

const UserTypes = require('../constants/user-types');

// POST tours/abcde/reviews - Setting merge params true will enable this route to access prev params

// All the routes below can be only accesed after authentication
router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo(UserTypes.User), reviewController.setTourUserId, reviewController.createReview);

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo(UserTypes.User, UserTypes.Admin), reviewController.updateReview)
    .delete(authController.restrictTo(UserTypes.User, UserTypes.Admin), reviewController.deleteReview);

module.exports = router;
