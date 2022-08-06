const catchAsync = require('../utils/catch-async');
const AppError = require('../utils/app-error');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError(`No doc found with the id ${req.params.id}`, 404)); // Always return otherwise api will send two responses
        }
        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // then the new updated document will be returned
            runValidators: true, // Validators will run only if this option is set
        });
        if (!doc) {
            return next(new AppError(`No doc found with the given the id ${req.params.id}`, 404)); // Always return otherwise api will send two responses
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

exports.getOne = (Model, populateOptions) =>
    catchAsync(async (req, res, next) => {
        const {
            params: { id },
        } = req;
        const query = Model.findById(id);
        if (populateOptions) query.populate(populateOptions);
        const doc = await query;

        if (!doc) {
            return next(new AppError(`No document found with the id ${id}`, 404)); // Always return otherwise api will send two responses
        }

        res.status(200).json({
            //jsend specification
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        // This is for accessing reviews under tour routes(hack)
        let filter = {};
        if (req.params.tourId) {
            filter = { tour: req.params.tourId };
            console.log(filter);
        }
        // EXECUTE QUERY
        const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();
        // const docs = await features.query.explain(); // for getting execution stats
        const docs = await features.query;
        // query.sort().select().skip().limt() in the background it does this

        // SEND RESPONSE
        res.status(200).json({
            //jsend specification
            status: 'success',
            results: docs.length,
            data: { data: docs },
        });
    });
