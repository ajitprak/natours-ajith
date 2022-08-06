const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot be empty'],
            maxlength: [200, 'A review can be only 200 characters long'],
            trim: true,
        },
        rating: {
            type: Number,
            required: [true, 'A review must have a rating'],
            max: [5, 'Rating must be less than or equal to 5'],
            min: [0, 'Rating must be greater than or equal to 0'],
        },
        createdAt: { type: Date, default: Date.now(), select: false },
        tour: { type: mongoose.Schema.ObjectId, ref: 'Tour', required: [true, 'A review must belong to a tour'] },
        user: { type: mongoose.Schema.ObjectId, ref: 'User', required: [true, 'A review must belong to an user'] },
    },
    {
        // This is needed if we have any calculated field which is not in the DB here we have tour and user
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    // this.populate({ path: 'tour', select: 'name' }).populate({ path: 'user', select: 'name photo' });
    // Above is commented as it creates to many populates when we fetach a single tour
    this.populate({ path: 'user', select: 'name photo' });

    next();
});
reviewSchema.statics.calculateAvgRating = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].nRating,
        });
    } else {
        // We basically set to default value, default value is not set to zero otherwise it will look bad till a user adds a review
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0,
        });
    }
};

reviewSchema.post('save', function () {
    this.constructor.calculateAvgRating(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
    // To get the doc as find 'this' will point to the query
    this.reviewInstance = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    // this.reviewInstance = await this.findOne();
    // we cannot do the above line here since the query is already executed
    this.reviewInstance.constructor.calculateAvgRating(this.reviewInstance.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
