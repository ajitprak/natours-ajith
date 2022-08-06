const User = require('../models/user-model');
const catchAsync = require('../utils/catch-async');
const AppError = require('../utils/app-error');
const factory = require('./handler-factory');
const { uploadToDisk, uploadToMemory, resizeImageAndSave, getExtension } = require('../utils/upload-files');

const filterObj = (obj, ...allowedFields) => {
    const filteredObj = {};
    Object.keys(obj).forEach((key) => {
        if (allowedFields.includes(key)) {
            filteredObj[key] = obj[key];
        }
    });

    return filteredObj;
};

exports.uploadPhoto = uploadToDisk('public/img/users').single('photo');

exports.uploadToMemory = uploadToMemory().single('photo');

exports.resizeImageAndSave = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    // file, fileName, dest, width, height
    const fileName = `user-${req.user.id}-${Date.now()}.${getExtension(req.file)}`;
    req.file.filename = fileName;
    await resizeImageAndSave(req.file, fileName, 'public/img/users', 200, 200);

    next();
});

exports.updateCurrentUser = catchAsync(async (req, res, next) => {
    // 1) If password is sent, return error pass cannot be changed
    if (req.body.password || req.body.changePassword) return next(new AppError('Password cannot be changed', 404));

    // 2) filter only updatable attributes
    const filteredUser = filterObj(req.body, 'email', 'name');
    if (req.file) filteredUser.photo = req.file.filename; // As per multer output fimlename is not camel cased
    // 3) Update the user
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredUser, {
        runValidators: true, // Validators will run only if this option is set
        new: true, // then the new updated document will be returned
    });

    // 3) Send the response
    res.status(200).json({
        status: 'success',
        message: 'User successfully updated',
        data: {
            user: updatedUser,
        },
    });
});

exports.deleteCurrentUser = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined, use /signup instead',
    });
};

exports.getMe = (req, res, next) => {
    // Basically a hack
    req.params.id = req.user.id;
    next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Donot use this to update password
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//     const users = await User.find();

//     // SEND RESPONSE
//     res.status(200).json({
//         //jsend specification
//         status: 'success',
//         results: users.length,
//         data: { allUsers: users },
//     });
// });
