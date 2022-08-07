const { promisify } = require('util');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const User = require('../models/user-model');
const catchAsync = require('../utils/catch-async');
const AppError = require('../utils/app-error');
const Email = require('../utils/email');

const createToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

const createSendToken = (user, statusCode, req, res) => {
    const token = createToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // days to milliseconds
        httpOnly: true, // So that browser only recives and send the cookie on evey request, no modification,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
        // here req.secure is express setting, which will be true when we are on https
        // but req.secure will not work on heroku as it proxies and redirects requests
        // so we use req.headers['x-forwarded-proto'] === 'https' additionally
    };
    // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // makes sure the cookie is sent only in an encrypted connection

    res.cookie('jwt', token, cookieOptions); // Setting the cookie

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: user,
        },
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role,
    });

    // this works for development and production - but is it safe
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exists in req.body
    if (!email || !password) {
        return next(new AppError('Please provide a email and password!', 400));
    }

    // 2) cehck if they are correct
    const user = await User.findOne({ email }).select('+password');

    // 3) If eventythign is ok send token to client
    if (!user || !(await user.validatePassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() * 10 * 1000),
    });

    res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // 1) Get the token and check if it existsSync
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // We are getting only the token from Bearer
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please login to get access', 401));
    }
    // 2) Verify if the token in valid
    const decodedPayload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // How ae we handling the error in token - tampered tokens sent - what does jwt.verify retunt that time

    // 3) Check if the user still exists - How
    const currentUser = await User.findById(decodedPayload.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to token doesnot exist', 401));
    }
    // 4) Check if the password is not changed - HOW do nothing
    if (currentUser.isChangedPasswordAfter(decodedPayload.iat)) {
        // iat is issued at
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    // Pasting the user in the request
    req.user = currentUser;
    // Pasting the user in the request
    res.locals.user = currentUser;

    // Grants access to the protected routes
    next();
});

exports.isLoggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            // 2) Verify if the token in valid
            const decodedPayload = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // How ae we handling the error in token - tampered tokens sent - what does jwt.verify retunt that time

            // 3) Check if the user still exists - How
            const currentUser = await User.findById(decodedPayload.id);
            if (!currentUser) {
                return next();
            }
            // 4) Check if the password is not changed - HOW do nothing
            if (currentUser.isChangedPasswordAfter(decodedPayload.iat)) {
                // iat is issued at
                return next();
            }

            // Pasting the user in the request
            res.locals.user = currentUser;
        }
    } catch (error) {
        return next();
    }
    // Grants access to the protected routes
    return next();
};

exports.restrictTo =
    (...roles) =>
    (req, res, next) => {
        // Here es6 rest syntax is used ...roles roles will be an array of passed in params
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You donot have permission to perform this action', 403));
        }
        next();
    };

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError('This user does not exist', 404)); // Does it lead to User Nemuration
    }

    const resetToken = user.createPasswordResetToken(); // Will be Mailed to the user

    await user.save({ validateBeforeSave: false });

    try {
        // We are doing the try catch here if there are any errors while sendEmail we remove the resetToken from db
        // await Email({
        //     email: user.email,
        //     subject: 'Your password  reset token(valid for 10 mins)',
        //     message,
        // });
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
        await new Email(user, resetUrl).sendResetPassword();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email',
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending email, Try again later!', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Validate the token and find the user
    const hasedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hasedToken, passwordResetTokenExpires: { $gt: Date.now() } });

    // 2) If user exists and token is not expired reset the password
    if (!user) {
        return next(new AppError('Token is invalid or expired', 404)); // Notice the generic message good for production - hacker cannot gather more info from it
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;

    await user.save(); // This save is with validation
    // findOneAndUpdate will not run validators, so always use save when you need validations to kick in

    // 3) changedpasswordResetAt property to current date

    // 4) Login the user and send the token back
    createSendToken(user, 200, req, res);
});

exports.changePassword = catchAsync(async (req, res, next) => {
    // 1) get the user from the collections
    const user = await User.findById(req.user._id).select('password');
    // 2) validate if the current Passowrd is correct
    if (user && !(await user.validatePassword(req.body.currentPassword, user.password)))
        return next(new AppError('The current password is incorrect', 401));

    // 3) Change the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    // Here instead of this we could use findByIdAndUpdate, but then thre pre hooks for save will not work and  validator for password confirm will not work
    await user.save();

    // 4) Login the user with and send the new token

    createSendToken(user, 200, req, res);
});
