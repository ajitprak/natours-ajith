const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// const User = require('./user-model');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name must be less that equal to 40 characters'],
            minlength: [10, 'A tour name must be less that equal to 10 characters'],
            // validate: [validator.isAlpha, 'A tour name must contain only characters'],
        },
        slug: String,
        duration: { type: Number, required: [true, 'A tour must have a duration'] },
        maxGroupSize: { type: Number, required: [true, 'A tour must have a group size'] },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty must be either: easy, medium or difficult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be equal to or greater than 1'],
            max: [5, 'Rating must be equal to or less than 5'],
            set: (val) => Math.round(val * 10) / 10, // So that we donot round to integers and keep the value
        },
        ratingsQuantity: { type: Number, default: 0 },
        price: { type: Number, required: [true, 'A tour must have a price'] },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this keword only works for creating new document and not for edit
                    // so this here will be null, And this function will always return false so there will be always a validation error
                    return val < this.price;
                },
                message: 'Discount price ({VALUE}) should be below regular price',
            },
        },
        summary: { type: String, trim: true, required: [true, 'A tour must have a description'] },
        description: { type: String, trim: true },
        imageCover: { type: String, required: [true, 'A tour must have a imageCover'] },
        images: [String],
        createdAt: { type: Date, default: Date.now(), select: false }, // Date.now will give timestamp in milliseconds for current time
        startDates: [Date], // This is how you specify an array of start dates
        secretTour: { type: Boolean, default: false },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number], // longitude, lattitude here - reverse of the nomal convention
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour', // The field in the reference schema
    localField: '_id', // Field in the current schema
});

// DOcument middleware: runs before .save() command and .create() command
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// For embedding - but not recomended
// tourSchema.pre('save', async function (next) {
//     const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//     this.guides = await Promise.all(guidesPromise);

//     next();
// });

// tourSchema.pre('save', function(next) => {
//     console.log('Will save document');
//     next();
// });

// // Document middleware: post
// tourSchema.post('save', (doc, next) => {
//     console.log(doc);
//     next();
// });

// Query middleware
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    });
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`This query took ${Date.now() - this.start} milliseconds`);
    next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     console.log(this);
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     console.log('PIPLINE', this.pipeline());
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
