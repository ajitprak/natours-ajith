const express = require('express');

const router = express.Router();

const userController = require('../controllers/userControllers');
const authController = require('../controllers/auth-controller');

const UserTypes = require('../constants/user-types');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Since router is a miniapp we can add middlewares to it
// The routes below this line will need auth - Middlewares work in order(sequence)
router.use(authController.protect);

router.patch(
    '/update-me',
    userController.uploadToMemory,
    userController.resizeImageAndSave,
    userController.updateCurrentUser
);
router.delete('/delete-me', userController.deleteCurrentUser);
router.get('/get-me', userController.getMe, userController.getUser);
router.patch('/change-password', authController.changePassword); // Here patch because we are updating password

// The routes below this will only allowed for admin
router.use(authController.restrictTo(UserTypes.Admin));

router.route('/').get(userController.getAllUsers).post(userController.createUser);
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
