const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name !'],
        maxlength: 40,
        minlength: 3,
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true, // All the characters in an email will be converted to lower case, by mistake user enters a caps letter
        validate: [validator.isEmail, 'Please provide a valid Email'],
    },
    photo: { type: String, default: 'default.jpg' },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please enter a passsword'],
        minlength: [8, 'Password must atleast have "8" characters'],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please enter a confirm passsword'],
        validate: {
            validator: function (el) {
                return el === this.password; // This will only work for .create and Save and will not work for findOneAndUpdate
            },
            message: '"Password" and "Confirm Password" must be same',
        },
    },
    active: {
        type: Boolean,
        default: true,
        select: false, // We dont want to leak this field to client
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
});

userSchema.pre('save', async function (next) {
    // Only run this only if the password field is modified, this represents the current doc
    if (!this.isModified('password')) return next();

    // Hash the password with const of 12
    this.password = await bcrypt.hash(this.password, 12);

    // This is we make sure a value is not persisted to the database - even if required field, we can do this,
    // required means only required as input
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    // This pre hook will be applied to all query that starts with find
    this.find({ active: { $ne: false } });
    next();
});
/**
 * Validates the password field
 *
 * @param {*} candidatePassword The password passed in through req.body
 * @param {*} userPassword The hashed password from the DB
 */
userSchema.methods.validatePassword = async function (candidatePassword, userPassword) {
    // Here this.password would not be available as select: false for password
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isChangedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        // User model has a passwordChangedAt field which updates on password change
        const passwordChangedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < passwordChangedTimestamp;
    }
    // False means not changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 mins(10 * 60 sec * 1000ms)
    // console.log({ resetToken }, this.passwordResetToken);

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
