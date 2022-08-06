const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catch-async');
const factory = require('./handler-factory');
const AppError = require('../utils/app-error');
const { uploadToMemory, resizeImageAndSave, getExtension } = require('../utils/upload-files');
// const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

//  route Handlers
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.uploadToMemory = uploadToMemory().fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 },
]);

exports.resizeImagesAndSave = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    // Save Cover image
    const coverFileName = `tour-${req.params.id}-${Date.now()}-cover.${getExtension(req.files.imageCover[0])}`;
    req.body.imageCover = coverFileName;
    await resizeImageAndSave(req.files.imageCover[0], coverFileName, 'public/img/tours', 2000, 1333);

    // Save other Images
    req.body.images = [];
    await Promise.all(
        req.files.images.map(async (image, index) => {
            const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}.${getExtension(image)}`;
            req.body.images.push(fileName);
            await resizeImageAndSave(image, fileName, 'public/img/tours', 2000, 1333);
        })
    );
    next();
});

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                // Specify what we want to group by - null means we want the statistics all in one group as opposed to having in mltiple groups having
                // ratings average for diifculty easy, then for difficulty medium and finalyy for diffuclty hard, basically we are gouping by difculty
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 }, // to get the sum of tours, what this means is that for each document one will be added
                numRating: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' }, // This means we are calculating avg for ratingsAverage( afield in our doc)
                avgPrice: { $avg: '$price' }, // we have to give name of the field in double kotes with $ sign
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            $sort: { avgPrice: 1 },
        },
        // {
        //     $match: { _id: { $ne: 'EASY' } },
        // },
    ]);
    res.status(200).json({
        status: 'success',
        data: { stats },
    });
    // try {
    //     const stats = await Tour.aggregate([
    //         {
    //             $match: { ratingsAverage: { $gte: 4.5 } },
    //         },
    //         {
    //             $group: {
    //                 // Specify what we want to group by - null means we want the statistics all in one group as opposed to having in mltiple groups having
    //                 // ratings average for diifculty easy, then for difficulty medium and finalyy for diffuclty hard, basically we are gouping by difculty
    //                 _id: { $toUpper: '$difficulty' },
    //                 numTours: { $sum: 1 }, // to get the sum of tours, what this means is that for each document one will be added
    //                 numRating: { $sum: '$ratingsQuantity' },
    //                 avgRating: { $avg: '$ratingsAverage' }, // This means we are calculating avg for ratingsAverage( afield in our doc)
    //                 avgPrice: { $avg: '$price' }, // we have to give name of the field in double kotes with $ sign
    //                 minPrice: { $min: '$price' },
    //                 maxPrice: { $max: '$price' },
    //             },
    //         },
    //         {
    //             $sort: { avgPrice: 1 },
    //         },
    //         // {
    //         //     $match: { _id: { $ne: 'EASY' } },
    //         // },
    //     ]);
    //     res.status(200).json({
    //         status: 'success',
    //         data: { stats },
    //     });
    // } catch (error) {
    //     res.status(400).json({
    //         status: 'failed',
    //         message: 'Invlaid data sent', // Dont do in production ready apps
    //     });
    // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' }, // we do a $month operator on the start dates so that we tak our the month from it and group it with the month
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }, // This creates an array our tour names which fall under this group
            },
        },
        {
            $addFields: { month: '$_id' }, // You add an extra field called month and assign it to _id s later we can remove the _id in the next step
        },
        {
            $project: {
                _id: 0, // 0 means false _id will be removed
            },
        },
        {
            $sort: { numTourStarts: -1 },
        },
        {
            $limit: 12,
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: { plan },
    });
    // try {
    //     const year = req.params.year * 1;
    //     const plan = await Tour.aggregate([
    //         {
    //             $unwind: '$startDates',
    //         },
    //         {
    //             $match: {
    //                 startDates: {
    //                     $gte: new Date(`${year}-01-01`),
    //                     $lte: new Date(`${year}-12-31`),
    //                 },
    //             },
    //         },
    //         {
    //             $group: {
    //                 _id: { $month: '$startDates' }, // we do a $month operator on the start dates so that we tak our the month from it and group it with the month
    //                 numTourStarts: { $sum: 1 },
    //                 tours: { $push: '$name' }, // This creates an array our tour names which fall under this group
    //             },
    //         },
    //         {
    //             $addFields: { month: '$_id' }, // You add an extra field called month and assign it to _id s later we can remove the _id in the next step
    //         },
    //         {
    //             $project: {
    //                 _id: 0, // 0 means false _id will be removed
    //             },
    //         },
    //         {
    //             $sort: { numTourStarts: -1 },
    //         },
    //         {
    //             $limit: 12,
    //         },
    //     ]);
    //     res.status(200).json({
    //         status: 'success',
    //         data: { plan },
    //     });
    // } catch (error) {
    //     res.status(400).json({
    //         status: 'failed',
    //         message: 'Invlaid data sent', // Dont do in production ready apps
    //     });
    // }
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    if (!lat || !lng) {
        next(new AppError('Please enter center in the correct format. lat,lng'), 400);
    }

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    if (!lat || !lng) {
        next(new AppError('Please enter center in the correct format. lat,lng'), 400);
    }

    const distMultiplier = unit === 'mi' ? 0.000621371 : 0.001; // Basicaly converting meters to miles or km

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                // It should be the first aggregation type
                // Since only startLocation is indexed as geospacial, this aggreation auto picks that attibure
                // Otherwise we have to tell which attrbute using the keys
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1], // Mutiplying by 1 to convert it to int
                },
                distanceField: 'distance',
                distanceMultiplier: distMultiplier,
            },
        },
        {
            $project: {
                distance: 1,
                name: 1, // So only name and distance is returned
            },
        },
    ]);

    res.status(200).json({
        status: 'success',
        results: distances.length,
        data: {
            data: distances,
        },
    });
});

// exports.getTour = catchAsync(async (req, res, next) => {
//     // console.log(req.params);
//     const {
//         params: { id },
//     } = req;
//     // const tour = tours.find((el) => el.id === id);

//     const tour = await Tour.findById(id).populate('reviews');
//     // Tour.findOne({ _id: id })

//     if (!tour) {
//         return next(new AppError(`No tour found with the id ${id}`, 404)); // Always return otherwise api will send two responses
//     }

//     res.status(200).json({
//         //jsend specification
//         status: 'success',
//         data: { tour },
//     });
//     // // console.log(req.params);
//     // const {
//     //     params: { id },
//     // } = req;
//     // // const tour = tours.find((el) => el.id === id);

//     // try {
//     //     const tour = await Tour.findById(id);
//     //     // Tour.findOne({ _id: id })

//     //     res.status(200).json({
//     //         //jsend specification
//     //         status: 'success',
//     //         data: { tour },
//     //     });
//     // } catch (error) {
//     //     res.status(400).json({
//     //         status: 'failed',
//     //         message: error,
//     //     });
//     // }
// });
// exports.getAllTours = catchAsync(async (req, res, next) => {
//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
//     const tours = await features.query;
//     // query.sort().select().skip().limt() in the background it does this

//     // SEND RESPONSE
//     res.status(200).json({
//         //jsend specification
//         status: 'success',
//         results: tours.length,
//         data: { allTours: tours },
//     });
//     // try {
//     //     // EXECUTE QUERY
//     //     const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
//     //     const tours = await features.query;
//     //     // query.sort().select().skip().limt() in the background it does this

//     //     // SEND RESPONSE
//     //     res.status(200).json({
//     //         //jsend specification
//     //         status: 'success',
//     //         results: tours.length,
//     //         data: { allTours: tours },
//     //     });
//     // } catch (error) {
//     //     res.status(400).json({
//     //         status: 'failed',
//     //         message: error,
//     //     });
//     // }
// });
// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour,
//         },
//     });

// const newTour = new Tour({});
// newTour.save();

// try {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour,
//         },
//     });
// } catch (error) {
//     res.status(400).json({
//         status: 'failed',
//         message: error, // Dont do in production ready apps
//     });
// }
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true, // then the new updated document will be returned
//         runValidators: true, // Validators will run only if this option is set
//     });
//     if (!tour) {
//         return next(new AppError(`No tour found with the given the id ${req.params.id}`, 404)); // Always return otherwise api will send two responses
//     }
//     res.status(200).json({
//         status: 'success',
//         data: { tour },
//     });
// try {
//     console.log(req.params.id, req.body);
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true, // then the new updated document will be returned
//         runValidators: true, // Validators will run only if this option is set
//     });
//     res.status(200).json({
//         status: 'success',
//         data: { tour },
//     });
// } catch (error) {
//     res.status(400).json({
//         status: 'failed',
//         message: error, // Dont do in production ready apps
//     });
// }
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if (!tour) {
//         return next(new AppError(`No tour found with the id ${req.params.id}`, 404)); // Always return otherwise api will send two responses
//     }
//     res.status(204).json({
//         status: 'success',
//         data: null,
//     }); // This content will not be visible in post man as it is 204 ... Not sure wherther it will be visible in browser
// try {
//     await Tour.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//         status: 'success',
//         data: null,
//     }); // This content will not be visible in post man as it is 204 ... Not sure wherther it will be visible in browser
// } catch (error) {
//     res.status(400).json({
//         status: 'failed',
//         message: 'Invlaid data sent', // Dont do in production ready apps
//     });
// }
// });
// exports.getTour = catchAsync(async (req, res, next) => {
//     const {
//         params: { id },
//     } = req;
//     // const tour = tours.find((el) => el.id === id);

//     const tour = await Tour.findById(id).populate('reviews');
//     // Tour.findOne({ _id: id })

//     if (!tour) {
//         return next(new AppError(`No tour found with the id ${id}`, 404)); // Always return otherwise api will send two responses
//     }

//     res.status(200).json({
//         //jsend specification
//         status: 'success',
//         data: { tour },
//     });
// });

// exports.getAllTours = catchAsync(async (req, res, next) => {
//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
//     const tours = await features.query;
//     // query.sort().select().skip().limt() in the background it does this

//     // SEND RESPONSE
//     res.status(200).json({
//         //jsend specification
//         status: 'success',
//         results: tours.length,
//         data: { allTours: tours },
//     });
// });
