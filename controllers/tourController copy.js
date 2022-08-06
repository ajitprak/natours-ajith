// const fs = require('fs');
const Tour = require('../models/tourModel');

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// exports.checkId = (req, res, next, val) => {
//     console.log(`The tour id is ${val}`);
//     const id = val * 1;

//     if (id >= tours.length) {
//         // important to have the return here otherwise express will call next and still run route further
//         return res.status(400).json({
//             status: 'failure',
//             message: 'Invalid id',
//         });
//     }
//     next();
// };

// exports.checkBody = (req, res, next) => { // Mongoose model will take care of this
//     const body = req.body;
//     console.log(body);
//     if (!body.name || !body.price) {
//         return res.status(404).send({
//             status: 'failure',
//             message: 'Invalid Tour',
//         });
//     }
//     next();
// };

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields']; // fields is for selecting certain fields
        excludedFields.forEach((el) => delete queryObj[el]);

        console.log(this.queryString, queryObj);

        //ADVANCED FILTERING
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

        // let query = Tour.find(JSON.parse(queryStr));
        this.query = this.query.find(JSON.parse(queryStr));
        return this; // SO that it can be used for chaining
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy); // sort is a mongoose function
            // sort('price ratings')
        } else {
            // Default sort
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
            // query.select('name duration price')
        } else {
            //Default sortings are
            this.query = this.query.select('-__v');
            // here minis '-' indicates excluding
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = limit * (page - 1);

        //page=2&limit=10 skip=10 limit=10
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

//  route Handlers
exports.getAllTours = async (req, res) => {
    try {
        //BUILD QUERY
        // const queryObj = { ...req.query };
        // const excludedFields = ['page', 'sort', 'limit', 'fields']; // fields is for selecting certain fields
        // excludedFields.forEach((el) => delete queryObj[el]);

        // console.log(req.query, queryObj);

        // //ADVANCED FILTERING
        // let queryStr = JSON.stringify(queryObj);
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

        // let query = Tour.find(JSON.parse(queryStr));

        // { difficulty: 'easy', duration: { $gte: 5 }}

        // const query = Tour.find().where('duration').equals(5).where('difficulty').equals('easy');

        // Sortings are
        // if (req.query.sort) {
        //     const sortBy = req.query.sort.split(',').join(' ');
        //     query = query.sort(sortBy); // sort is a mongoose function
        //     // sort('price ratings')
        // } else {
        //     // Default sort
        //     query = query.sort('-createdAt');
        // }

        // FIELD LIMITING

        // if (req.query.fields) {
        //     const fields = req.query.fields.split(',').join(' ');
        //     query = query.select(fields);
        //     // query.select('name duration price')
        // } else {
        //     //Default sortings are
        //     query = query.select('-__v');
        //     // here minis '-' indicates excluding
        // }

        // PAGINATION
        // const page = req.query.page * 1 || 1;
        // const limit = req.query.limit * 1 || 100;
        // const skip = limit * (page - 1);

        // //page=2&limit=10 skip=10 limit=10
        // query = query.skip(skip).limit(limit);

        // if (req.query.page) {
        //     const totalToursCount = await Tour.countDocuments();
        //     if (skip >= totalToursCount) {
        //         throw new Error('This page does not exists'); //  We are throwing error so it can go to the catch block below
        //     }
        // }

        // EXECUTE QUERY
        const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
        const tours = await features.query;
        // query.sort().select().skip().limt()

        // SEND RESPONSE
        res.status(200).json({
            //jsend specification
            status: 'success',
            results: tours.length,
            data: { allTours: tours },
        });
    } catch (error) {
        res.status(400).json({
            status: 'failed',
            message: error,
        });
    }
};

exports.getTour = async (req, res) => {
    // console.log(req.params);
    const {
        params: { id },
    } = req;
    // const tour = tours.find((el) => el.id === id);

    try {
        const tour = await Tour.findById(id);
        // Tour.findOne({ _id: id })

        res.status(200).json({
            //jsend specification
            status: 'success',
            data: { tour },
        });
    } catch (error) {
        res.status(400).json({
            status: 'failed',
            message: error,
        });
    }
};

exports.createTour = async (req, res) => {
    // const newTour = new Tour({});
    // newTour.save();
    try {
        const newTour = await Tour.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: 'failed',
            message: error, // Dont do in production ready apps
        });
    }
};

exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // then the new updated document will be returned
            runValidators: true,
        });
        res.status(200).json({
            status: 'success',
            data: { tour },
        });
    } catch (error) {
        res.status(400).json({
            status: 'failed',
            message: 'Invlaid data sent', // Dont do in production ready apps
        });
    }
};

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        }); // This content will not be visible in post man as it is 204 ... Not sure wherther it will be visible in browser
    } catch (error) {
        res.status(400).json({
            status: 'failed',
            message: 'Invlaid data sent', // Dont do in production ready apps
        });
    }
};
