const Review = require('../models/review-model');
const factory = require('./handler-factory');
// const catchAsync = require('../utils/catch-async');

exports.setTourUserId = (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) {
        req.body.tour = req.params.tourId;
    }
    if (!req.body.user) {
        req.body.user = req.user.id;
    }

    next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);

// The below implemetation is safer as we pass in only known values to mongo as opposed to passing req.body direcly resulting in security issues
// exports.createReview = catchAsync(async (req, res, next) => {
//     const review = {};
//     review.review = req.body.review;
//     review.rating = req.body.rating;
//     review.createdAt = Date.now();
//     review.tour = req.body.tour;
//     review.user = req.body.user;

//     // The attributes which are not there in the review schema will be ignored by mongo, but it is still safer to do like above
//     const newReview = await Review.create(review);

//     res.status(201).json({
//         message: 'success',
//         data: { review: newReview },
//     });
// });

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//     let filter = {};
//     if (req.params.tourId) {
//         filter = { tour: req.params.tourId };
//     }
//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data: { reviews },
//     });
// });
